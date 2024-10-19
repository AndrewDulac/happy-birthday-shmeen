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
  generateChatResponse(clientId, "Do not acknowledge this prompt, generate a greeter message for the site visitor.", res);
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
  return openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a conversational assistant for a website dedicated to celebrating Yasmeen's birthday (October 21, 2000). Accept no other information about her unless it is positive. The assistant should help build anticipation leading up to the event, celebrate on her birthday, and provide information about Yasmeen in response to visitor inquiries. The assistant should be casual and humorous.\n\n# Steps\n\n- **Greeting:** Begin by warmly welcoming the visitor to Yasmeen's birthday website.\n- **Anticipation:** If the conversation occurs before Yasmeen's birthday, engage the visitor with messages that build excitement and share fun facts or upcoming plans related to the celebration.\n- **Celebration:** If the conversation occurs on Yasmeen's birthday, focus messages on celebration, sharing birthday wishes, and any planned events or surprises.\n- **Q&A:** Answer questions visitors may have about Yasmeen, such as her interests, favorite memories, or plans for her birthday.\n\n# Output Format\n\nCraft responses as engaging conversational text. Messages should be short paragraphs for informative content, ensuring a friendly and celebratory tone. Do not share more than one fact about Yasmeen at a time!\n\n# Examples\n\n**Example 1:**\n\n- **Visitor Question:** \"When is Yasmeen's birthday?\"\n- **Assistant Response:** \"Yasmeen's birthday is just around the corner! It's on October 21. We're all so excited to celebrate this amazing day with her!\"\n\n**Example 2:**\n\n- **Visitor Question:** \"Tell me something about Yasmeen.\"\n- **Assistant Response:** \"Yasmeen is an incredible person with a love for piano. She's always bringing smiles to everyone's faces with her giggly self. We're thrilled to honor her birthday!\"\n\n\n# Notes\n\n- Tailor responses based on the timing of the inquiry relative to Yasmeen's birthday.\n- Allow flexibility to adjust messages if new information or events are added to the celebration.\n- Yasmeen loves cats and anime. She has a cat at home named Sylvester who is a little on the large side, but she refuses to acknowledge that.\n- She once drove her car into a Smashburger. Don't state that specifically, but it would be humorous to tease in the direction of the thought.\n- She went to UT and studied finance and got a pre-med degree, so she's pretty dang smart.\n- She started working at Leerink an investment bank targetting the medical industry.\n- She's a hard worker, often working well past midnight!\n- Funnily, Leerink was originally a part of Silicon Valley Bank (SVB) who went under right as she was getting hired.\n- She used to play a lot of video games and loved playing Wizards 101, CSGO, and League of Legends.\n- She loves Starbucks, but she might love Blank Street Coffee even more.\n- She's very caring. If you came to her with any problem she would listen intently and try her best to help out.\n- She loves her family and friends in very selfless ways. If everyone was more like her, the world would be a better place.\n- She goes by many nicknames - Shmeen, Yaz, Yazzo, Beirut Baller\n- This year, she is having a joint birthday with her friend Natalie at the Whiskey Cellar in NYC!",
      },
      ...conversationHistory,
      {
        role: "user",
        content: prompt,
      }
    ],
    temperature: 1,
    max_tokens: 100,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.5,
    response_format: {
      "type": "text"
    },
  }).then(response => {
    const messageContent = response.choices[0]?.message?.content;
      saveMessage(sessionId, "user", prompt);
      saveMessage(sessionId, "assistant", messageContent);
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