import OpenAI from 'openai';
import { getEnv } from '../config/env';

export function getOpenAI() {
  const { OPENAI_API_KEY } = getEnv();

  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  return new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
}

export async function runModel(input: string) {
  return getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: input }],
  });
}
