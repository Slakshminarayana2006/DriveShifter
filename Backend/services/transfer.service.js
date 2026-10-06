const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const {sourceClient, destinationClient} = require('../config/googleOAuth');
const {google} = require('googleapis');
const { search } = require("../routes/drive.route");



const transerFilesService = async (userId, fileIds) => {

    if(!userId || !fileIds) {
        throw new ApiError(400, "Internal Error1");
    }

    if(!Array.isArray(fileIds)) {
        throw new ApiError(400, "Internal Error2");
    }

    if(fileIds.length === 0) {
        throw new ApiError(400, "Internal Error3");
    }

    const sourceAccount = await prisma.googleAccount.findUnique({
        where : {
            userId
        }
    });

    if(!sourceAccount) {
        throw new ApiError(400, "Internal Error4");
    }

    const destinationAccount = await prisma.destinationAccount.findUnique({
        where : {
            userId
        }
    });

    console.log(userId);
    
    if(!destinationAccount) {
        throw new ApiError(400, "Internal Error5");

    }

    destinationClient.setCredentials({
        access_token : destinationAccount.accessToken,
        refresh_token : destinationAccount.refreshToken,

    });

    sourceClient.setCredentials({
        access_token : sourceAccount.accessToken,
        refresh_token : sourceAccount.refreshToken,
    });

    const sourceDrive = google.drive({
        version : "v3",
        auth : sourceClient
    });
    
    if(!sourceDrive) {
        throw new ApiError(400, "Internal Error6");
    }
    
    
    const destinationDrive = google.drive({
        version : "v3",
        auth : destinationClient
    });
    
    if(!destinationDrive) {
        throw new ApiError(400, "Internal Error7");
    }


    const result = [];
    let successful = 0; 
    let failed = 0; 

    for(const fileId of fileIds) {
        try {
            const metadata = await sourceDrive.files.get({
                fileId, 
                fields : "id,name,mimeType,size"
            })
    
            if(!metadata) {
                throw new ApiError(400, "Internal Error8");
            }
    
            const response = await sourceDrive.files.get(
                {
                    fileId,
                    alt: "media"
                },
                {
                    responseType: "stream"
                }
            );
    
            if(!response) {
                throw new ApiError(400, "Internal Error9");
            }
    
            const uploadedFile = await destinationDrive.files.create({
                requestBody : {
                    name : metadata.data.name
                },
                media : {
                    mimeType : metadata.data.mimeType,
                    body : response.body
                },
                fields : "id,name"
            })
    
            if(!uploadedFile) {
                throw new ApiError(400, "Internal Error10");
            }
    
            await prisma.transfer.create({
                data : {
                    fileId : metadata.data.id,
                    fileName : metadata.data.name,
                    fileSize : BigInt((metadata.data.size) || 0),
                    sourceEmail : sourceAccount.email,
                    destinationEmail : destinationAccount.email,
                    status : "SUCCESS",
                    userId
                }
            });
            successful++;
            result.push({
                fileId,
                status : "SUCCESS"
            });


        } catch (error) {
            failed++;
            result.push({
                fileId,
                status : "FAILED"
            });
        }
    }

    return {
        totalFiles : result.length,
        successful,
        failed,
        result
    };
}

const getAllTransfersHistoryService = async (userId) => {
    if(!userId) {
        throw new ApiError(400, "user id not found");
    }


    const allTransfers = await prisma.transfer.findMany({
        where : {
            userId
        }
    });

    if(!allTransfers) {
        throw new ApiError(400, "transfer history not found");
    }

    return {
        total : allTransfers.length,
        transfers : allTransfers
    }
}


const getAllTransfersHistoryByLimitService =  async(userId, page, limit) => {
     if(!userId) {
        throw new ApiError(400, "user id not found");
    }


    const total = await prisma.transfer.count({
        where : {
            userId
        }
    });
    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit; 
    const transfers = await prisma.transfer.findMany({
        where : {
            userId
        },
        skip : skip,
        take : limit,
        orderBy: {
            createdAt: "desc"
        }
    })

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        transfers
    }
}


