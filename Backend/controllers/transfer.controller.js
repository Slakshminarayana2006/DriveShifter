const asyncHandler = require("../middlewares/asyncHandler");
const { transerFilesService, getAllTransfersHistoryService, getAllTransfersHistoryByLimitService, getHistoryBySearchService, getHistoryByFilterService, getHistoryBySortService, transferFolderService } = require("../services/transfer.service");
const ApiError = require("../utils/ApiError");


const transferFiles = asyncHandler(async(req, res) => {
    const{fileIds} = req.body;

    if(!fileIds) {
        throw new ApiError(400, "Internal Error");
    }


    const result = await transerFilesService(req.user.id, fileIds);

    if(!result) {
        throw new ApiError(400, "Internal Error");
    }

    return res.status(200).json({
        success : true,
        message : "transfered succesfully",
        ...result
    })
});


const getAllTransfersHistory = asyncHandler( async(req, res) => {
    try {

        const transferHistory = await getAllTransfersHistoryService(req.user.id);

        if(!transferHistory) {
            throw new ApiError(400, "History not found");
        }

        return res.status(200).json({
            success : true,
            message : "History fetched Successfully",
            ...transferHistory
        });

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
});

const getAllTransfersHistoryByLimit = asyncHandler(async(req, res) => {
    try {
        const{page = 1, limit = 10} = req.query;


        if(!page) {
            throw new ApiError(400, "no pages");
        }

        if(!limit) {
            throw new ApiError(400, "page limits not found");
        }


        const limitTransferHistory = await getAllTransfersHistoryByLimitService(req.user.id, page, limit);

        if(!limitTransferHistory) {
            throw new ApiError(400, "History not found");
        }

        return res.status(200).json({
            success : true,
            message : "History fetched Successfully",
            ...limitTransferHistory
        });
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
});


const getHistoryBySearch = asyncHandler(async(req, res) => {
    const{page = 1, limit = 10, search = ""} = req.query;


    if(!page) {
        throw new ApiError(400, "page no is not given");
    }

    if(!limit) {
        throw new ApiError(400, "limit is not given");
    }

    if(!search) {
        throw new ApiError(400, "search is not given");
    }

    const transferHistory = await getHistoryBySearchService(req.user.id, page, limit, search);

    if(!transferHistory)  {
        throw new ApiError(400, "history is not generated");
    }

    return res.status(200).json({
        success : true,
        message : "successfully history fetched", 
        ...transferHistory
    })
});


const getHistoryByFilter = asyncHandler(async(req, res) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        status
    } = req.query;

    const transferHistory = await getHistoryByFilterService(
        req.user.id,
        page,
        limit,
        search,
        status
    );

    return res.status(200).json({
        success: true,
        message: "Transfer history fetched successfully",
        ...transferHistory
    });
});


const getHistoryBySort = asyncHandler(async(req, res) => {
    const {
        page = 1,
        limit = 10,
        sort = "latest"
    } = req.query;

    const transferHistory = await getHistoryBySortService(req.user.id, page, limit, sort);

    if(!transferHistory) {
        throw new ApiError(400, "History not generated");
    }

    return res.status(200).json({
        success : false,
        message : "History Generated Successfully",
        transferHistory
    });
});


const transferFolder = asyncHandler( async(req, res) => {
    const {folderId} = req.params;
    if(!folderId) {
        throw new ApiError(400, "folder id not found");
    }

    const transferFolderDetails = await transferFolderService(req.user.id, folderId);

    if(!transferFolderDetails) {
        throw new ApiError(400, "transfer folder is failed");
    }

    return res.status(200).json({
        success : true,
        message : "folder is successfully transfered",
        ...transferFolderDetails
    });
    
});

module.exports = {
    transferFiles,
    getAllTransfersHistory,
    getAllTransfersHistoryByLimit,
    getHistoryBySearch,
    getHistoryByFilter,
    getHistoryBySort,
    transferFolder
}