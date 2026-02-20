interface ConversationMemory {
  sessionId: string;
  messages: any[];
  corrections: any[];
  ratings: number[];
}

const memory = new Map<string, ConversationMemory>();

export function getMemory(sessionId: string): ConversationMemory {
  if (!memory.has(sessionId)) {
    memory.set(sessionId, {
      sessionId,
      messages: [],
      corrections: [],
      ratings: []
    });
  }

  return memory.get(sessionId)!;
}

export function appendMessage(sessionId: string, message: any) {
  const mem = getMemory(sessionId);
  mem.messages.push(message);
}

export function addFeedback(sessionId: string, rating: number, correction?: any) {
  const mem = getMemory(sessionId);
  mem.ratings.push(rating);
  if (correction) {
    mem.corrections.push(correction);
  }
}
