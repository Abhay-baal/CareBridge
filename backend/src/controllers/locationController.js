const Parent = require("../models/Parent");

const getParentLocation = async (req, res) => {
  try {
    const parent = await Parent.findOne({
      user: req.user.parent,
    }).populate("user", "fullName phone");

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    res.json({
      success: true,
      data: {
        address: parent.address,
        latitude: parent.latitude || null,
        longitude: parent.longitude || null,
        parentName: parent.user?.fullName,
        phone: parent.user?.phone,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getParentLocation,
};
