import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeLeadRoute from "./routes/analyzeLead";
import callOutcomeRoute from "./routes/callOutcome";
import recalcRoute from "./routes/recalculate";
import startCampaignRoute from "./routes/startCampaign";
import voiceHandlerRoute from "./routes/voiceHandler";
import gatherResponseRoute from "./routes/gatherResponse";
import speechHandlerRoute from "./routes/speechHandler";
import rankDealsRoute from "./routes/rankDeals";
import generateMemoRoute from "./routes/generateMemo";
import forecastRoute from "./routes/forecast";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_, res) => {
  res.json({ status: "AI Agent running" });
});

app.use("/analyze-lead", analyzeLeadRoute);
app.use("/call-outcome", callOutcomeRoute);
app.use("/recalculate", recalcRoute);
app.use("/start-campaign", startCampaignRoute);
app.use("/voice-handler", voiceHandlerRoute);
app.use("/gather-response", gatherResponseRoute);
app.use("/speech-handler", speechHandlerRoute);
app.use("/rank-deals", rankDealsRoute);
app.use("/generate-memo", generateMemoRoute);
app.use("/forecast", forecastRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AI Agent running on port ${PORT}`);
});
