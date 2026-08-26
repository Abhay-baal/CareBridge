const CarePlan = require("../models/CarePlan");
const Parent = require("../models/Parent");
const ParentChild = require("../models/ParentChild");
const User = require("../models/User");

const getParentProfile = async (userId) => {
  return Parent.findOne({
    user: userId,
  });
};

const getConnectedRelationship = async (parentUserId, childId) => {
  return ParentChild.findOne({
    parent: parentUserId,
    child: childId,
  });
};

// ============================================================
// CREATE CARE PLAN
// Parent can only assign care to a REAL connected child.
// ============================================================
const createCarePlan = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      childId,
      careType,
      walkLevel,
      walkDuration,
    } = req.body;

    if (!title || !dueDate || !childId) {
      return res.status(400).json({
        success: false,
        message: "Title, due date and child are required",
      });
    }

    const parent = await getParentProfile(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const child = await User.findOne({
      _id: childId,
      role: "child",
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // CRITICAL SECURITY CHECK:
    // The parent can only assign care to a child
    // with whom they actually have a ParentChild relationship.
    const relationship = await getConnectedRelationship(
      req.user.id,
      child._id
    );

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "This child is not connected to your family",
      });
    }

    const carePlan = await CarePlan.create({
      createdBy: req.user.id,
      parent: parent._id,
      child: child._id,
      parentChild: relationship._id,
      title: title.trim(),
      description: description?.trim() || "",
      dueDate,
      careType: careType || "task",
      walkLevel: careType === "walk" ? walkLevel : undefined,
      walkDuration:
        careType === "walk" ? walkDuration : undefined,
    });

    const populatedCarePlan = await CarePlan.findById(
      carePlan._id
    )
      .populate(
        "child",
        "fullName email phone role"
      )
      .populate(
        "parentChild"
      );

    return res.status(201).json({
      success: true,
      message: "Care plan created successfully",
      data: populatedCarePlan,
    });
  } catch (error) {
    console.error("Create care plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ============================================================
// GET CARE PLANS
// Parent -> plans created by this parent.
// Child  -> this endpoint is not used; child dashboard handles it.
// ============================================================
const getCarePlans = async (req, res) => {
  try {
    const parent = await getParentProfile(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const carePlans = await CarePlan.find({
      parent: parent._id,
    })
      .populate(
        "child",
        "fullName email phone role"
      )
      .sort({
        dueDate: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: carePlans,
    });
  } catch (error) {
    console.error("Get care plans error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ============================================================
// UPDATE CARE PLAN
// Parent can update only their own care plans.
// Child assignment cannot be changed through this endpoint.
// ============================================================
const updateCarePlan = async (req, res) => {
  try {
    const parent = await getParentProfile(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const allowedUpdates = {};

    if (req.body.title !== undefined) {
      allowedUpdates.title = req.body.title.trim();
    }

    if (req.body.description !== undefined) {
      allowedUpdates.description =
        req.body.description?.trim() || "";
    }

    if (req.body.dueDate !== undefined) {
      allowedUpdates.dueDate = req.body.dueDate;
    }

    if (req.body.status !== undefined) {
      allowedUpdates.status = req.body.status;
    }

    const carePlan = await CarePlan.findOneAndUpdate(
      {
        _id: req.params.id,
        parent: parent._id,
      },
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "child",
        "fullName email phone role"
      );

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: "Care plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Care plan updated successfully",
      data: carePlan,
    });
  } catch (error) {
    console.error("Update care plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ============================================================
// DELETE CARE PLAN
// ============================================================
const deleteCarePlan = async (req, res) => {
  try {
    const parent = await getParentProfile(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const carePlan = await CarePlan.findOneAndDelete({
      _id: req.params.id,
      parent: parent._id,
    });

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: "Care plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Care plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete care plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  createCarePlan,
  getCarePlans,
  updateCarePlan,
  deleteCarePlan,
};
