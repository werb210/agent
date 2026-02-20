import Tesseract from "tesseract.js";

export async function extractTextFromDocument(filePath: string) {
  const result = await Tesseract.recognize(filePath, "eng");
  return result.data.text;
}
