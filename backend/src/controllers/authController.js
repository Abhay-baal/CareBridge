const bcrypt = require("bcrypt");
const User = require("../models/User");
const Parent = require("../models/Parent");
const jwt = require("jsonwebtoken");
const AuthCode = require("../models/AuthCode");
const { sendEmail } = require("../config/mailer");

const OTP_TTL_MINUTES = 15;

const generateOtpCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const createAuthCode = async ({ email, purpose }) => {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(
    Date.now() + OTP_TTL_MINUTES * 60 * 1000
  );

  await AuthCode.deleteMany({ email, purpose });

  await AuthCode.create({
    email,
    purpose,
    codeHash,
    expiresAt,
  });

  return code;
};

const sendOtpEmail = async ({ email, code, purpose }) => {
  const subject =
    purpose === "verify-email"
      ? "Verify your CareBridge account"
      : "Reset your CareBridge password";

  const intro =
    purpose === "verify-email"
      ? "Use this code to verify your CareBridge account."
      : "Use this code to reset your CareBridge password.";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${subject}</h2>
      <p>${intro}</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
    </div>
  `;

  const text = `${intro} Code: ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};

const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      role,
    } = req.body;

    if (!fullName || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!["parent", "child", "provider"].includes(role)) {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role,
    };

    const user = await User.create(userData);

    // Automatically create the Parent profile for new parent accounts.
    if (role === "parent") {
      await Parent.create({
        user: user._id,
        address: "Not provided",
        emergencyContact: phone,
      });
    }

    const verificationCode = await createAuthCode({
      email: normalizedEmail,
      purpose: "verify-email",
    });

    await sendOtpEmail({
      email: normalizedEmail,
      code: verificationCode,
      purpose: "verify-email",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully. Verification code sent to email.",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        parent: user.parent || null,
        isVerified: user.isVerified,
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
        isVerified: user.isVerified,
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

const requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the account exists, a verification code was sent.",
      });
    }

    const verificationCode = await createAuthCode({
      email: normalizedEmail,
      purpose: "verify-email",
    });

    await sendOtpEmail({
      email: normalizedEmail,
      code: verificationCode,
      purpose: "verify-email",
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent",
    });
  } catch (error) {
    console.error("Request verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await AuthCode.findOne({
      email: normalizedEmail,
      purpose: "verify-email",
      consumedAt: null,
      expiresAt: {
        $gt: new Date(),
      },
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    if (record.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message: "Too many attempts. Request a new code.",
      });
    }

    const matches = await bcrypt.compare(code, record.codeHash);

    if (!matches) {
      record.attempts += 1;
      await record.save();

      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    record.consumedAt = new Date();
    await record.save();

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { isVerified: true } },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: user,
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (user) {
      const resetCode = await createAuthCode({
        email: normalizedEmail,
        purpose: "reset-password",
      });

      await sendOtpEmail({
        email: normalizedEmail,
        code: resetCode,
        purpose: "reset-password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "If the account exists, a reset code was sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await AuthCode.findOne({
      email: normalizedEmail,
      purpose: "reset-password",
      consumedAt: null,
      expiresAt: {
        $gt: new Date(),
      },
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Reset code has expired",
      });
    }

    if (record.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message: "Too many attempts. Request a new code.",
      });
    }

    const matches = await bcrypt.compare(code, record.codeHash);

    if (!matches) {
      record.attempts += 1;
      await record.save();

      return res.status(400).json({
        success: false,
        message: "Invalid reset code",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    record.consumedAt = new Date();
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  requestEmailVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
