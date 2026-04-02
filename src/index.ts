import express from "express";
import http from "http";
import voiceRouter from "./routes/voice";
import { ENV } from "./config/env";
import { createVoiceServer } from "./ws/voiceServer";

const app = express();

app.use(express.json());
app.use("/voice", voiceRouter);

const server = http.createServer(app);

createVoiceServer(server);

server.listen(Number(ENV.PORT), () => {
  console.log(`Maya running on ${ENV.PORT}`);
});
