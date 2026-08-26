const crypto = require("crypto");
const Family = require("../models/Family");
const User = require("../models/User");

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
};
