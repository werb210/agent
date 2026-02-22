import { pool } from "../db";

export async function processRetryQueue() {
  const jobs = await pool.query(`
    SELECT * FROM maya_retry_queue
    WHERE status='pending'
    LIMIT 10
  `);

  for (const job of jobs.rows) {
    try {
      // Example: re-run campaign optimization
      // add switch(job.job_type) for extensibility

      await pool.query(
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

      if (attempts > 5) {
        await pool.query(
          `INSERT INTO maya_dead_letter (job_type, payload, error)
           VALUES ($1, $2, $3)`,
          [job.job_type, job.payload, error instanceof Error ? error.message : "Unknown error"]
        );

        await pool.query(
          `UPDATE maya_retry_queue
           SET status='dead'
           WHERE id=$1`,
          [job.id]
        );
      }
    }
  }
}
