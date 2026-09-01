const CarePlan = require("../models/CarePlan");
const Parent = require("../models/Parent");
const ParentChild = require("../models/ParentChild");
const User = require("../models/User");
const Family = require("../models/Family");

/*
 * ------------------------------------------------------------
 * USER / FAMILY HELPERS
 * ------------------------------------------------------------
 */

const normalizeId = (value) => {
  if (!value) return null;

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
};

const getFamilyForUser = async (userId) => {
  return Family.findOne({
    $or: [
      { father: userId },
      { mother: userId },
      { children: userId },
    ],
  });
};

const isUserInFamily = (family, userId) => {
  if (!family || !userId) return false;

  const target = userId.toString();

  if (
    family.father &&
    family.father.toString() === target
  ) {
    return true;
  }

  if (
    family.mother &&
    family.mother.toString() === target
  ) {
    return true;
  }

  return (family.children || []).some(
    (child) =>
      child.toString() === target
  );
};

const getParentProfile = async (userId) => {
  return Parent.findOne({
    user: userId,
  });
};

/*
 * Find the old ParentChild relationship when one exists.
 *
 * Parent -> Child
 * Child -> Parent
 *
 * Parent -> Parent and Child -> Child intentionally have
 * no ParentChild relationship and therefore return null.
 */
const getRelationshipBetweenUsers = async (
  userA,
  userB
) => {
  return ParentChild.findOne({
    $or: [
      {
        parent: userA,
        child: userB,
      },
      {
        parent: userB,
        child: userA,
      },
    ],
  });
};

/*
 * ------------------------------------------------------------
 * CREATE UNIVERSAL CARE PLAN
 * ------------------------------------------------------------
 *
 * Any family member can create care for any other family member.
 */
const createCarePlan = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      recipientId,
      childId,
      parentId,
      careType,
      walkLevel,
      walkDuration,
    } = req.body;

    /*
     * recipientId is the new universal field.
     *
     * childId / parentId are accepted for backward compatibility.
     */
    const targetRecipientId =
      recipientId ||
      childId ||
      parentId;

    if (!title || !targetRecipientId) {
      return res.status(400).json({
        success: false,
        message:
          "Title and recipient are required",
      });
    }

    const creatorId =
      req.user.id.toString();

    const recipientIdString =
      targetRecipientId.toString();

    /*
     * Prevent assigning care to yourself.
     */
    if (
      creatorId ===
      recipientIdString
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot assign care to yourself",
      });
    }

    /*
     * Find creator's family.
     */
    const family =
      await getFamilyForUser(
        creatorId
      );

    if (!family) {
      return res.status(403).json({
        success: false,
        message:
          "You are not connected to a family",
      });
    }

    /*
     * Make absolutely sure the recipient belongs to the
     * SAME family.
     */
    if (
      !isUserInFamily(
        family,
        recipientIdString
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only assign care to someone in your family",
      });
    }

    /*
     * Confirm recipient actually exists.
     */
    const recipient =
      await User.findById(
        recipientIdString
      ).select(
        "_id fullName email phone role"
      );

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message:
          "Recipient not found",
      });
    }

    if (
      !["parent", "child"].includes(
        recipient.role
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid care recipient",
      });
    }

    /*
     * If this is a Parent <-> Child assignment, preserve
     * the existing relationship fields.
     */
    const relationship =
      await getRelationshipBetweenUsers(
        creatorId,
        recipientIdString
      );

    let parentProfile = null;
    let parentUserId = null;
    let childUserId = null;

    if (relationship) {
      parentUserId =
        relationship.parent.toString();

      childUserId =
        relationship.child.toString();

      parentProfile =
        await getParentProfile(
          parentUserId
        );
    }

    /*
     * If the recipient is a parent, we can also resolve their
     * Parent profile for legacy compatibility.
     */
    if (
      recipient.role ===
      "parent"
    ) {
      parentProfile =
        parentProfile ||
        (await getParentProfile(
          recipientIdString
        ));
    }

    /*
     * Optional due date.
     *
     * No date/time means null.
     */
    let normalizedDueDate = null;

    if (
      dueDate !== undefined &&
      dueDate !== null &&
      dueDate !== ""
    ) {
      const parsedDate =
        new Date(dueDate);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid due date",
        });
      }

      normalizedDueDate =
        parsedDate;
    }

    /*
     * Walk validation.
     */
    const normalizedCareType =
      careType === "walk"
        ? "walk"
        : "task";

    if (
      normalizedCareType ===
      "walk"
    ) {
      if (
        !walkLevel ||
        !walkDuration
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Walk level and duration are required",
        });
      }
    }

    const carePlanData = {
      createdBy: creatorId,

      recipient:
        recipient._id,

      recipientRole:
        recipient.role,

      family:
        family._id,

      title:
        String(title).trim(),

      description:
        description
          ? String(description).trim()
          : "",

      careType:
        normalizedCareType,

      dueDate:
        normalizedDueDate,

      walkLevel:
        normalizedCareType ===
        "walk"
          ? walkLevel
          : undefined,

      walkDuration:
        normalizedCareType ===
        "walk"
          ? walkDuration
          : undefined,
    };

    /*
     * Preserve old ParentChild data whenever this is a
     * Parent <-> Child assignment.
     */
    if (relationship) {
      /*
       * Parent <-> Child assignment.
       *
       * Preserve the existing ParentChild relationship fields
       * for legacy compatibility and existing UI/data.
       */
      carePlanData.parentChild =
        relationship._id;

      carePlanData.child =
        childUserId;

      if (parentProfile) {
        carePlanData.parent =
          parentProfile._id;
      }
    } else {
      /*
       * Universal family assignment:
       *
       * Parent  -> Parent
       * Child   -> Child
       *
       * These pairs do NOT have a ParentChild relationship.
       *
       * They are authorized because both users were already
       * verified above to belong to the SAME Family.
       *
       * Therefore:
       *   recipient + family
       * are sufficient.
       *
       * Do NOT reject Child -> Child here.
       */
    }
    const carePlan =
      await CarePlan.create(
        carePlanData
      );

    const populatedCarePlan =
      await CarePlan.findById(
        carePlan._id
      )
        .populate(
          "createdBy",
          "fullName email phone role"
        )
        .populate(
          "recipient",
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
            select:
              "fullName email phone role",
          },
        })
        .populate(
          "parentChild"
        )
        .populate(
          "family"
        );

    return res.status(201).json({
      success: true,
      message:
        "Care plan created successfully",
      data:
        populatedCarePlan,
    });
  } catch (error) {
    console.error(
      "Create universal care plan error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server Error",
    });
  }
};

