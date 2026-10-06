const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError")

const getDashboardStatsService = async(userId) => {

    if(!userId) {
        throw new ApiError(400, "");
    }

    const totalTransfersCount = await prisma.transfer.count({
        where : {
            userId
        }
    })


    const totalTransfersSuccessCount = await prisma.transfer.count({
        where : {
            userId,
            status : "SUCCESS"
        }
    });


    const totalTransfersFailedCount = await prisma.transfer.count({
        where : {
            userId,
            status : "FAILED"
        }
    });


    const totalTransfersSize = await prisma.transfer.aggregate({
        where : {
            userId,
            status : "SUCCESS"
        },
        _sum : {
            fileSize : true
        }
    });
    

    if(!totalTransfersSize) {
        throw new ApiError(400, "total transfers files sizes fetch failed");
    }

    const lastTransfer = await prisma.transfer.findFirst({
        where : {
            userId
        },
        select : {
            fileName : true,
            status : true,
            createdAt : true
        },
        orderBy: {
            createdAt: "desc"
        },
    });


    return {
        totalTransfersCount,
        totalTransfersSuccessCount,
        totalTransfersFailedCount,
        totalTransfersSize : totalTransfersSize._sum.fileSize || BigInt(0),
        lastTransfer
    }

}

module.exports = {
    getDashboardStatsService
}