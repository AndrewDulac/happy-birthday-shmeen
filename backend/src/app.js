import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./conversationHistory.db');

var app = express();

var corsOptions = {
  origin: process.env.LOCAL_FRONTEND_URL,
  credentials: true, // Enable credentials
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
dotenv.config();

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS history (
    sessionId TEXT,
    role TEXT,
    content TEXT
  )`);
});

const greeterPrompt = "Do not acknowledge this prompt, generate a greeter message for the site visitor.";
const introduction = "You're the ultimate hype machine for Yasmeen's birthday bash (October 21, 2000). Only good vibes and good times here! Your mission: crank up the excitement, celebrate like there's no tomorrow, and drop fun facts about Yasmeen. Think of yourself as the DJ of this party, making sure everyone has a blast and the drinks keep flowing.";

const steps = `
# Steps

- **Greeting:** Start with a warm and enthusiastic welcome to Yasmeen's birthday site. Make them feel like they've just walked into the hottest party in town.
- **Encourage Engagement:** Get the visitor to join the fun by asking about Yasmeen or sharing their birthday excitement. Think of it as getting everyone on the dance floor.
- **Q&A:** Answer any burning questions about Yasmeen, like her favorite hobbies, memorable moments, or birthday plans. Keep it fun and lively, like you're chatting at the bar.
`;

const outputFormat = `
# Output Format

No emojis, but keep it lively! Responses should be short, engaging, and full of personality. Share one fun fact about Yasmeen at a time to keep the conversation flowing, like a great DJ set.
`;

const notes = `
# Notes

- Adjust responses based on how close it is to Yasmeen's birthday.
- Be ready to update messages if new info or events pop up.
`;

const funFacts = [
  "Yasmeen loves cats. She has a cat at home who is a little on the large side, but she refuses to acknowledge that.",
  "She went to UT and studied finance and got a pre-med degree, so she's pretty dang smart.",
  "She started working at Leerink, an investment bank targeting the medical industry.",
  "She's a hard worker, often working well past midnight.",
  "She used to play a lot of video games and loved playing Wizards 101, CSGO, and League of Legends.",
  "She loves Starbucks, but she might love Blank Street Coffee even more.",
  "She's very caring. If you came to her with any problem she would listen intently and try her best to help out.",
  "She loves her family and friends in very selfless ways. If everyone was more like her, the world would be a better place.",
  "She goes by many nicknames - Shmeen, Yaz, and Yazo.",
  "This year, she is having a joint birthday with her friend Natalie at the Whiskey Cellar in NYC!",
  "Her favorite color is pink",
  "Her favorite anime is One Piece",
  "Ask her about her Strava runs!",
  "Ask her about her past life as a track star!",
  "She loves Bud Light Seltzers and Espresso Martinis so buy her one!",
  "She loves to watch the TV show Love Island",
  "Her favorite sick food is tomato soup and grilled cheese",
  "She loves Yardhouse mac and cheese",
  "She loves talking about being in London",
  "She's always late",
  "She loves Mexican food",
  "She used to be a math TA, but she's a little rusty now",
];

const funFactsString = funFacts.map(fact => `- ${fact}`).join('\n');

const conditioningPrompt = `
${introduction}

${steps}

${outputFormat}

${notes}

${funFactsString}
`;
const openai = new OpenAI({
  apiKey: process.env.VITE_OPEN_API_KEY,
});

app.post('/prompt', function (req, res) {  
  const clientId = ensureClientId(req, res);
  //res.send({completion: "A long mock introduction A long mock introduction A long mock introduction A long mock introduction A long mock introduction A long mock introduction A long mock introduction A long mock introduction A long mock introduction"})
  generateChatResponse(clientId, req.body.prompt, res);
})

app.get('/', function (req, res) {
  const clientId = generateClientId();
  res.cookie('clientId', clientId, { httpOnly: true });
  //res.send({completion: "A mock long response A mock long response A mock long response A mock long response A mock long response A mock long response A mock long response A mock long response A mock long response A mock long response A mock long response"})
  generateChatResponse(clientId, greeterPrompt, res);
})

app.get('/is-secret', function (req, res) {
  res.send({is_secret_phrase: process.env.SECRET_PHRASE == req.body.prompt})
})

function getConversationHistory(sessionId) {
  return new Promise((resolve, reject) => {
    db.all("SELECT role, content FROM history WHERE sessionId = ?", [sessionId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => ({ role: row.role, content: row.content })));
      }
    });
  });
}

function saveMessage(sessionId, role, content) {
  db.run("INSERT INTO history (sessionId, role, content) VALUES (?, ?, ?)", [sessionId, role, content]);
}

async function generateChatResponse(sessionId, prompt, res) {
  const conversationHistory = await getConversationHistory(sessionId);
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Today is ${currentDate}. ${conditioningPrompt}`,
      },
      ...conversationHistory,
      {
        role: "user",
        content: prompt,
      }
    ],
    temperature: 1,
    max_tokens: 300,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.5,
    response_format: {
      "type": "text"
    },
  }).then(response => {
    const messageContent = response.choices[0]?.message?.content;
    if (prompt != greeterPrompt){
      saveMessage(sessionId, "user", prompt);
      saveMessage(sessionId, "assistant", messageContent);
    }
      res.send({completion: messageContent});
  }).catch(err => {
    console.error('Error from OpenAI API:', err);
    if (err.response) {
        // API responded with a status code
        if (err.response.status === 429) {
            // Handle rate limit error
            res.status(429).send("Rate limit exceeded. Please try again later.");
        } else if (err.response.status === 401) {
            // Handle authentication error (e.g., invalid API key)
            res.status(401).send("Authentication error with AI service. Verify API credentials.");
        } else {
            // Other HTTP-level errors
            res.status(err.response.status).send(`OpenAI API error: ${err.response.statusText}`);
        }
    } else if (err.request) {
        // No response received from API
        console.error('No response received:', err.request);
        res.status(502).send("No response from AI service. Please try again later.");
    } else {
        // Other errors
        console.error('Error during request setup:', err.message);
        res.status(500).send("An unexpected error occurred when connecting to the AI service.");
    }
  });
}

function ensureClientId(req, res) {
  let clientId = req.cookies.clientId;
  if (!clientId) {
    clientId = generateClientId();
    res.cookie('clientId', clientId, { httpOnly: true });
  }
  return clientId;
}

function generateClientId() {
  return 'client-' + Math.random().toString(36).substr(2, 9);
}

app.listen(process.env.BACKEND_PORT, function () {
   console.log("Express App running at http://127.0.0.1:" + process.env.BACKEND_PORT);
   console.log("Allowing requests from: " + process.env.LOCAL_FRONTEND_URL);
})