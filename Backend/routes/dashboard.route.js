const express = require("express");
const verifyJWT = require("../middlewares/verifyJWT");
const { getDashboardStats } = require("../controllers/dashboard.controller");
const router = express.Router();


router.route("/stats").get(verifyJWT, getDashboardStats); //verifed

module.exports = router;