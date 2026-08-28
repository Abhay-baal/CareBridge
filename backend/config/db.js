const mongoose = require("mongoose");
const dns = require("dns");

const configureDnsServers = () => {
  const servers = (process.env.MONGO_DNS_SERVERS || "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
    console.log(`Using custom DNS servers for MongoDB: ${servers.join(", ")}`);
  }
};

const connectDB = async () => {
  try {
    configureDnsServers();

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("✅ MongoDB Atlas Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
