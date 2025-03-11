const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyBLQcIpyMPG0Q4LN2jKSliWCJc6Tt9b7pk");

// Generate quiz questions
app.post("/generate-quiz", async (req, res) => {
  const { subject, numQuestions } = req.body;
  if (!subject) {
    return res.status(400).json({ error: "Subject is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Generate a ${numQuestions}-question multiple-choice quiz on ${subject}. 
Each question should have four options and one correct answer. 
Return the result in **valid JSON format** as shown below:

\`\`\`json
[
  {
    "question": "What does PHP stand for?",
    "options": ["Personal Home Page", "Hypertext Preprocessor", "Preprocessor Hypertext", "Private Home Page"],
    "answer": "Hypertext Preprocessor"
  },
  {
    "question": "Which statement is used to start a PHP code block?",
    "options": ["<?php", "<php>", "<?>", "<!--php-->"],
    "answer": "<?php"
  }
]
\`\`\`

Make sure the response **only** contains the JSON output without any extra text.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = await result.response;
    const quizResponse = await response.text(); // ✅ Await it properly

    // Extract JSON using lastIndexOf()
    const startResponse = quizResponse.indexOf("["); // First occurrence of "["
    const endResponse = quizResponse.lastIndexOf("]") + 1; // ✅ LAST occurrence of "]"

    if (startResponse === -1 || endResponse === 0) {
      return res
        .status(500)
        .json({ error: "Invalid response format from AI." });
    }

    const quizText = quizResponse.substring(startResponse, endResponse);

    return res.status(200).json({ quizText });
  } catch (error) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
