import { pool } from "../db";

type MemoryTurn = {
  user: string;
  assistant: string;
};

export const appendMemory = async (sessionId: string, user: string, assistant: string) => {
  const existing = await pool.query("SELECT memo FROM sessions WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1", [
    sessionId
  ]);

  const currentMemo = existing.rows[0]?.memo;
  const memory: MemoryTurn[] = currentMemo ? JSON.parse(currentMemo) : [];

  memory.push({ user, assistant });

  await pool.query(
    `UPDATE sessions
     SET memo = $1
     WHERE id = (
       SELECT id FROM sessions
       WHERE session_id = $2
       ORDER BY created_at DESC
       LIMIT 1
     )`,
    [JSON.stringify(memory), sessionId]
  );
};

export const getMemory = async (sessionId: string): Promise<MemoryTurn[]> => {
  const result = await pool.query("SELECT memo FROM sessions WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1", [sessionId]);
  const raw = result.rows[0]?.memo;
  return raw ? JSON.parse(raw) : [];
};
