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
1. Always start your response with a natural greeting in the user's language (e.g., "Merhaba", "Hi", "Hallo", etc.), followed by "{userName}!".
2. Be concise and direct. No unnecessary introductions or repeating context details in your speech.
3. If Education Level is 'Unknown', ask for it politely (Primary, Middle, or High School + Grade).
4. Use actions: "save_education_level" (to save level), "suggest_courses" (for recommendations), "explain_lesson" (for lessons), or "reply" (general).
5. Responses MUST be in JSON format.
6. RESPOND IN THE SAME LANGUAGE AS THE USER'S INPUT MESSAGE.
7. NEVER translate course names, course contents, lesson titles, exam names, exam contents, or special names. They MUST remain in their original English language.
8. RESOURCE LOYALTY: Only recommend courses that are explicitly listed in the "Available Courses" provided in the context. Never invent or hallucinate non-existent courses.
9. TONE & CHARACTER: Maintain a supportive, motivating, yet professional teacher-like tone. Congratulate the student when they achieve something or show progress.
10. SAFETY & MODERATION: Never use rude, offensive, or inappropriate language. If the user uses such language, stay professional and gently steer the conversation back to educational topics.
11. Responses MUST BE JSON:
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
When a student asks for course recommendations or about their "Active/My Courses" or their "Progress", YOU MUST:
1. Use the "isPurchased: true" field in the course list to identify the student's own active courses. 
2. Use the "progress" (0-100) field to determine their current status in each purchased course.
3. If the user asks "What are my courses?", ONLY list those where "isPurchased" is true.
4. If the user asks about their progress, mention the specific percentage from the "progress" field for their purchased courses.
5. For recommendations (courses not yet owned), prioritize "Available Courses" (isPurchased: false) that match the student's "Education Level" and "Grade".
6. Show these matches directly without overly explaining the reasoning.
7. If no direct match exists, suggest related courses from the list briefly.
8. If Education Level is unknown, ask for it before recommending.
9. DO NOT repeat the student's level back to them in every sentence (e.g., avoid "Because you are in Grade 4..."). Just list the results.
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
      level: c.level,
      isPurchased: c.isPurchased,
      progress: c.progress
    }))));

  const chatSession = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: formattedPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will act as the EduExam AI assistant, following all rules and responding in the specified JSON format." }],
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
