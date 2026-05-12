require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║      🤖 StatStriker AI Server      ║
╠════════════════════════════════════╣
║ Port: ${PORT.toString().padEnd(30)}║
║ Status: ✅ Running                 ║
╚════════════════════════════════════╝
  `);
});
