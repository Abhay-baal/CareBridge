const bcrypt = require("bcrypt");
const User = require("../models/User");
const Parent = require("../models/Parent");
const jwt = require("jsonwebtoken");

const generateConnectionCode = () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return `CB-${code}`;
};

const generateUniqueConnectionCode = async () => {
  let connectionCode;
  let existingUser;

  do {
    connectionCode = generateConnectionCode();

    existingUser = await User.findOne({
      connectionCode,
    });
  } while (existingUser);

  return connectionCode;
};

const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      role,
      connectionCode,
    } = req.body;

    if (!fullName || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!["parent", "child"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const normalizedEmail = email.toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const phoneRegex = /^\d{10}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    let parent = null;

    if (role === "child") {
      if (!connectionCode) {
        return res.status(400).json({
          success: false,
          message: "Parent connection code is required",
        });
      }

      parent = await User.findOne({
        connectionCode: connectionCode.toUpperCase().trim(),
        role: "parent",
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Invalid parent connection code",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role,
    };

    // Keep the legacy parent relationship during migration.
    if (role === "child") {
      userData.parent = parent._id;
    }

    // Only parent accounts receive a connection code.
    if (role === "parent") {
      userData.connectionCode =
        await generateUniqueConnectionCode();
    }

    const user = await User.create(userData);

    // Automatically create the Parent profile for new parent accounts.
    if (role === "parent") {
      await Parent.create({
        user: user._id,
        address: "Not provided",
        emergencyContact: phone,
      });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        parent: user.parent || null,
        connectionCode: user.connectionCode || null,
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

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        parent: user.parent || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        parent: user.parent || null,
        connectionCode: user.connectionCode || null,
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

module.exports = {
  registerUser,
  loginUser,
};
