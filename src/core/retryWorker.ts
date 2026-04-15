import { pool } from "../db/index";

const MAX_RETRIES = 10;

export async function processRetryQueue() {
  const jobs = await pool.request(`
    SELECT * FROM maya_retry_queue
    WHERE status='pending'
    LIMIT 10
  `);

  for (const job of jobs.rows) {
    const retryCount = Number(job.retry_count ?? job.attempts ?? 0);
    if (retryCount >= MAX_RETRIES) {
      console.error("Maya dead-letter abandoned", job.id);
      await pool.request(
        `UPDATE maya_retry_queue
         SET status='dead'
         WHERE id=$1`,
        [job.id]
      );

      continue;
    }

    try {
      // Example: re-run campaign optimization
      // add switch(job.job_type) for extensibility

      await pool.request(
        `UPDATE maya_retry_queue
         SET status='completed'
         WHERE id=$1`,
        [job.id]
      );
    } catch (error) {
      const attemptsResult = await pool.query<{ attempts: number }>(
        `UPDATE maya_retry_queue
         SET attempts = attempts + 1
         WHERE id=$1
         RETURNING attempts`,
        [job.id]
      );

      const attempts = attemptsResult.rows[0]?.attempts ?? 0;

      if (attempts >= MAX_RETRIES) {
        await pool.request(
          `INSERT INTO maya_dead_letter (job_type, payload, error)
           VALUES ($1, $2, $3)`,
          [job.job_type, job.payload, error instanceof Error ? error.message : "Unknown error"]
        );

        await pool.request(
          `UPDATE maya_retry_queue
           SET status='dead'
           WHERE id=$1`,
          [job.id]
        );
      }
    }
  }
}
