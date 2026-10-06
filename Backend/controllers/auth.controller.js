const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');
const { googleLoginService } = require('../services/auth.service');

const googleLogin = asyncHandler(async (req, res) => {
    const { credentials } = req.body;

    if (!credentials) {
        throw new ApiError(400, "Google credentials are required");
    }

    const { user, token } = await googleLoginService(credentials);

    if (!user || !token) {
        throw new ApiError(400, "Invalid credentials");
    }

    const sourceAccount = await prisma.googleAccount.findUnique({
        where: {
            userId: user.id
        },
        select: {
            email: true
        }
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    return res.status(200).json({
        success: true,
        message: "Successfully logged in",
        user,
        sourceDriveConnected: !!sourceAccount
    });
});

const getUser = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(400, "Authentication failed");
    }

    return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        user
    });
});

const logout = asyncHandler(async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});

module.exports = {
    googleLogin,
    getUser,
    logout
};