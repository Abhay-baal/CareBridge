const CarePlan = require("../models/CarePlan");
const Parent = require("../models/Parent");

// Create Care Plan
const createCarePlan = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority,
    } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title and due date are required",
      });
    }

    const parent = await Parent.findOne({
      user: req.user.id,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const carePlan = await CarePlan.create({
      parent: parent._id,
      title,
      description,
      dueDate,
      priority,
    });

    res.status(201).json({
      success: true,
      message: "Care plan created successfully",
      data: carePlan,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All Care Plans
const getCarePlans = async (req, res) => {
  try {

    const parent = await Parent.findOne({
      user: req.user.id,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const carePlans = await CarePlan.find({
      parent: parent._id,
    });

    res.status(200).json({
      success: true,
      data: carePlans,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

// Update Care Plan
const updateCarePlan = async (req, res) => {
  try {

    const parent = await Parent.findOne({
      user: req.user.id,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const carePlan = await CarePlan.findOneAndUpdate(
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

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: "Care plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Care plan updated successfully",
      data: carePlan,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

// Delete Care Plan
const deleteCarePlan = async (req, res) => {
  try {

    const parent = await Parent.findOne({
      user: req.user.id,
    });

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

    res.status(200).json({
      success: true,
      message: "Care plan deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
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