const getHistoryBySearchService = async (userId, page, limit, search) => {

    if(!userId) {
        throw new ApiError(400, "user id not fetched");
    }

    if(!page) {
        throw new ApiError(400, "page not fetched");
    }

    if(!limit) {
        throw new ApiError(400, "limit not fetched");
    }

    if(!search) {
        throw new ApiError(400, "search not fetched");
    }


    page = Number(page);
    limit = Number(limit);


    const where = {
        userId
    };

    if (search) {
        where.OR = [
            {
                fileName: {
                    contains: search,
                    mode: "insensitive"
                }
            },
            {
                sourceEmail: {
                    contains: search,
                    mode: "insensitive"
                }
            },
            {
                destinationEmail: {
                    contains: search,
                    mode: "insensitive"
                }
            }
        ];
    }


    const total = await prisma.transfer.count({
        where
    })

    const skip = (page - 1) * limit; 

    const transfers = await prisma.transfer.findMany({
        where,
        skip : skip,
        take : limit,
        orderBy : {
            createdAt : "desc"
        }
    })


    if(!transfers) {
        throw new ApiError(400, "search not fetched");
    }

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        transfers
    };
}
 
const getHistoryByFilterService = async(userId, page, limit, search, status) => {
    if (!userId) {
        throw new ApiError(400, "User id not found");
    }

    page = Number(page);
    limit = Number(limit);

    const where = {
        userId
    };

    if (search) {
        where.OR = [
            {
                fileName: {
                    contains: search,
                    mode: "insensitive"
                }
            },
            {
                sourceEmail: {
                    contains: search,
                    mode: "insensitive"
                }
            },
            {
                destinationEmail: {
                    contains: search,
                    mode: "insensitive"
                }
            }
        ];
    }

    if (status) {
        where.status = status.toUpperCase();
    }

    const total = await prisma.transfer.count({
        where
    });

    const skip = (page - 1) * limit;

    const transfers = await prisma.transfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
            createdAt: "desc"
        }
    });

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        transfers
    };
}


const getHistoryBySortService = async(userId, page, limit, sort) => {

    if(!userId) {
        throw new ApiError(400, "User id not found");
    }

    page = Number(page);
    limit = Number(limit);

    const order = {
        createdAt : sort === "latest" ? "desc" : "asc"
    }

    const total = await prisma.transfer.count({
        where : {
            userId
        }
    });

    if(!total) {
        throw new ApiError(400, "Error while occurring the database")
    }

    const skip = (page - 1) * limit;

    const transfers = await prisma.transfer.findMany({
        where : {
            userId
        },
        skip : skip,
        take : limit,
        orderBy : order
    });

    if(!transfers) {
        throw new ApiError(400, "Error while occurring the database");
    }

    return {
        total, 
        limit, 
        page,
        totalPages : Math.ceil(total / limit),
        transfers
    }
}



const transferFolderService = async(userId, folderId) => {
    if(!userId) {
        throw new ApiError(400, "Authencation failed");
    }

    if(!folderId) {
        throw new ApiError(400, "folder id is not found");
    }

    const sourceAccount = await prisma.googleAccount.findUnique({
        where : {
            userId
        }
    });

    if(!sourceAccount) {
        throw new ApiError(400, "source accound fetched failed");
    }

    const destinationAccount = await prisma.destinationAccount.findUnique({
        where : {
            userId
        }
    })

    if(!destinationAccount) {
        throw new ApiError(400, "destination account not found");
    }

    await sourceClient.setCredentials({
        access_token : sourceAccount.accessToken,
        refresh_token : sourceAccount.refreshToken
    });


    await destinationClient.setCredentials({
        access_token : destinationAccount.accessToken,
        refresh_token : destinationAccount.refreshToken
    });

    const sourceDrive = google.drive({
        version : "v3",
        auth : sourceClient
    });

    if(!sourceDrive) {
        throw new ApiError(400, "source google drive account is not found");
    }

    const destinationDrive = google.drive({
        version : "v3",
        auth : destinationClient
    });

    if(!destinationDrive) {
        throw new ApiError(400, "destination google drive account is not found");
    }

    const sourceFolder = await sourceDrive.files.get({
        fileId : folderId,
        fields : "id,name,mimeType"
    });



    if (sourceFolder.data.mimeType !== "application/vnd.google-apps.folder") {
        throw new ApiError(400, "Provided ID is not a folder");
    }

    const destinationFolder = await destinationDrive.files.create({
        requestBody : {
            name : (await sourceFolder).data.name,
            mimeType : "application/vnd.google-apps.folder"
        },
        fields : "id,name"
    });

    if(!destinationFolder) {
        throw new ApiError(400, "destination folder not found");
    }

    const result = {
        totalFiles : 0,
        successful : 0,
        failed : 0,
        results : []
    }

    await copyFolderRecursively(sourceDrive, destinationDrive, folderId, destinationFolder.data.id, sourceAccount.email, destinationAccount.email, userId, result);


    return result;
}



