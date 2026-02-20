import fs from "fs";
import PDFDocument from "pdfkit";

export function generateDealPDF(session: any, filePath: string) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("Deal Summary", { underline: true });
  doc.moveDown();

  doc.text(`Business: ${session?.structured?.business_name ?? "N/A"}`);
  doc.text(`Industry: ${session?.structured?.industry ?? "N/A"}`);
  doc.text(`Revenue: ${session?.structured?.monthly_revenue ?? "N/A"}`);
  doc.text(`Funding: ${session?.structured?.funding_amount ?? "N/A"}`);
  doc.text(`Score: ${session?.scoring?.score ?? "N/A"}`);
  doc.text(`Tier: ${session?.tier ?? "N/A"}`);
  doc.text(`Probability: ${session?.probability ?? "N/A"}`);

  doc.end();
}
