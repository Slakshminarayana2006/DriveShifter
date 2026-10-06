const { google } = require("googleapis");
const {sourceClient, destinationClient} = require("../config/googleOAuth");
const oauth2Client = sourceClient;
const prisma = require("../config/prisma")
const ApiError = require("../utils/ApiError");


const getFiles = async (userId) => {
    const account = await prisma.googleAccount.findUnique({
        where : {
            userId : userId
        }
    })

    console.log("Logged-in user ID:", userId);
    console.log("Google account found:", !!account);
    console.log("Connected Google email:", account?.email);

    if(!account) {
        throw new ApiError(400, "Files not fetched");
    }

    oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken
    });
    
    const drive = google.drive({
        version: "v3",
        auth: oauth2Client
    })

    if(!drive) {
        throw new ApiError(400, "Internal Error");
    }

    const response = await drive.files.list({
        pageSize : 20,
        fields : "files(id,name,mimeType,size,modifiedTime)"
    });

    if(!response) {
        throw new ApiError(400, "Internal Error");
    }

    return response.data.files

}


const getAllFilesByFolderIdService = async (userId, folderId) => {
    if(!userId) {
        throw new ApiError(400, "user id didn't get it");
    }

    if(!folderId) {
        throw new ApiError(400, "Folder Id didn't get")
    }


    const account = await prisma.googleAccount.findUnique({
        where : {
            userId
        }
    })

    if(!account) {
        throw new ApiError(400, "google account didn't found");
    }

    oauth2Client.setCredentials({
        access_token : account.accessToken,
        refresh_token : account.refreshToken
    });

    const drive = google.drive({
        version : "v3",
        auth : oauth2Client
    })


    if(!drive) {
        throw new ApiError(400, "drive account not found");
    }

    const response = await drive.files.list({
        q : `'${folderId}' in parents and trashed=false`,
        fields : "files(id,name,mimeType,size,modifiedTime,iconLink,thumbnailLink)"
    })
    
    if(!response) {
        throw new ApiError(400, "response didn't generated");
    }

    return response.data.files;
}

const getSearchFileService = async (userId, searchText) => {
    if(!userId) {
        throw new ApiError(400, "user is not found");
    }

    if(!searchText) {
        throw new ApiError(400, "search text is not obtained");
    }

    console.log(searchText);
    const account = await prisma.googleAccount.findUnique({
        where : {
            userId
        }
    })

    if(!account) {
        throw new ApiError(400, "google account didn't found");
    }

    oauth2Client.setCredentials({
        access_token : account.accessToken,
        refresh_token : account.refreshToken
    });

    const drive = google.drive({
        version : "v3",
        auth : oauth2Client
    })


    if(!drive) {
        throw new ApiError(400, "drive account not found");
    }

    const response = await drive.files.list({
        q : `name contains '${searchText}' and trashed=false`,
        fields : "files(id,name,mimeType,size,modifiedTime,iconLink,thumbnailLink)"
    });
    
    if(!response) {
        throw new ApiError(400, "response didn't generated");
    }

    return response.data.files;
}

const fileDetailsService = async (userId, fileId) => {
    if(!userId) {
        throw new ApiError(400, "user id not found");
    }

    if(!fileId) {
        throw new ApiError(400, "filed id not  found");
    }

    const account = await prisma.googleAccount.findUnique({
        where : {
            userId
        }
    });

    if(!account) {
        throw new ApiError(400, "account not found");
    }

    oauth2Client.setCredentials({
        access_token : account.accessToken,
        refresh_token : account.refreshToken
    });

    const drive = google.drive({
        version : "v3",
        auth : oauth2Client
    })


    if(!drive) {
        throw new ApiError(400, "drive account not found");
    }

    const response = await drive.files.get({
        fileId,
        fields : "id,name,mimeType,size,createdTime,modifiedTime,iconLink,thumbnailLink,owners,webViewLink,webContentLink"
    });

    return response.data;
}

const getDestinationAccountService = async (userId) => {
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const account = await prisma.destinationAccount.findUnique({
        where: {
            userId
        },
        select: {
            email: true,
            googleId: true
        }
    });

    if (!account) {
        return null;
    }

    return account;
};

const disconnectDestinationAccountService = async (userId) => {
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const account = await prisma.destinationAccount.findUnique({
        where: {
            userId
        }
    });

    if (!account) {
        throw new ApiError(404, "Destination account not found");
    }

    await prisma.destinationAccount.delete({
        where: {
            userId
        }
    });

    return {
        message: "Destination account disconnected successfully"
    };
};

module.exports = {
    getFiles,
    getAllFilesByFolderIdService,
    getSearchFileService,
    fileDetailsService,
    getDestinationAccountService,
    disconnectDestinationAccountService
}