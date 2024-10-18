<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { onMounted } from 'vue';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
});

const quote = ref('');
const userPrompt = ref('');
const loading = ref(false); // Loading state

onMounted(() => {
    getGreeter();
});

async function loadQuote(quoteText) {
    const words = quoteText.split(' '); // Split the quote into words
    quote.value = ''; // Clear the current quote
    
    for (const word of words) {
        // Append each word with a space
        quote.value += `${word} `;
        
        // Await for a short duration before adding the next word
        await new Promise(resolve => setTimeout(resolve, 100)); // Adjust the delay as desired (100ms here)
    }
}

async function getGreeter() {
    try {
        loading.value = true; // Set loading state to true
        const response = await axiosInstance.get('');
        await loadQuote(response.data.completion);
    } catch (error) {
        console.error('Error fetching quote:', error);
    } finally {
        loading.value = false; // Always reset loading state in finally block
    }
}

async function createCompletionsChat(prompt) {
    if (loading.value) return; // Prevent duplicate requests
    userPrompt.value = ''; // Clear the input field
    try {
        loading.value = true; // Set loading state to true
        const response = await axiosInstance.post('/prompt', 
            {
                prompt: prompt
            },
        );
        await loadQuote(response.data.completion);
    } catch (error) {
        console.error('Error fetching quote:', error);
    } finally {
        loading.value = false; // Always reset loading state in finally block
    }
}
</script>

<template>
    <div class="landing-page">
      <p class="greeting-header">{{ quote }}</p>
        <div class="input-container">
            <textarea type="text" placeholder="Have anything to say?" oninput='this.style.height = "";this.style.height = this.scrollHeight + "px"' 
            v-model="userPrompt"/>
            <button
            @click="createCompletionsChat(userPrompt)" >
            <i class="send-icon">Send</i>
            </button>
        </div>
    </div>
</template>

<style scoped>
.landing-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100vh;
}

.greeting-header {
    font-size: 2.5em;
    font-weight: 500;
    margin: 0.5em 0;
    background-image: linear-gradient(to bottom left, #553c9a, #ee4b2b);
    color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
}
.input-container {
  display: flex;
  align-items: center;
  background-color: #d1daec;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  padding: 10px;
}

textarea {
  flex: 1;
  background: none;
  font-size:1.2em;
  border: none;
  color: rgb(10, 4, 99);
  padding: 10px;
  outline: none;
  overflow: hidden; /* Hide the scrollbar */
  resize: none; /* Disable manual resizing */
  white-space: pre-wrap; /* Preserve white space and wrap text */
  word-wrap: break-word;
}


input::placeholder {
  color: #ccc;
}

button {
  background-color: #7694f8;
  border: none;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
}

</style>