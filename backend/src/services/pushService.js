const DeviceToken = require("../models/DeviceToken");
const { getFirebaseAdmin } = require("../config/firebaseAdmin");
const { getMessaging } = require("firebase-admin/messaging");

const getUserDeviceTokens = async (userId) => {
  const tokens = await DeviceToken.find({
    user: userId,
    enabled: true,
  }).select("token");

  return tokens.map((item) => item.token);
};

const registerDeviceToken = async ({
  userId,
  token,
  platform = "web",
  deviceName = "",
}) => {
  const cleanedToken = String(token || "").trim();

  if (!cleanedToken) {
    throw new Error("Token is required");
  }

  const existing = await DeviceToken.findOneAndUpdate(
    { token: cleanedToken },
    {
      $set: {
        user: userId,
        platform,
        deviceName,
        enabled: true,
        lastSeenAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  return existing;
};

const unregisterDeviceToken = async (userId, token) => {
  await DeviceToken.deleteOne({
    user: userId,
    token: String(token || "").trim(),
  });
};

const sendPushToUser = async (userId, payload) => {
  const app = getFirebaseAdmin();

  if (!app) {
    return {
      success: false,
      message: "Firebase Admin is not configured",
    };
  }

  const tokens = await getUserDeviceTokens(userId);

  if (!tokens.length) {
    return {
      success: true,
      sent: 0,
      reason: "No device tokens found",
    };
  }

  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      ...(payload.data || {}),
      clickAction: payload.clickAction || "/dashboard",
    },
    tokens,
  };

  const messaging = getMessaging(app);

  const response = await messaging.sendEachForMulticast(message);

  const invalidTokens = [];

  response.responses.forEach((item, index) => {
    if (!item.success) {
      const errorCode = item.error?.code || "";

      if (
        errorCode.includes("registration-token-not-registered") ||
        errorCode.includes("invalid-registration-token")
      ) {
        invalidTokens.push(tokens[index]);
      }
    }
  });

  if (invalidTokens.length) {
    await DeviceToken.deleteMany({
      token: {
        $in: invalidTokens,
      },
    });
  }

  return {
    success: true,
    sent: response.successCount,
    failed: response.failureCount,
  };
};

module.exports = {
  getUserDeviceTokens,
  registerDeviceToken,
  unregisterDeviceToken,
  sendPushToUser,
};
