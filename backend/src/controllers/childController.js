const Parent = require("../models/Parent");
const CarePlan = require("../models/CarePlan");
const Appointment = require("../models/Appointment");

const getParentForChild = async (req) => {
  return Parent.findOne({
    user: req.user.parent,
  }).populate("user", "fullName email phone");
};

const getChildDashboard = async (req, res) => {
  try {
    const parent = await getParentForChild(req);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const [carePlans, appointments] = await Promise.all([
      CarePlan.find({ parent: parent._id }).sort({ dueDate: 1 }),
      Appointment.find({ parent: parent._id }).sort({
        appointmentDate: 1,
      }),
    ]);

    const completedTasks = carePlans.filter(
      (task) => task.status === "completed"
    ).length;

    res.status(200).json({
      success: true,
      data: {
        parent,
        carePlans,
        appointments,
        stats: {
          totalTasks: carePlans.length,
          completedTasks,
          totalAppointments: appointments.length,
          totalReports: 0,
        },
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateChildCarePlan = async (req, res) => {
  try {
    const parent = await getParentForChild(req);

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
      {
        status: req.body.status,
      },
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
      message: "Task updated successfully",
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

module.exports = {
  getChildDashboard,
  updateChildCarePlan,
};
