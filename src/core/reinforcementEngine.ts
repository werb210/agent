import { pool } from "../db";

export async function recordReward(actionType: string, reward: number, metadata: unknown) {
  await pool.query(
    `INSERT INTO maya_rewards (action_type, reward_score, metadata)
     VALUES ($1,$2,$3)`,
    [actionType, reward, metadata]
  );
}

type AvgRewardRow = {
  avg_reward: string | number | null;
};

export async function getAverageReward(actionType: string) {
  const result = await pool.query<AvgRewardRow>(
    `SELECT AVG(reward_score) as avg_reward
     FROM maya_rewards
     WHERE action_type=$1`,
    [actionType]
  );

  return Number(result.rows[0]?.avg_reward || 0);
}
