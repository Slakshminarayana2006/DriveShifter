const express = require('express');
const { transferFiles, getAllTransfersHistory, getAllTransfersHistoryByLimit, getHistoryBySearch, getHistoryByFilter, transferFolder } = require('../controllers/transfer.controller');
const verifyJWT = require('../middlewares/verifyJWT');
const router = express.Router();

//Transfers
router.route("/").post(verifyJWT, transferFiles); //vefied
router.route("/folder/:folderId").post(verifyJWT, transferFolder); //verifed
//History
router.route("/history").get(verifyJWT, getAllTransfersHistory); //verifed
router.route("/history/next-page").get(verifyJWT, getAllTransfersHistoryByLimit); //verifed
router.route("/history/next-page-by-search").get(verifyJWT, getHistoryBySearch);  //verifed
router.route("/history/next-page-by-filter").get(verifyJWT, getHistoryByFilter);  //verifed


module.exports = router;