const ParentChild = require("../models/ParentChild");
const User = require("../models/User");
const Family = require("../models/Family");

const syncChildIntoFamily = async (parentId, childId) => {
  let family = await Family.findOne({
    $or: [
      { father: childId },
      { mother: childId },
      { children: childId },
    ],
  });

  /*
   * If the child already belongs to a family, add the parent
   * to the first available parent position.
   */
  if (family) {
    const parentString = parentId.toString();

    if (
      family.father?.toString() !== parentString &&
      family.mother?.toString() !== parentString
    ) {
      if (!family.father) {
        family.father = parentId;
      } else if (!family.mother) {
        family.mother = parentId;
      }
    }

    const childString = childId.toString();

    if (
      !(family.children || []).some(
        (child) => child.toString() === childString
      )
    ) {
      family.children.push(childId);
    }

    await family.save();
    return family;
  }

  /*
   * If the child has no Family yet, check whether the parent
   * already belongs to one and add the child there.
   */
  family = await Family.findOne({
    $or: [
      { father: parentId },
      { mother: parentId },
      { children: parentId },
    ],
  });

  if (family) {
    const childString = childId.toString();

    if (
      !(family.children || []).some(
        (child) => child.toString() === childString
      )
    ) {
      family.children.push(childId);
      await family.save();
    }

    return family;
  }

  /*
   * Neither user has a Family yet.
   * Create one using this parent + child pair.
   */
  const crypto = require("crypto");

  let familyCode;
  let exists = true;

  while (exists) {
    familyCode = crypto
      .randomBytes(4)
      .toString("hex")
      .substring(0, 6)
      .toUpperCase();

    exists = await Family.exists({
      familyCode,
    });
  }

  return Family.create({
    familyCode,
    father: parentId,
    children: [childId],
  });
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
        "fullName email phone"
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
      "fullName email phone"
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


/*
 * ============================================================
 * GET ALL FAMILY MEMBERS
 * ============================================================
 *
 * Universal Care recipient source.
 *
 * Returns every User in the logged-in user's Family:
 *
 *   Parent
 *   Parent
 *   Child
 *   Child
 *
 * This is intentionally separate from /parent-child because
 * /parent-child represents relationship records, while Care
 * needs actual family members.
 */
const getFamilyMembers = async (req, res) => {
  try {
    const family = await Family.findOne({
      $or: [
        { father: req.user.id },
        { mother: req.user.id },
        { children: req.user.id },
      ],
    }).select(
      "_id familyCode father mother children"
    );

    if (!family) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const memberIds = [];

    if (family.father) {
      memberIds.push(
        family.father
      );
    }

    if (family.mother) {
      memberIds.push(
        family.mother
      );
    }

    for (const child of family.children || []) {
      memberIds.push(child);
    }

    const uniqueIds = [
      ...new Set(
        memberIds.map(
          (id) => id.toString()
        )
      ),
    ];

    /*
     * Do not show the current user as a recipient.
     */
    const recipientIds =
      uniqueIds.filter(
        (id) =>
          id !==
          req.user.id.toString()
      );

    const users =
      await User.find({
        _id: {
          $in: recipientIds,
        },
        role: {
          $in: [
            "parent",
            "child",
          ],
        },
      }).select(
        "_id fullName email phone role"
      );

    const order = {
      parent: 0,
      child: 1,
    };

    users.sort(
      (a, b) =>
        (order[a.role] ?? 99) -
        (order[b.role] ?? 99)
    );

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(
      "Get family members error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server Error",
    });
  }
};

module.exports = {
  getParents,
  getFamilyMembers,
  removeParent,
  switchActiveParent,
};
