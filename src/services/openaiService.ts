import OpenAI from "openai";

type MemoryTurn = {
  user: string;
  assistant: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder"
});

export type ChatCompletionResult = {
  message: OpenAI.Chat.Completions.ChatCompletionMessage;
  confidence: number;
};

export async function createChatCompletion(message: string, memory: MemoryTurn[] = []): Promise<ChatCompletionResult> {
  const memoryMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = memory.flatMap((turn) => [
    { role: "user", content: turn.user },
    { role: "assistant", content: turn.assistant }
  ]);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are Maya, an intelligent SMS business assistant.
You can book calls and respond naturally.
When appropriate, use tools.
Respond conversationally if no tool is needed.
`
      },
      ...memoryMessages,
      {
        role: "user",
        content: message
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "book_call",
          description: "Book a phone call for the user",
          parameters: {
            type: "object",
            properties: {
              startISO: {
                type: "string",
                description: "ISO-8601 datetime for requested meeting start time"
              }
            },
            required: ["startISO"]
          }
        }
      }
    ],
    tool_choice: "auto"
  });

  const choice = completion.choices[0];
  const confidence = (choice as { logprobs?: unknown }).logprobs ? 0.9 : 0.75;

  return {
    message: choice?.message,
    confidence
  };
}
