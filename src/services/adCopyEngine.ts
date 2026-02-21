import { pool } from "../db";
import { resilientLLM } from "../infrastructure/mayaResilience";

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

  const result = await resilientLLM("ad-copy", prompt);
  const text = result.output;

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
