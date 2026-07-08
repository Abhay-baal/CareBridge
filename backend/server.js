require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./config/db");
const { config } = require("./config/config");

const PORT = config.port;

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});