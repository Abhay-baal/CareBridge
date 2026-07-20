const Appointment = require("../models/Appointment");
const Parent = require("../models/Parent");

// Create Appointment
const createAppointment = async (req, res) => {
  try {
    const {
      doctorName,
      hospitalName,
      appointmentDate,
      appointmentType,
      notes,
    } = req.body;

    if (!doctorName || !hospitalName || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "Doctor name, hospital name and appointment date are required",
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

    const appointment = await Appointment.create({
      parent: parent._id,
      doctorName,
      hospitalName,
      appointmentDate,
      appointmentType,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All Appointments
const getAppointments = async (req, res) => {
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

    const appointments = await Appointment.find({
      parent: parent._id,
    });

    res.status(200).json({
      success: true,
      data: appointments,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

// Update Appointment
const updateAppointment = async (req, res) => {
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

    const appointment = await Appointment.findOneAndUpdate(
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

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

// Delete Appointment
const deleteAppointment = async (req, res) => {
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

    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      parent: parent._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
};