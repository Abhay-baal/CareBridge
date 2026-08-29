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
  const isVerification = purpose === "verify-email";

  const subject = isVerification
    ? "Verify your CareBridge account"
    : "Reset your CareBridge password";

  const title = isVerification
    ? "Verify your account"
    : "Reset your password";

  const intro = isVerification
    ? "Welcome to CareBridge. Please use the verification code below to confirm your email address."
    : "We received a request to reset your CareBridge password. Use the code below to continue.";

  const actionLabel = isVerification
    ? "Your verification code"
    : "Your reset code";

  const text = `${title}

${intro}

${actionLabel}: ${code}

This code expires in ${OTP_TTL_MINUTES} minutes.

If you did not request this, you can safely ignore this email.

CareBridge
Family care, connected with love.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>

<body style="margin:0;padding:0;background:#fff8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#3f3438;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff8fa;padding:42px 16px;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;background:#ffffff;border:1px solid #f3dfe4;border-radius:28px;overflow:hidden;box-shadow:0 18px 50px rgba(190,120,140,0.10);">

          <tr>
            <td style="padding:34px 36px 30px;background:#fff1f4;border-bottom:1px solid #f6e3e7;">

              <div style="width:44px;height:44px;line-height:44px;text-align:center;background:#fce3e9;border-radius:15px;font-size:22px;">
                🌸
              </div>

              <div style="margin-top:18px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c87589;">
                CareBridge
              </div>

              <div style="margin-top:8px;font-size:28px;line-height:36px;font-weight:700;color:#3f3438;">
                ${title}
              </div>

            </td>
          </tr>

          <tr>
            <td style="padding:34px 36px 36px;">

              <p style="margin:0;font-size:15px;line-height:25px;color:#78666c;">
                ${intro}
              </p>

              <div style="margin-top:28px;padding:24px 20px;text-align:center;background:#fff9fa;border:1px solid #f2dfe4;border-radius:20px;">

                <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#b28a94;">
                  ${actionLabel}
                </div>

                <div style="margin-top:13px;font-size:34px;line-height:42px;font-weight:700;letter-spacing:8px;color:#b95f76;padding-left:8px;">
                  ${code}
                </div>

              </div>

              <div style="margin-top:20px;padding:14px 16px;background:#fff5f7;border-radius:14px;text-align:center;">
                <p style="margin:0;font-size:12px;line-height:20px;color:#9a7e86;">
                  This code expires in
                  <strong style="color:#765963;">
                    ${OTP_TTL_MINUTES} minutes
                  </strong>.
                </p>
              </div>

              <p style="margin:26px 0 0;font-size:12px;line-height:20px;color:#a18d93;">
                If you didn't request this email, you can safely ignore it.
                Your account remains secure.
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:22px 36px;background:#fffafb;border-top:1px solid #f5e7ea;text-align:center;">

              <div style="font-size:13px;font-weight:700;color:#8c6570;">
                CareBridge
              </div>

              <div style="margin-top:5px;font-size:11px;color:#b29da3;">
                Family care, connected with love.
              </div>

            </td>
          </tr>

        </table>

        <p style="margin:18px 0 0;font-size:10px;line-height:17px;color:#b8a5aa;text-align:center;">
          This is an automated email from CareBridge. Please do not reply to this message.
        </p>

      </td>
    </tr>
  </table>

</body>
</html>
  `;

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

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
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
