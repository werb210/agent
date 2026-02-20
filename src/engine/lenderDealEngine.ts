import { pool } from "../config/pool";

export async function createLenderDeals(lenderNames: string[], sessionId: string) {
  if (!lenderNames.length) {
    return;
  }

  const lenders = await pool.query(
    "SELECT id, name FROM lenders WHERE name = ANY($1::text[])",
    [lenderNames]
  );

  for (const lender of lenders.rows) {
    await pool.query(
      `INSERT INTO lender_deals (lender_id, session_id)
       VALUES ($1, $2)
       ON CONFLICT (lender_id, session_id) DO NOTHING`,
      [lender.id, sessionId]
    );
  }
}

export async function getLenderPortalDeals(email: string) {
  const result = await pool.query(
    `SELECT ld.id,
            ld.session_id,
            ld.status,
            s.data
     FROM lender_users lu
     JOIN lender_deals ld ON ld.lender_id = lu.lender_id
     JOIN sessions s ON s.session_id = ld.session_id
     WHERE lu.email = $1
     ORDER BY ld.id DESC`,
    [email]
  );

  return result.rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    status: row.status,
    score: row.data?.scoring?.score ?? null,
    memo: row.data?.memo ?? null,
    checklist: row.data?.checklist ?? [],
    approvalSimulation: row.data?.probability ?? null,
    termSheetUploaded: row.data?.termSheetUploaded ?? false
  }));
}

export async function uploadTermSheet(lenderDealId: number, fileUrl: string) {
  await pool.query(
    `UPDATE lender_deals
     SET status = 'TERM_SHEET_UPLOADED'
     WHERE id = $1`,
    [lenderDealId]
  );

  return { lenderDealId, fileUrl };
}
