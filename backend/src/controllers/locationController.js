const Parent = require("../models/Parent");
const ParentChild = require("../models/ParentChild");

const getParentForChild = async (req) => {
  const activeRelationship = await ParentChild.findOne({
    child: req.user.id,
    active: true,
  });

  if (activeRelationship) {
    return Parent.findOne({
      user: activeRelationship.parent,
    }).populate("user", "fullName phone");
  }

  // Backward compatibility with the original MVP.
  if (req.user.parent) {
    return Parent.findOne({
      user: req.user.parent,
    }).populate("user", "fullName phone");
  }

  return null;
};

const getParentLocation = async (req, res) => {
  try {
    const parent = await getParentForChild(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "No active parent found",
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
    console.error("Parent location error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getParentLocation,
};
