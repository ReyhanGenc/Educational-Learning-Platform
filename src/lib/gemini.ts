import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite-preview", 
  generationConfig: {
    responseMimeType: "application/json",
  },
});

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface AIResponse {
  action: "reply" | "suggest_courses" | "explain_lesson" | "save_education_level";
  data?: any;
  message: string;
}

const SYSTEM_PROMPT = `
You are a helpful AI assistant for students on the EduExam platform.
Rules:
1. Always start your response with "Hello {userName}!".
2. Be concise and direct. No unnecessary introductions or repeating context details in your speech.
3. If Education Level is 'Unknown', ask for it politely (Primary, Middle, or High School + Grade).
4. Use actions: "save_education_level" (to save level), "suggest_courses" (for recommendations), "explain_lesson" (for lessons), or "reply" (general).
5. Responses MUST be in JSON:
{
  "action": "reply" | "suggest_courses" | "explain_lesson" | "save_education_level",
  "data": { "level": "e.g. High School - Grade 10" }, 
  "message": "Direct and concise answer here"
}

Context:
- User Name: {userName}
- Education Level: {educationLevel}
- Current Page: {currentPage}
- Current Lesson: {currentLesson}
- Available Courses: {courses}

Core Instruction for Courses: 
When a student asks for course recommendations, YOU MUST:
1. Check their "Education Level". 
2. Prioritize "Available Courses" that match the student's "Education Level" and "Grade".
3. Show these matches directly without overly explaining the reasoning.
4. If no direct match exists, suggest related courses briefly.
5. If Education Level is unknown, ask for it before recommending.
6. DO NOT repeat the student's level back to them in every sentence (e.g., avoid "Because you are in Grade 4..."). Just list the results.
`;

export async function sendMessageToAI(
  userMessage: string,
  history: ChatMessage[],
  context: {
    userName: string;
    educationLevel?: string;
    currentPage: string;
    currentLesson?: string;
    courses: any[];
  }
): Promise<AIResponse> {
  const formattedPrompt = SYSTEM_PROMPT
    .replace('{userName}', context.userName)
    .replace('{educationLevel}', context.educationLevel || 'Unknown')
    .replace('{currentPage}', context.currentPage)
    .replace('{currentLesson}', context.currentLesson || 'None')
    .replace('{courses}', JSON.stringify(context.courses.map(c => ({ 
      id: c.id, 
      title: c.title, 
      category: c.category, 
      education_level: c.education_level,
      level: c.level 
    }))));

  const chatSession = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: formattedPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Anladım. EduExam asistanı olarak hazırım. JSON formatında yanıt vereceğim." }],
      },
      ...history,
    ],
  });

  const result = await chatSession.sendMessage(userMessage);
  const responseText = result.response.text();

  try {
    return JSON.parse(responseText) as AIResponse;
  } catch (e) {
    console.error("AI Response Parsing Error:", e, responseText);
    return {
      action: "reply",
      message: "Üzgünüm, şu an yanıt veremiyorum. Lütfen tekrar dener misin?",
    };
  }
}
