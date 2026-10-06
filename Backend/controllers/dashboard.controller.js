const asyncHandler = require("../middlewares/asyncHandler");
const { getDashboardStatsService } = require("../services/dashboard.service");
const ApiError = require("../utils/ApiError");



const getDashboardStats = asyncHandler(async(req, res) => {
    const stats = await getDashboardStatsService(req.user.id);
    if(!stats) {
        throw new ApiError(400, "dashboard anaslysis not came");
    }

    return res.status(200).json({
        success : true,
        message : "History fetched Successfully",
        ...stats
    })
});


module.exports = {
    getDashboardStats
}