const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Family = require("../models/Family");
const User = require("../models/User");

const getOwnerConfig = () => ({
  accessKeyHash: process.env.OWNER_ACCESS_KEY_HASH,
  username: process.env.OWNER_USERNAME,
  passwordHash: process.env.OWNER_PASSWORD_HASH,
});

const ownerLogin = async (req, res) => {
  const { accessKey, username, password } = req.body;
  const { accessKeyHash, username: expectedUsername, passwordHash } =
    getOwnerConfig();

  const [keyMatches, passwordMatches] = await Promise.all([
    bcrypt.compare(typeof accessKey === "string" ? accessKey : "", accessKeyHash),
    bcrypt.compare(typeof password === "string" ? password : "", passwordHash),
  ]);

  if (!keyMatches || username !== expectedUsername || !passwordMatches) {
    return res.status(401).json({ success: false, message: "Invalid owner credentials" });
  }

  const token = jwt.sign({ role: "owner", owner: username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
  });

  return res.status(200).json({ success: true, token, owner: { username } });
};

const verifyOwnerKey = async (req, res) => {
  const { accessKeyHash } = getOwnerConfig();
  const keyMatches = await bcrypt.compare(
    typeof req.body.accessKey === "string" ? req.body.accessKey : "",
    accessKeyHash
  );

  if (!keyMatches) {
    return res.status(401).json({ success: false, message: "That access key is not recognized." });
  }

  return res.status(200).json({ success: true });
};

const getOwnerStats = async (req, res) => {
  try {
    const [totalUsers, parents, children, families] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "parent" }),
      User.countDocuments({ role: "child" }),
      Family.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: { totalUsers, parents, children, families },
    });
  } catch (error) {
    console.error("Failed to load owner stats:", error);
    return res.status(500).json({ success: false, message: "Unable to load owner statistics" });
  }
};

module.exports = { ownerLogin, verifyOwnerKey, getOwnerStats };