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
// FIND ALL PARENT-CHILD RELATIONSHIPS BELONGING TO THE USER'S
// FAMILY.
//
// A family can contain:
//   Parent A
//   Parent B
//   Child A
//   Child B
//
// We start from the logged-in user and expand through the
// ParentChild relationship graph so Care can show every family
// care activity.
// ============================================================
const getFamilyRelationships = async (userId, role) => {
  const relationshipIds = new Set();
  const parentIds = new Set();
  const childIds = new Set();

  if (role === "parent") {
    parentIds.add(userId);
  } else {
    childIds.add(userId);
  }

  // ----------------------------------------------------------
  // Start with direct relationships.
  // ----------------------------------------------------------
  let relationships = await ParentChild.find({
    $or:
      role === "parent"
        ? [{ parent: userId }]
        : [{ child: userId }],
  }).select("_id parent child");

  for (const relationship of relationships) {
    relationshipIds.add(relationship._id.toString());
    parentIds.add(relationship.parent.toString());
    childIds.add(relationship.child.toString());
  }

  // ----------------------------------------------------------
  // Expand parent -> children.
  // ----------------------------------------------------------
  if (parentIds.size > 0) {
    relationships = await ParentChild.find({
      parent: {
        $in: [...parentIds],
      },
    }).select("_id parent child");

    for (const relationship of relationships) {
      relationshipIds.add(relationship._id.toString());
      parentIds.add(relationship.parent.toString());
      childIds.add(relationship.child.toString());
    }
  }

  // ----------------------------------------------------------
  // Expand children -> all parents.
  // This is what allows Mom + Dad + children to appear in
  // the same family Care feed.
  // ----------------------------------------------------------
  if (childIds.size > 0) {
    relationships = await ParentChild.find({
      child: {
        $in: [...childIds],
      },
    }).select("_id parent child");

    for (const relationship of relationships) {
      relationshipIds.add(relationship._id.toString());
      parentIds.add(relationship.parent.toString());
      childIds.add(relationship.child.toString());
    }
  }

  // ----------------------------------------------------------
  // One final parent expansion catches additional children
  // belonging to any parent discovered above.
  // ----------------------------------------------------------
  if (parentIds.size > 0) {
    relationships = await ParentChild.find({
      parent: {
        $in: [...parentIds],
      },
    }).select("_id parent child");

    for (const relationship of relationships) {
      relationshipIds.add(relationship._id.toString());
      parentIds.add(relationship.parent.toString());
      childIds.add(relationship.child.toString());
    }
  }

  return {
    relationshipIds: [...relationshipIds],
    parentIds: [...parentIds],
    childIds: [...childIds],
  };
};

// ============================================================
// CREATE CARE PLAN
// Parent -> Child
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
      walkLevel:
        careType === "walk"
          ? walkLevel
          : undefined,
      walkDuration:
        careType === "walk"
          ? walkDuration
          : undefined,
    });

    const populatedCarePlan = await CarePlan.findById(
      carePlan._id
    )
      .populate(
        "createdBy",
        "fullName email phone role"
      )
      .populate(
        "child",
        "fullName email phone role"
      )
      .populate({
        path: "parent",
        populate: {
          path: "user",
          select: "fullName email phone role",
        },
      })
      .populate("parentChild");

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
//
// BOTH PARENT AND CHILD.
//
// Returns every CarePlan belonging to the logged-in user's
// family.
//
// This powers:
//   All Tasks
//   Given to Me
//   Given by Me
//
// Filtering is performed on the frontend using createdBy and
// the populated parent/child users.
// ============================================================
const getCarePlans = async (req, res) => {
  try {
    const {
      relationshipIds,
    } = await getFamilyRelationships(
      req.user.id,
      req.user.role
    );

    if (relationshipIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const carePlans = await CarePlan.find({
      parentChild: {
        $in: relationshipIds,
      },
    })
      .populate(
        "createdBy",
        "fullName email phone role"
      )
      .populate(
        "child",
        "fullName email phone role"
      )
      .populate({
        path: "parent",
        populate: {
          path: "user",
          select: "fullName email phone role",
        },
      })
      .populate("parentChild")
      .sort({
        dueDate: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: carePlans,
    });
  } catch (error) {
    console.error("Get family care plans error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ============================================================
// UPDATE CARE PLAN
//
// A user may update a CarePlan when:
//
// 1. They created it.
// 2. They are the child recipient.
// 3. They are the parent recipient.
//
// This keeps the existing parent behavior while allowing a
// parent to complete a task/walk that was given TO them by a
// child.
// ============================================================
const updateCarePlan = async (req, res) => {
  try {
    const carePlan = await CarePlan.findById(
      req.params.id
    ).populate({
      path: "parent",
      populate: {
        path: "user",
        select: "_id fullName email phone role",
      },
    });

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: "Care plan not found",
      });
    }

    const currentUserId = req.user.id.toString();

    const createdById =
      carePlan.createdBy?.toString();

    const childId =
      carePlan.child?._id
        ? carePlan.child._id.toString()
        : carePlan.child?.toString();

    const parentUserId =
      carePlan.parent?.user?._id
        ? carePlan.parent.user._id.toString()
        : carePlan.parent?.user?.toString();

    const isCreator =
      createdById === currentUserId;

    const isChildRecipient =
      childId === currentUserId;

    const isParentRecipient =
      parentUserId === currentUserId;

    if (
      !isCreator &&
      !isChildRecipient &&
      !isParentRecipient
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this care plan",
      });
    }

    const allowedUpdates = {};

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }

      allowedUpdates.title = title;
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

    const updatedCarePlan =
      await CarePlan.findByIdAndUpdate(
        carePlan._id,
        allowedUpdates,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "createdBy",
          "fullName email phone role"
        )
        .populate(
          "child",
          "fullName email phone role"
        )
        .populate({
          path: "parent",
          populate: {
            path: "user",
            select: "fullName email phone role",
          },
        })
        .populate("parentChild");

    return res.status(200).json({
      success: true,
      message: "Care plan updated successfully",
      data: updatedCarePlan,
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
//
// Keep existing behavior: only the creator can delete their
// care plan.
// ============================================================
const deleteCarePlan = async (req, res) => {
  try {
    const carePlan = await CarePlan.findById(req.params.id).populate({
      path: "parent",
      populate: {
        path: "user",
        select: "_id fullName email phone role",
      },
    });

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: "Care plan not found",
      });
    }

    const currentUserId = req.user.id.toString();
    const createdById = carePlan.createdBy?.toString();
    const childId = carePlan.child?._id
      ? carePlan.child._id.toString()
      : carePlan.child?.toString();
    const parentUserId = carePlan.parent?.user?._id
      ? carePlan.parent.user._id.toString()
      : carePlan.parent?.user?.toString();

    const isCreator = createdById === currentUserId;
    const isChildRecipient = childId === currentUserId;
    const isParentRecipient = parentUserId === currentUserId;
    const isCompletedTask = carePlan.status === "completed";

    const canDelete =
      isCreator ||
      (isCompletedTask && (isChildRecipient || isParentRecipient));

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this care plan",
      });
    }

    await carePlan.deleteOne();

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
