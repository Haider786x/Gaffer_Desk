const express = require("express");
const app = express();
const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const playerRoutes = require("./routes/playerRoutes");
const statRoutes = require("./routes/statRoutes");
const userRoutes = require("./routes/userRoute");
app.use(express.json());

app.get("/test", (req, res) => {
  res.json({ message: "API is working!" });
});
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/users", userRoutes);
module.exports = app;
