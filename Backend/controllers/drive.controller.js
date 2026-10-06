const {sourceClient, destinationClient} = require('../config/googleOAuth');
const prisma = require('../config/prisma');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const {getFiles, getAllFilesByFolderIdService, getSearchFileService, fileDetailsService, getDestinationAccountService, disconnectDestinationAccountService} = require('../services/drive.service');
const { google } = require('googleapis');

const connectDrive = asyncHandler(async (req, res) => {
    try {
        const url = sourceClient.generateAuthUrl({
            access_type: "offline",
            prompt: "select_account consent",
            scope: [
                "openid",
                "email",
                "profile",
                "https://www.googleapis.com/auth/drive"
            ],
            state: req.user.id
        });

        return res.redirect(url);
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
});


const driveCallback = asyncHandler(async (req, res, next) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            throw new ApiError(400, "Authorization code not received");
        }

        const { tokens } = await sourceClient.getToken(code);

        if (!tokens || !tokens.access_token) {
            throw new ApiError(401, "Google access token not received");
        }

        sourceClient.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: sourceClient,
            version: "v2"
        });

        const { data } = await oauth2.userinfo.get();

        const sourceEmail = data.email;
        const sourceGoogleId = data.id;

        console.log("Source Google account:", sourceEmail);

        if (!sourceEmail || !sourceGoogleId) {
            throw new ApiError(
                400,
                "Source Google account details not received"
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                id: state
            }
        });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        console.log("Source callback executed");
        console.log("DriveShifter user ID:", user.id);
        console.log("Google account email:", sourceEmail);
        console.log("Google account ID:", sourceGoogleId);


        await prisma.googleAccount.upsert({
            where: {
                userId: user.id
            },
            update: {
                googleId: sourceGoogleId,
                email: sourceEmail,
                accessToken: tokens.access_token,
                ...(tokens.refresh_token && {
                    refreshToken: tokens.refresh_token
                }),
                expiryDate: tokens.expiry_date
                    ? new Date(tokens.expiry_date)
                    : null
            },
            create: {
                userId: user.id,
                googleId: sourceGoogleId,
                email: sourceEmail,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date
                    ? new Date(tokens.expiry_date)
                    : null
            }
        });

        return res.redirect("http://localhost:5173/dashboard");

    } catch (error) {
        next(error);
    }
});


const getAllFiles = asyncHandler(async (req, res) => {
    const files = await getFiles(req.user.id);
    
    if(!files) {
        throw new ApiError(400, "Fectching files not done");
    }
    
    console.log(files);
    return res.status(200).json({
        success : true,
        message : "Drive Fetched Successfully",
        files
    });
});

const getAllFilesByFolderId = asyncHandler(async(req, res) => {
    const{folderId} = req.params;

    if(!folderId) {
        throw new ApiError(400, "Internal Error");
    }

    const files = await getAllFilesByFolderIdService(req.user.id, folderId);

    if(!files) {
        throw new ApiError(400, "Internal Error");
    }

    return res.status(200).json({
        success : true,
        message : "successfully fetched",
        files
    })
});


const getSearchFile = asyncHandler(async(req, res) => {
    try {
        const {q} = req.query;
    
        if(!q) {
            throw new ApiError(400, "query is not obtain");
        }
    
    
        const files = await getSearchFileService(req.user.id, q);
    
        if(!files) {
            throw new ApiError(400, "files not fetched ");
        }
    
        return res.status(200).json({
            success : true,
            message : "fetched successfully",
            files
        });
    }
    catch(error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }


});

const fileDetails = asyncHandler(async(req, res) => {
    const{id} = req.params;

    if(!id) {
        throw new ApiError(400, "Internal Error");
    }

    const fileDetailsAll = await fileDetailsService(req.user.id, id);

    if(!fileDetailsAll) {
        throw new ApiError(400, "file details doesn't fetched");
    }

    return res.status(200).json({
        success : true,
        message : "files details fetched",
        fileDetailsAll
    })
})


const connectDestinationDrive = asyncHandler(async (req, res) => {
    const url = destinationClient.generateAuthUrl({
        access_type: "offline",
        prompt: "select_account consent",
        scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive"
        ],
        state: req.user.id
    });

    if (!url) {
        throw new ApiError(400, "Internal Error");
    }

    res.redirect(url);
});




const destinationDriveCallback = asyncHandler(async (req, res, next) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            throw new ApiError(400, "Authorization code not received");
        }

      
        const { tokens } = await destinationClient.getToken(code);

        if (!tokens || !tokens.access_token) {
            console.error("Access token missing:", {
                hasTokens: !!tokens,
                hasAccessToken: !!tokens?.access_token,
                hasRefreshToken: !!tokens?.refresh_token
            });

            throw new ApiError(401, "Google access token not received");
        }

        destinationClient.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: destinationClient,
            version: "v2"
        });

        const { data } = await oauth2.userinfo.get();

        const destinationEmail = data.email;
        const destinationGoogleId = data.id;

        console.log("Destination email:", destinationEmail);

        if (!destinationEmail || !destinationGoogleId) {
            throw new ApiError(400, "Destination account details not received");
        }


        const user = await prisma.user.findUnique({
            where: {
                id: state
            }
        });

        if (!user) {
            throw new ApiError(400, "User not found");
        }

        await prisma.destinationAccount.upsert({
            where: {
                userId: user.id
            },
            update: {
                googleId: destinationGoogleId,
                email: destinationEmail,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date
                    ? new Date(tokens.expiry_date)
                    : null
            },
            create: {
                userId: user.id,
                googleId: destinationGoogleId,
                email: destinationEmail,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date
                    ? new Date(tokens.expiry_date)
                    : null
            }
        });

        return res.redirect("http://localhost:5173/dashboard");

    } catch (error) {
        next(error);
    }
});


const getDestinationAccount = asyncHandler(async (req, res) => {
    const account = await getDestinationAccountService(req.user.id);

    return res.status(200).json({
        success: true,
        message: account
            ? "Destination account fetched successfully"
            : "No destination account connected",
        connected: !!account,
        account
    });
})


const disconnectDestinationAccount = async (req, res, next) => {
    try {
        const result = await disconnectDestinationAccountService(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    connectDrive,
    driveCallback,
    getAllFiles,
    getAllFilesByFolderId,
    getSearchFile,
    fileDetails,
    connectDestinationDrive,
    destinationDriveCallback,
    getDestinationAccount,
    disconnectDestinationAccount
}