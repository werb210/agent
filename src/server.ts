import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeLeadRoute from "./routes/analyzeLead";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "AI Agent running" });
});

app.use("/analyze-lead", analyzeLeadRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AI Agent running on port ${PORT}`);
});
