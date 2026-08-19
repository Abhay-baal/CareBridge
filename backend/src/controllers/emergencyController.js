const EmergencyContact = require("../models/EmergencyContact");
const Parent = require("../models/Parent");
const ParentChild = require("../models/ParentChild");

/*
 * Resolve which Parent profile the request is allowed to access.
 *
 * Parent:
 *   -> their own Parent profile
 *
 * Child:
 *   -> the currently active ParentChild relationship
 *
 * This keeps both roles supported while preventing a child
 * from accessing contacts belonging to an unrelated parent.
 */
const getAuthorizedParent = async (req) => {
  if (req.user.role === "parent") {
    return Parent.findOne({
      user: req.user.id,
    });
  }

  if (req.user.role === "child") {
    const activeRelationship = await ParentChild.findOne({
      child: req.user.id,
      active: true,
    });

    if (!activeRelationship) {
      return null;
    }

    return Parent.findOne({
      user: activeRelationship.parent,
    });
  }

  return null;
};

/*
 * GET /api/emergency
 *
 * Parent -> own contacts
 * Child  -> active parent's contacts
 */
const getContacts = async (req, res) => {
  try {
    const parent = await getAuthorizedParent(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message:
          req.user.role === "child"
            ? "No active parent found"
            : "Parent profile not found",
      });
    }

    const contacts = await EmergencyContact.find({
      parent: parent._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Get emergency contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/*
 * POST /api/emergency
 *
 * Parent -> create contact for themselves
 * Child  -> create contact for their active parent
 */
const createContact = async (req, res) => {
  try {
    const parent = await getAuthorizedParent(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message:
          req.user.role === "child"
            ? "No active parent found"
            : "Parent profile not found",
      });
    }

    const { name, relation, phone } = req.body;

    if (!name || !relation || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, relation and phone are required",
      });
    }

    const contact = await EmergencyContact.create({
      parent: parent._id,
      name: String(name).trim(),
      relation: String(relation).trim(),
      phone: String(phone).trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Emergency contact created successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Create emergency contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/*
 * PUT /api/emergency/:id
 *
 * Parent -> edit their own contact
 * Child  -> edit contact belonging to active parent
 */
const updateContact = async (req, res) => {
  try {
    const parent = await getAuthorizedParent(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message:
          req.user.role === "child"
            ? "No active parent found"
            : "Parent profile not found",
      });
    }

    const { name, relation, phone } = req.body;

    const updateData = {};

    if (name !== undefined) {
      updateData.name = String(name).trim();
    }

    if (relation !== undefined) {
      updateData.relation = String(relation).trim();
    }

    if (phone !== undefined) {
      updateData.phone = String(phone).trim();
    }

    const contact = await EmergencyContact.findOneAndUpdate(
      {
        _id: req.params.id,
        parent: parent._id,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Emergency contact updated successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Update emergency contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/*
 * DELETE /api/emergency/:id
 *
 * Parent -> delete their own contact
 * Child  -> delete contact belonging to active parent
 */
const deleteContact = async (req, res) => {
  try {
    const parent = await getAuthorizedParent(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message:
          req.user.role === "child"
            ? "No active parent found"
            : "Parent profile not found",
      });
    }

    const contact = await EmergencyContact.findOneAndDelete({
      _id: req.params.id,
      parent: parent._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Emergency contact deleted successfully",
    });
  } catch (error) {
    console.error("Delete emergency contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
};
