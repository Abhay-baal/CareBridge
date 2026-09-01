const Parent = require("../models/Parent");
const ParentChild = require("../models/ParentChild");
const CarePlan = require("../models/CarePlan");
const Appointment = require("../models/Appointment");
const User = require("../models/User");

/*
 * Get the active Parent profile for the authenticated child.
 *
 * New multi-parent system:
 *   Child -> ParentChild(active: true) -> Parent
 *
 * Backward compatibility:
 *   If no ParentChild relationship exists, fall back to
 *   the existing User.parent field.
 */
const getParentForChild = async (req) => {
  const activeRelationship = await ParentChild.findOne({
    child: req.user.id,
    active: true,
  });

  if (activeRelationship) {
    return Parent.findOne({
      user: activeRelationship.parent,
    }).populate("user", "fullName email phone");
  }

  // Backward compatibility with the original CareBridge MVP.
  if (req.user.parent) {
    return Parent.findOne({
      user: req.user.parent,
    }).populate("user", "fullName email phone");
  }

  return null;
};

const getChildDashboard = async (req, res) => {
  try {
    const parent = await getParentForChild(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message:
          "No active parent found. Join your parent's family using a family code to continue.",
      });
    }

    const [carePlans, appointments] = await Promise.all([
      /*
       * Universal Care:
       *
       * Show every CarePlan assigned TO this child,
       * regardless of who created it.
       *
       * This allows:
       *   Parent -> Child
       *   Child  -> Child
       *   Child  -> Child from another family member
       *
       * Legacy Parent -> Child records are also supported.
       */
      CarePlan.find({
        $or: [
          {
            recipient: req.user.id,
          },
          {
            child: req.user.id,
            parent: parent._id,
          },
        ],
      }).sort({
        dueDate: 1,
        createdAt: -1,
      }),

      Appointment.find({
        parent: parent._id,
      }).sort({ appointmentDate: 1 }),
    ]);

    const completedTasks = carePlans.filter(
      (task) => task.status === "completed"
    ).length;

    res.status(200).json({
      success: true,
      data: {
        parent,
        carePlans,
        appointments,
        stats: {
          totalTasks: carePlans.length,
          completedTasks,
          totalAppointments: appointments.length,
          totalReports: 0,
        },
      },
    });
  } catch (error) {
    console.error("Child dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateChildCarePlan = async (req, res) => {
  try {
    const parent = await getParentForChild(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "No active parent found",
      });
    }

    const relationship = await ParentChild.findOne({
      parent: parent.user,
      child: req.user.id,
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "You are no longer connected to this parent",
      });
    }

    const carePlan = await CarePlan.findOneAndUpdate(
      {
        _id: req.params.id,
        parent: parent._id,
        child: req.user.id,
        parentChild: relationship._id,
      },
      {
        status: req.body.status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: "Care plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: carePlan,
    });
  } catch (error) {
    console.error("Child care plan update error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const createChildCarePlan = async (req, res) => {
  try {
    const { title, description, dueDate, parentId, careType, walkLevel, walkDuration } = req.body;

    if (!title || !dueDate || !parentId) {
      return res.status(400).json({
        success: false,
        message: "Title, due date and parent are required",
      });
    }

    const relationship = await ParentChild.findOne({
      parent: parentId,
      child: req.user.id,
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "This parent is not connected to your family",
      });
    }

    const parent = await Parent.findOne({ user: parentId });
    const recipient = await User.findOne({ _id: parentId, role: "parent" });

    if (!parent || !recipient) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const carePlan = await CarePlan.create({
      createdBy: req.user.id,
      parent: parent._id,
      child: req.user.id,
      parentChild: relationship._id,
      title: title.trim(),
      description: description?.trim() || "",
      dueDate,
      careType: careType || "task",
      walkLevel: careType === "walk" ? walkLevel : undefined,
      walkDuration: careType === "walk" ? walkDuration : undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Care plan created successfully",
      data: carePlan,
    });
  } catch (error) {
    console.error("Create child care plan error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getParentForChild,
  getChildDashboard,
  updateChildCarePlan,
  createChildCarePlan,
};
