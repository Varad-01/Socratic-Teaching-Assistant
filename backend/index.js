require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to handle retries with exponential backoff
const generateContentWithRetry = async (prompt, maxRetries = 5, delayMs = 2000) => {
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            if (error.status === 429) {
                console.warn(`Rate limit hit. Retrying in ${delayMs}ms... (Attempt ${attempts + 1}/${maxRetries})`);
                await delay(delayMs);
                delayMs *= 2; // Exponential backoff
                attempts++;
            } else {
                throw error;
            }
        }
    }

    throw new Error("Failed to fetch AI response after multiple retries.");
};

app.post('/ask-ai', async (req, res) => {
    const { message, conversationHistory } = req.body;

    // Build a dynamic prompt with conversation history
    const prompt = `
    You are a teaching assistant for Data Structures and Algorithms, using the Socratic method to guide students.

    Rules:
    1. Ask step-by-step questions to help the student figure out the answer.
    2. Never give the final answer directly — lead the student with probing questions.
    3. If the student’s response is incorrect, gently correct them with a follow-up question.
    4. Use small examples to illustrate concepts and ask the student to predict the next step.
    5. When comparing algorithms, ask what aspect the student wants to compare (e.g., speed, space, stability).
    6. For time complexity questions, explain with real-world analogies and prompt the student to guess the impact.
    7. If the student suggests an impossible scenario (like O(1) sorting), explain why it’s impossible and ask what trade-offs they’d consider.
    8. Acknowledge topic shifts and transition smoothly with a relevant follow-up question.
    9. For vague or overly broad queries, give a concise summary and ask what aspect the student wants to explore.

    Student’s input:
    "${message}"

    Respond with a thoughtful question to guide the student.
    `;

    try {
        const aiResponse = await generateContentWithRetry(prompt);
        res.json({ aiResponse });
    } catch (error) {
        console.error("Error with GenAI:", error);

        if (error.message.includes('Failed to fetch AI response after multiple retries')) {
            res.status(429).json({ error: "Rate limit exceeded. Please wait and try again later." });
        } else {
            res.status(500).json({ error: "Failed to fetch AI response. Please try again later." });
        }
    }
});

app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
});
