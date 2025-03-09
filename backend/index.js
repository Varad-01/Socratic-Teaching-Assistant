require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// In-memory conversation history
let conversationHistory = [];

app.post('/ask-ai', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required." });
    }

    // Save the user's message in history
    conversationHistory.push({ role: "student", message });

    // Build a dynamic prompt with conversation history
    const historyText = conversationHistory
        .map((entry) => `${entry.role === "student" ? "Student" : "Assistant"}: ${entry.message}`)
        .join("\n");

    const prompt = `
    You are a teaching assistant for Data Structures and Algorithms, using the Socratic method to guide students. Maintain the context of the conversation and give responses accordingly.
    
    Rules:
    1. Ask step-by-step questions to help the student figure out the answer.  
    2. Never give the final answer directly — lead the student with probing questions.  
    3. If the student’s response is incorrect, gently correct them with a follow-up question.  
    4. Use small examples to illustrate concepts and ask the student to predict the next step.  
    5. When comparing algorithms, ask what aspect the student wants to compare (e.g., speed, space, stability).  
    6. For time complexity questions, explain with real-world analogies (like doubling list size) and prompt the student to guess the impact.  
    7. If the student suggests an impossible scenario (like O(1) sorting), explain why it’s impossible and ask what trade-offs they’d consider.  
    8. Acknowledge topic shifts and transition smoothly with a relevant follow-up question.  
    9. For vague or overly broad queries, give a concise summary and ask what aspect the student wants to explore.  
    10. NOTE(Important): If the student asks for a direct explanation of something factual, give it directly without being overly Socratic.

    Conversation so far:  
    ${historyText}

    Student’s latest input:  
    "${message}"

    Respond thoughtfully, using the conversation history for context.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Save the assistant’s reply in history
        conversationHistory.push({ role: "assistant", message: text });

        res.json({ aiResponse: text });
    } catch (error) {
        console.error("Error with GenAI:", error);
        res.status(500).json({ error: "Failed to fetch AI response" });
    }
});

// Clear conversation history (optional)
app.post('/clear-history', (req, res) => {
    conversationHistory = [];
    res.json({ message: "Conversation history cleared." });
});

app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
});
