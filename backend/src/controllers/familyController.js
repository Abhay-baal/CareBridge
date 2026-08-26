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
      select: "_id fullName email role",
    },
    {
      path: "mother",
      select: "_id fullName email role",
    },
    {
      path: "children",
      select: "_id fullName email role",
    },
  ]);

  return {
    _id: family._id,
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
 *   position tells us Father or Mother.
 *
 * Child:
 *   role is detected from JWT.
 *   No position is required.
 */
const createFamily = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const position = req.body?.position;

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
    };

    if (role === "parent") {
      if (!["father", "mother"].includes(position)) {
        return res.status(400).json({
          success: false,
          message: "Please choose Father or Mother",
        });
      }

      familyData[position] = userId;
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
 * The frontend cannot change the user's actual role.
 */
const joinFamily = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const familyCode = String(req.body?.familyCode || "")
      .trim()
      .toUpperCase();

    const position = req.body?.position;

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

      // A child joining a family must automatically connect
      // with every parent already inside that family.
      await syncFamilyRelationships(family);

      return res.status(200).json({
        success: true,
        message: "You joined the family successfully",
        data: await formatFamily(family),
      });
    }

    if (role === "parent") {
      if (!["father", "mother"].includes(position)) {
        return res.status(400).json({
          success: false,
          message: "Please choose Father or Mother",
        });
      }

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

      // A parent joining a family must automatically connect
      // with every child already inside that family.
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

module.exports = {
  getMyFamily,
  createFamily,
  joinFamily,
  syncFamilyRelationships,
};
