const crypto = require("crypto");
const Family = require("../models/Family");
const User = require("../models/User");
const ParentChild = require("../models/ParentChild");

const generateFamilyCode = () => {
  return crypto
    .randomBytes(4)
    .toString("hex")
    .substring(0, 6)
    .toUpperCase();
};

const getUserFamily = async (userId) => {
  return Family.findOne({
    $or: [
      { father: userId },
      { mother: userId },
      { children: userId },
    ],
  });
};


/*
 * Synchronize the Family membership with the existing
 * ParentChild relationship system.
 *
 * Family is the source of truth for membership.
 * ParentChild is automatically maintained for every
 * parent -> child combination inside that family.
 */
const syncFamilyRelationships = async (family) => {
  const parentIds = [
    family.father,
    family.mother,
  ].filter(Boolean).map((id) => id.toString());

  const childIds = (family.children || [])
    .filter(Boolean)
    .map((id) => id.toString());

  for (const parentId of parentIds) {
    for (const childId of childIds) {
      await ParentChild.updateOne(
        {
          parent: parentId,
          child: childId,
        },
        {
          $setOnInsert: {
            parent: parentId,
            child: childId,
            active: false,
          },
        },
        {
          upsert: true,
        }
      );
    }
  }

  /*
   * Make sure every child has exactly one active parent.
   * Existing active relationships are preserved.
   * If a child has no active parent, the oldest relationship
   * becomes active.
   */
  for (const childId of childIds) {
    const relationships = await ParentChild.find({
      child: childId,
    }).sort({
      createdAt: 1,
    });

    if (
      relationships.length > 0 &&
      !relationships.some((relationship) => relationship.active)
    ) {
      relationships[0].active = true;
      await relationships[0].save();
    }
  }
};

const formatFamily = async (family) => {
  await family.populate([
    {
      path: "father",
      select: "_id fullName email phone role gender",
    },
    {
      path: "mother",
      select: "_id fullName email phone role gender",
    },
    {
      path: "children",
      select: "_id fullName email phone role gender",
    },
  ]);

  return {
    _id: family._id,
    familyName: family.familyName,
    familyCode: family.familyCode,
    father: family.father,
    mother: family.mother,
    children: family.children,
    createdAt: family.createdAt,
  };
};

/*
 * GET CURRENT FAMILY
 */
const getMyFamily = async (req, res) => {
  try {
    const family = await getUserFamily(req.user.id);

    if (!family) {
      return res.status(200).json({
        success: true,
        hasFamily: false,
        data: null,
      });
    }

    // Keep the legacy ParentChild graph synchronized
    // with the actual Family membership.
    await syncFamilyRelationships(family);

    return res.status(200).json({
      success: true,
      hasFamily: true,
      data: await formatFamily(family),
    });
  } catch (error) {
    console.error("Get family error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load family",
    });
  }
};

/*
 * CREATE NEW FAMILY
 *
 * Parent:
 *   role is detected from JWT.
 *   gender automatically determines Father or Mother.
 *
 * Child:
 *   role is detected from JWT.
 *   No additional selection is required.
 */
const createFamily = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const familyName = String(req.body?.familyName || "").trim();

    const existingFamily = await getUserFamily(userId);

    if (existingFamily) {
      return res.status(400).json({
        success: false,
        message: "You are already connected to a family",
      });
    }

    if (!["parent", "child"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Only parents and children can create a family",
      });
    }

    if (!familyName) {
      return res.status(400).json({
        success: false,
        message: "Family name is required",
      });
    }

    if (familyName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Family name must be 80 characters or less",
      });
    }

    const user = await User.findById(userId).select("gender role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let familyCode;
    let codeExists = true;

    while (codeExists) {
      familyCode = generateFamilyCode();

      codeExists = await Family.exists({
        familyCode,
      });
    }

    const familyData = {
      familyCode,
      familyName,
    };

    if (role === "parent") {
      if (!["male", "female"].includes(user.gender)) {
        return res.status(400).json({
          success: false,
          message: "Please complete your gender in your profile first",
        });
      }

      if (user.gender === "male") {
        familyData.father = userId;
      } else {
        familyData.mother = userId;
      }
    }

    if (role === "child") {
      familyData.children = [userId];
    }

    const family = await Family.create(familyData);

    await syncFamilyRelationships(family);

    return res.status(201).json({
      success: true,
      message: "Family created successfully",
      data: await formatFamily(family),
    });
  } catch (error) {
    console.error("Create family error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create family",
    });
  }
};

