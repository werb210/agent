import OpenAI from "openai";
import { pool } from "../db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAdCopy(campaignId: string, industry: string): Promise<void> {
  const prompt = `
Create a high-converting financial funding ad for the ${industry} industry.
Do not promise approval.
Do not mention underwriting logic.
Professional tone.
Provide:
- Headline
- Body
- CTA
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  const text = response.choices[0]?.message?.content || "";

  const [headline, body, cta] = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  await pool.query(
    `
    INSERT INTO maya_generated_ads (campaign_id, headline, body, cta)
    VALUES ($1,$2,$3,$4)
  `,
    [campaignId, headline || "", body || "", cta || ""]
  );
}
