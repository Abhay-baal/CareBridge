const EmergencyContact = require("../models/EmergencyContact");
const Parent = require("../models/Parent");

const getParentForChild = async (req) => {
  return Parent.findOne({ user: req.user.parent });
};

const getContacts = async (req, res) => {
  try {
    const parent = await getParentForChild(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const contacts = await EmergencyContact.find({
      parent: parent._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const createContact = async (req, res) => {
  try {
    const parent = await getParentForChild(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const { name, relation, phone } = req.body;

    const contact = await EmergencyContact.create({
      parent: parent._id,
      name,
      relation,
      phone,
    });

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateContact = async (req, res) => {
  try {
    const parent = await getParentForChild(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const contact = await EmergencyContact.findOneAndUpdate(
      {
        _id: req.params.id,
        parent: parent._id,
      },
      req.body,
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

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const deleteContact = async (req, res) => {
  try {
    const parent = await getParentForChild(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
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

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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