/*
 * JOIN EXISTING FAMILY
 *
 * Role is ALWAYS detected from authenticated JWT.
 * For parents, gender automatically determines Father or Mother.
 * The frontend cannot change the user's actual role or family position.
 */
const joinFamily = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const familyCode = String(req.body?.familyCode || "")
      .trim()
      .toUpperCase();

    if (!familyCode) {
      return res.status(400).json({
        success: false,
        message: "Family code is required",
      });
    }

    const existingFamily = await getUserFamily(userId);

    if (existingFamily) {
      return res.status(400).json({
        success: false,
        message: "You are already connected to a family",
      });
    }

    const family = await Family.findOne({
      familyCode,
    });

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found. Please check the family code.",
      });
    }

    if (role === "child") {
      const alreadyChild = family.children.some(
        (child) => child.toString() === userId.toString()
      );

      if (!alreadyChild) {
        family.children.push(userId);
      }

      await family.save();

      await syncFamilyRelationships(family);

      return res.status(200).json({
        success: true,
        message: "You joined the family successfully",
        data: await formatFamily(family),
      });
    }

    if (role === "parent") {
      const user = await User.findById(userId).select("gender role");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!["male", "female"].includes(user.gender)) {
        return res.status(400).json({
          success: false,
          message: "Please complete your gender in your profile first",
        });
      }

      const position =
        user.gender === "male"
          ? "father"
          : "mother";

      if (family[position]) {
        const label =
          position === "father" ? "Father" : "Mother";

        return res.status(409).json({
          success: false,
          message: `${label} position is already occupied`,
        });
      }

      family[position] = userId;

      await family.save();

      await syncFamilyRelationships(family);

      return res.status(200).json({
        success: true,
        message: "You joined the family successfully",
        data: await formatFamily(family),
      });
    }

    return res.status(403).json({
      success: false,
      message: "Only parents and children can join a family",
    });
  } catch (error) {
    console.error("Join family error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to join family",
    });
  }
};


/*
 * LEAVE FAMILY
 *
 * Removes the authenticated user from the Family source of truth.
 * Existing ParentChild relationships created by this parent
 * for this family are also removed.
 */
const leaveFamily = async (req, res) => {
  try {
    const userId = req.user.id;

    const family = await getUserFamily(userId);

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "You are not connected to a family",
      });
    }

    const userString = userId.toString();

    const familyParentIds = [
      family.father,
      family.mother,
    ]
      .filter(Boolean)
      .map((id) => id.toString());

    const familyChildIds = (family.children || [])
      .filter(Boolean)
      .map((id) => id.toString());

    // Remove this user's family-specific ParentChild relationships.
    if (familyParentIds.includes(userString)) {
      await ParentChild.deleteMany({
        parent: userId,
        child: { $in: familyChildIds },
      });
    }

    // If a child leaves, remove relationships from both
    // parents in this family to that child.
    if (familyChildIds.includes(userString)) {
      await ParentChild.deleteMany({
        parent: { $in: familyParentIds },
        child: userId,
      });
    }

    if (family.father?.toString() === userString) {
      family.father = null;
    }

    if (family.mother?.toString() === userString) {
      family.mother = null;
    }

    family.children = (family.children || []).filter(
      (child) => child.toString() !== userString
    );

    const isEmpty =
      !family.father &&
      !family.mother &&
      family.children.length === 0;

    if (isEmpty) {
      await Family.findByIdAndDelete(family._id);
    } else {
      await family.save();
      await syncFamilyRelationships(family);
    }

    return res.status(200).json({
      success: true,
      message: "You left the family successfully",
    });
  } catch (error) {
    console.error("Leave family error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to leave family",
    });
  }
};

module.exports = {
  getMyFamily,
  createFamily,
  joinFamily,
  leaveFamily,
  syncFamilyRelationships,
};
