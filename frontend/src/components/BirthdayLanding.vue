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
      <div class="interaction-container">
        <div class="input-container">
          <input 
            v-model="userPrompt"
            type="text" 
            placeholder="Type your message..."
            class="input-box"
          />
          <button 
            @click="createCompletionsChat(userPrompt)" 
            class="submit-button" 
            :disabled="loading"
          >
            <div v-if="loading" class="spinner"></div>
            <span v-else>Submit</span>
          </button>
        </div>
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

.interaction-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: left;
    width: 60vw;
    max-width: 600px;
}

.chat-response {
    padding: 10px;
    margin-bottom: 10px;
    width: 100%;
    background-color: #fbc2eb; /* Light pink background for chat response */
    border-radius: 8px;
    color: #333; /* Darker text for readability */
}

.input-container {
    display: flex;
    width: 100%;
    transition: transform 0.3s ease-in-out; /* Smooth transition for the input container */
}

.input-container:hover {
    transform: scale(1.01); /* Slightly scale the input container on hover */
}

.input-box {
    flex: 1;
    padding: 12px;
    border: 1px solid #fda085; /* Updated border color */
    border-radius: 50vh 0 0 50vh;
    box-sizing: border-box;
    outline: none; /* Remove default outline */
    transition: border-color 0.3s ease, box-shadow 0.3s ease; /* Add transitions */
}

.input-box:focus {
    border-color: #ee4b2b; /* Change border color on focus */
    box-shadow: 0 0 5px rgba(238, 75, 43, 0.5); /* Add shadow when focused */
}

.submit-button {
    padding: 12px 20px;
    border: 1px solid #fda085; /* Updated border color */
    border-left: none;
    border-radius: 0 50vh 50vh 0;
    background-color: #f6d365; /* Updated background color */
    color: white;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.3s ease; /* Add transitions */
}

.submit-button:hover {
    background-color: #fda085; /* Updated hover color */
    transform: translateY(-3px); /* Slight upward movement on hover */
}

.submit-button:active {
    transform: translateY(1px); /* Press effect */
}

.spinner {
    width: 20px;
    height: 20px;
    border: 3px solid #fda085; /* Border color */
    border-top: 3px solid #ee4b2b; /* Top color */
    border-radius: 50%;
    animation: spin 1s linear infinite; /* Spinning animation */
    margin-right: 8px; /* Space between spinner and text */
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>