require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const connectDB = require("./config/db");
const { config } = require("./config/config");

const requiredEnvironment = [
  "MONGO_URI",
  "JWT_SECRET",
  "OWNER_USERNAME",
  "OWNER_ACCESS_KEY_HASH",
  "OWNER_PASSWORD_HASH",
];
const missingEnvironment = requiredEnvironment.filter(
  (name) => !process.env[name]
);

if (missingEnvironment.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironment.join(", ")}`
  );
}

const app = require("./src/app");
const PORT = config.port;

connectDB();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});