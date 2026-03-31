import cors from "cors";
import express from "express";
import healthRoutes from "./routes/health";
import mayaRoutes from "./routes/maya";
import voiceRoutes from "./routes/voice";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/maya", mayaRoutes);
app.use("/voice", voiceRoutes);
app.use("/", healthRoutes);

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`Maya running on ${port}`);
});
