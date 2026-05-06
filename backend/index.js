require("dotenv").config();
const app = require("./app");
const PORT = process.env.PORT || 3000;
const db = require("./db/db");
const startServer = async () => {
  try {
    await db();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error", error.message);
    process.exit(1);
  }
};

startServer();
