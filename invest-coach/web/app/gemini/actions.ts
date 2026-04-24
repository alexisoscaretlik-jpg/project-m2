"use server";

// Server action that forwards chat messages to Google Gemini 2.5 Flash.
// Uses the GEMINI_API_KEY already in .env.local. Keeps the API key
// server-side so it's never shipped to the browser.

export type ChatMessage = {
  role: "user" | "model";
  content: string;
};

export async function sendToGemini(
  history: ChatMessage[],
  newMessage: string,
): Promise<{ reply: string } | { error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY not set on the server." };
  }
  if (!newMessage.trim()) {
    return { error: "Empty message." };
  }

  try {
    // Dynamic import — matches the pattern in app/admin/notes/actions.ts
    // and lib/tax/gemini.ts so the build doesn't fail if the package
    // isn't installed at build time.
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Build the contents array: full history + new user message.
    const contents = [
      ...history.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: newMessage }] },
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
    });

    const reply = (response.text ?? "").trim();
    if (!reply) {
      return { error: "Gemini returned an empty response." };
    }
    return { reply };
  } catch (e) {
    return { error: `Gemini call failed: ${(e as Error).message}` };
  }
}