/*
 * ------------------------------------------------------------
 * GET FAMILY CARE PLANS
 * ------------------------------------------------------------
 */
const getCarePlans = async (
  req,
  res
) => {
  try {
    const family =
      await getFamilyForUser(
        req.user.id
      );

    if (!family) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const carePlans =
      await CarePlan.find({
        family:
          family._id,
      })
        .populate(
          "createdBy",
          "fullName email phone role"
        )
        .populate(
          "recipient",
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
            select:
              "fullName email phone role",
          },
        })
        .populate(
          "parentChild"
        )
        .populate(
          "family"
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
    console.error(
      "Get family care plans error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server Error",
    });
  }
};

/*
 * ------------------------------------------------------------
 * UPDATE CARE PLAN
 * ------------------------------------------------------------
 *
 * Creator OR recipient can update it.
 */
const updateCarePlan = async (
  req,
  res
) => {
  try {
    const carePlan =
      await CarePlan.findById(
        req.params.id
      );

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message:
          "Care plan not found",
      });
    }

    const currentUserId =
      req.user.id.toString();

    const creatorId =
      normalizeId(
        carePlan.createdBy
      );

    const recipientId =
      normalizeId(
        carePlan.recipient
      );

    /*
     * Legacy records may not have recipient.
     *
     * Fall back to child / parent.
     */
    let legacyRecipientId =
      recipientId;

    if (!legacyRecipientId) {
      legacyRecipientId =
        normalizeId(
          carePlan.child
        );
    }

    if (
      !legacyRecipientId &&
      carePlan.parent
    ) {
      const parent =
        await Parent.findById(
          carePlan.parent
        ).select("user");

      legacyRecipientId =
        normalizeId(
          parent?.user
        );
    }

    const canUpdate =
      creatorId ===
        currentUserId ||
      legacyRecipientId ===
        currentUserId;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot update this care plan",
      });
    }

    const allowedUpdates =
      {};

    if (
      req.body.title !==
      undefined
    ) {
      const title =
        String(
          req.body.title
        ).trim();

      if (!title) {
        return res.status(400).json({
          success: false,
          message:
            "Title cannot be empty",
        });
      }

      allowedUpdates.title =
        title;
    }

    if (
      req.body.description !==
      undefined
    ) {
      allowedUpdates.description =
        String(
          req.body.description ||
            ""
        ).trim();
    }

    if (
      req.body.dueDate !==
      undefined
    ) {
      if (
        req.body.dueDate ===
          null ||
        req.body.dueDate ===
          ""
      ) {
        allowedUpdates.dueDate =
          null;
      } else {
        const parsed =
          new Date(
            req.body.dueDate
          );

        if (
          Number.isNaN(
            parsed.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid due date",
          });
        }

        allowedUpdates.dueDate =
          parsed;
      }
    }

    if (
      req.body.status !==
      undefined
    ) {
      if (
        ![
          "pending",
          "completed",
        ].includes(
          req.body.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status",
        });
      }

      allowedUpdates.status =
        req.body.status;
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
          "recipient",
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
            select:
              "fullName email phone role",
          },
        })
        .populate(
          "parentChild"
        )
        .populate(
          "family"
        );

    return res.status(200).json({
      success: true,
      message:
        "Care plan updated successfully",
      data:
        updatedCarePlan,
    });
  } catch (error) {
    console.error(
      "Update care plan error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server Error",
    });
  }
};

/*
 * ------------------------------------------------------------
 * DELETE CARE PLAN
 * ------------------------------------------------------------
 *
 * Creator can delete anytime.
 *
 * Recipient can delete once completed.
 */
const deleteCarePlan = async (
  req,
  res
) => {
  try {
    const carePlan =
      await CarePlan.findById(
        req.params.id
      );

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message:
          "Care plan not found",
      });
    }

    const currentUserId =
      req.user.id.toString();

    const creatorId =
      normalizeId(
        carePlan.createdBy
      );

    const recipientId =
      normalizeId(
        carePlan.recipient
      );

    const isCreator =
      creatorId ===
      currentUserId;

    const isRecipient =
      recipientId ===
      currentUserId;

    const canDelete =
      isCreator ||
      (
        carePlan.status ===
          "completed" &&
        isRecipient
      );

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot delete this care plan",
      });
    }

    await carePlan.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Care plan deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete care plan error:",
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
  createCarePlan,
  getCarePlans,
  updateCarePlan,
  deleteCarePlan,
};
