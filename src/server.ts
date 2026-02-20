import express from "express";
import cors from "cors";
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
import aiExecuteRoute from "./routes/aiExecute";


const app = express();

console.log("ENV CHECK:", {
  hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
  hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => {
  res.json({ status: "Agent running" });
});

app.get("/health", (_, res) => {
  res.json({ status: "Agent running" });
});

/*
|--------------------------------------------------------------------------
| Core Business Routes
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| AI Secure Execute Route
|--------------------------------------------------------------------------
*/

app.use("/ai", aiExecuteRoute);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Agent service running on port ${PORT}`);
});
