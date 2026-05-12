const express = require("express");
const cors = require("cors");

const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🤖 StatStriker AI Backend Running",
  });
});

app.use("/api/ai", aiRoutes);

module.exports = app;
