const {
  registerDeviceToken,
  unregisterDeviceToken,
} = require("../services/pushService");

const registerPushToken = async (req, res) => {
  try {
    const { token, platform, deviceName } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    const device = await registerDeviceToken({
      userId: req.user.id,
      token,
      platform,
      deviceName,
    });

    return res.status(200).json({
      success: true,
      message: "Device registered for notifications",
      data: {
        id: device._id,
      },
    });
  } catch (error) {
    console.error("Register push token error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register notification device",
    });
  }
};

const removePushToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    await unregisterDeviceToken(req.user.id, token);

    return res.status(200).json({
      success: true,
      message: "Device removed",
    });
  } catch (error) {
    console.error("Remove push token error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove notification device",
    });
  }
};

module.exports = {
  registerPushToken,
  removePushToken,
};
