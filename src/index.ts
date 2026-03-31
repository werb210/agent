import express from "express";
import cors from "cors";
import http from "http";

import chatRoutes from "./routes/chat";
import voiceRoutes from "./routes/voice";
import { startWS } from "./ws";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/chat", chatRoutes);
app.use("/voice", voiceRoutes);

const server = http.createServer(app);

startWS(server);

server.listen(4000, () => {
  console.log("Maya running on 4000");
});
