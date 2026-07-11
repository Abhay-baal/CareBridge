const bcrypt = require("bcrypt");
const User = require("../models/User");

const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, phone, role } = req.body;


        // Basic Validation
        if (!fullName || !email || !password || !phone || !role) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
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

        // Check Existing User
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });


        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save User
        const user = await User.create({
            fullName,
            email: normalizedEmail,
            password: hashedPassword,
            phone,
            role,
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
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
};