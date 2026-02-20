import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Agent running" });
});

app.listen(4000, () => {
  console.log("Agent service running on port 4000");
});
