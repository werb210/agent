import OpenAI from "openai";
import { ENV } from "../config/env.js";

export const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY
});
