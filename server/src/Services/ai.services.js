import fs from 'fs';
import { groq } from '../Config/groq.js';
import { err } from 'inngest/types';

const generateQuiz = async ({ text, difficulty }) => {
  try {
    console.log('Quiz Generation Started ');

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `
  You are an expert quiz-generation AI. Your task is to generate **exactly 15 multiple-choice questions (MCQs)** based on the text provided by the user. Follow these instructions carefully to ensure high-quality, structured output:
  
  1. **Question Format (per question):**
     - "questionText": Write a clear, concise, and unambiguous question derived from the text. Avoid overly complex wording.
     - "options": Provide **exactly 4 answer choices** as strings. These should be plausible and related to the content, with only one correct answer.
     - "correctAnswer": Specify the **exact text** of the correct option from the "options" array. Do **not** use an index; always use the text itself.
     - "explanation": Provide a brief explanation (1–2 sentences) of why the correct answer is correct. Optional but highly recommended for learning purposes.
  
  2. **Quiz-Level Rules:**
     - Generate **exactly 15 questions**. No more, no less.
     - Ensure questions cover a broad range of key concepts from the provided text.
     - Avoid repetition; each question should be unique and focus on a different concept or fact.
     - Tailor the questions to match the difficulty level provided by the user: "easy", "medium", or "hard". Do not change the output format for different difficulties.
  
  3. **Output Rules:**
     - Output must be a **single JSON array** containing 15 question objects.
     - Do **not** include any text outside the JSON array.
     - Do **not** include additional fields beyond those specified in the question format.
     - Ensure valid JSON that can be directly parsed by a program.
  
  4. **Content Rules:**
     - Base all questions strictly on the content provided.
     - Questions should be answerable from the text; do not invent facts.
     - Make questions educational, clear, and unambiguous.
     - Distractors (wrong options) should be plausible to make the quiz challenging.
  
  5. **Example Output (JSON array):**
  [
    {
      "questionText": "What is the capital of France?",
      "options": ["Berlin", "Madrid", "Paris", "Rome"],
      "correctAnswer": "Paris",
      "explanation": "Paris is the capital city of France."
    },
    ...
  ]
  
  Follow these instructions precisely and generate the 15 questions in the specified format, tailored to the user's requested difficulty.
          `,
        },
        {
          role: 'user',
          content: `Here is the text for generating questions: ${text} \n Difficulty level: ${difficulty}`,
        },
      ],
      // model: 'openai/gpt-oss-120b',
      model: 'llama-3.1-8b-instant',

      temperature: 0,
      response_format: { type: 'json_object' },
      max_completion_tokens: 8192,
      stream: false,
      // reasoning_effort: 'medium',
      stop: null,
    });

    return JSON.parse(chatCompletion.choices[0].message.content); // returns array of objects following questionSchema
  } catch (error) {
    console.log(
      'Error while generating Quiz in generateQuiz : ',
      error.message
    );
    throw error;
  }
};
const generateTranscript = async (filePath) => {
  try {
    console.log('Generating transcription started : ');

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      // model: 'whisper-large-v3-turbo',
      model: 'whisper-large-v3',

      response_format: 'text',
      language: 'en', // This makes the output English
    });
    return transcription;
  } catch (error) {
    console.log(
      'Error while generating transcript in generateTranscript : ',
      error.message
    );
    throw error;
  }
};

export { generateQuiz, generateTranscript };