const copyFolderRecursively = async (sourceDrive, destinationDrive, sourceFolderId, destinationFolderId, sourceEmail, destinationEmail, userId, result) => {

    let children = []
    let pageToken = null


    do {
        const response = await sourceDrive.files.list({
            q : `'${sourceFolderId}' in parents and trashed = false`,
            fields: "files(id,name,mimeType,size)",
            pageSize : 100,
            pageToken
        });
        children.push(...(response.data.files || []));
        pageToken = response.data.nextPageToken;
    }
    while(pageToken);


    for(const child of children) {
        //if it is a file
        if(child.mimeType !== "application/vnd.google-apps.folder") {
            result.totalFiles++;

                try {
                    const fileResponse = await sourceDrive.files.get({
                        fileId : child.id,
                        alt : "media"
                    },{
                        responseType : "stream"
                    });
                    
                    await destinationDrive.files.create({
                        requestBody : {
                            name : child.name,
                            parents : [destinationFolderId]
                        },

                        media : {
                            mimeType : child.mimeType,
                            body : fileResponse.data
                        },

                        fields : "id,name"
                    })

                    await prisma.transfer.create({
                        data : {
                            fileId : child.id,
                            fileName : child.name,
                            fileSize : BigInt(child.size || 0),
                            sourceEmail,
                            destinationEmail,
                            status : "SUCCESS",
                            userId
                        }
                    });

                    result.successful++;

                    result.results.push({
                        fileId: child.id,
                        fileName: child.name,
                        status: "SUCCESS"
                    });


                }
                catch(e) {
                    result.failed++;
                    
                    result.results.push({
                        fileId: child.id,
                        fileName: child.name,
                        status: "FAILED",
                        error: error.message
                    })

                    await prisma.transfer.create({
                        data : {
                            fileId : child.id,
                            fileName : child.name,
                            fileSize : BigInt(child.size || 0),
                            sourceEmail,
                            destinationEmail,
                            status : "FAILED",
                            userId
                        }
                    })
                }
            continue;
        }

        //if it is a folder
        try {

            const existingFolder = await destinationDrive.files.list({
                q: `'${destinationFolderId}' in parents 
                    and name = '${child.name}' 
                    and mimeType = 'application/vnd.google-apps.folder'
                    and trashed = false`,
                fields: "files(id,name)"
            });
            

            let destinationSubFolderId;

            if (existingFolder.data.files.length > 0) {

                destinationSubFolderId =
                    existingFolder.data.files[0].id;

            } else {

                const newDestinationFolder =
                    await destinationDrive.files.create({
                        requestBody: {
                            name: child.name,
                            mimeType: "application/vnd.google-apps.folder",
                            parents: [destinationFolderId]
                        },
                        fields: "id,name"
                    });

                destinationSubFolderId =
                    newDestinationFolder.data.id;
            }


            await copyFolderRecursively(sourceDrive, destinationDrive, child.id, destinationSubFolderId, sourceEmail, destinationEmail, userId, result);

        } catch (error) {
             console.log(
                `Folder transfer failed: ${child.name}`,
                error.message
            );

            result.failedFolders = (result.failedFolders || 0) + 1;

            result.results.push({
                fileId: child.id,
                fileName: child.name,
                status: "FAILED",
                error: error.message,
                type: "FOLDER"
            });
        }
    }
}


module.exports = {
    transerFilesService,
    getAllTransfersHistoryService,
    getAllTransfersHistoryByLimitService,
    getHistoryBySearchService,
    getHistoryByFilterService,
    getHistoryBySortService,
    transferFolderService
}