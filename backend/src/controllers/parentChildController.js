const ParentChild = require("../models/ParentChild");
const User = require("../models/User");

const connectParent = async (req, res) => {
  try {
    const { connectionCode } = req.body;

    if (!connectionCode) {
      return res.status(400).json({
        success: false,
        message: "Parent connection code is required",
      });
    }

    const child = await User.findOne({
      _id: req.user.id,
      role: "child",
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child account not found",
      });
    }

    const parent = await User.findOne({
      connectionCode: connectionCode.toUpperCase().trim(),
      role: "parent",
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Invalid parent connection code",
      });
    }

    if (parent._id.equals(child._id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent",
      });
    }

    const existingRelationship = await ParentChild.findOne({
      parent: parent._id,
      child: child._id,
    });

    if (existingRelationship) {
      return res.status(400).json({
        success: false,
        message: "Parent is already connected",
        data: existingRelationship,
      });
    }

    const existingActiveParent = await ParentChild.findOne({
      child: child._id,
      active: true,
    });

    const relationship = await ParentChild.create({
      parent: parent._id,
      child: child._id,
      active: !existingActiveParent,
    });

    const populatedRelationship = await ParentChild.findById(
      relationship._id
    ).populate(
      "parent",
      "fullName email phone connectionCode"
    );

    return res.status(201).json({
      success: true,
      message: "Parent connected successfully",
      data: populatedRelationship,
    });
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Parent is already connected",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getParents = async (req, res) => {
  try {
    const query =
      req.user.role === "parent"
        ? { parent: req.user.id }
        : { child: req.user.id };

    const relationships = await ParentChild.find(query)
      .populate(
        "parent",
        "fullName email phone connectionCode"
      )
      .populate(
        "child",
        "fullName email phone"
      )
      .sort({
        active: -1,
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      data: relationships,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const removeParent = async (req, res) => {
  try {
    const relationship = await ParentChild.findOne({
      _id: req.params.id,
      child: req.user.id,
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Parent relationship not found",
      });
    }

    const wasActive = relationship.active;

    await relationship.deleteOne();

    if (wasActive) {
      const nextRelationship = await ParentChild.findOne({
        child: req.user.id,
      }).sort({
        createdAt: 1,
      });

      if (nextRelationship) {
        nextRelationship.active = true;
        await nextRelationship.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Parent removed successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const switchActiveParent = async (req, res) => {
  try {
    const relationship = await ParentChild.findOne({
      _id: req.params.id,
      child: req.user.id,
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Parent relationship not found",
      });
    }

    await ParentChild.updateMany(
      {
        child: req.user.id,
      },
      {
        $set: {
          active: false,
        },
      }
    );

    relationship.active = true;
    await relationship.save();

    const updatedRelationship = await ParentChild.findById(
      relationship._id
    ).populate(
      "parent",
      "fullName email phone connectionCode"
    );

    return res.status(200).json({
      success: true,
      message: "Active parent switched successfully",
      data: updatedRelationship,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  connectParent,
  getParents,
  removeParent,
  switchActiveParent,
};
