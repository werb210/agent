import cors from "cors";
import express from "express";
import healthRoutes from "./routes/health";
import mayaRoutes from "./routes/maya";
import voiceRoutes from "./routes/voice";

const app = express();
const PORT = Number(process.env.PORT || 8080);

app.use(cors());
app.use(express.json());

app.use("/maya", mayaRoutes);
app.use("/voice", voiceRoutes);
app.use("/", healthRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT)
  .on("error", (err) => {
    console.error("Port bind failed", err);
    process.exit(1);
  })
  .on("listening", () => {
    console.log(`Maya running on ${PORT}`);
  });
