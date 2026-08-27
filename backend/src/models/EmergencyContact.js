const mongoose = require("mongoose");

const emergencyContactSchema =
  new mongoose.Schema(
    {
      parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      relation: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

emergencyContactSchema.index({
  parent: 1,
  createdAt: -1,
});

module.exports =
  mongoose.model(
    "EmergencyContact",
    emergencyContactSchema
  );
