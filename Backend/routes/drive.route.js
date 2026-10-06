const express = require("express");
const verifyJWT = require("../middlewares/verifyJWT");
const router = express.Router();
const { connectDrive, driveCallback, getAllFiles, connectDestinationDrive, destinationDriveCallback, getAllFilesByFolderId, fileDetails, getSearchFile, getDestinationAccount, disconnectDestinationAccount } = require("../controllers/drive.controller");
const { getAllFilesByFolderIdService } = require("../services/drive.service");


//source 
router.route('/connect').get(verifyJWT, connectDrive); // verifed
router.route('/callback').get(driveCallback); // verifed
router.route('/files').get(verifyJWT, getAllFiles); //verifed
router.route('/files/search').get(verifyJWT, getSearchFile); // verifed
router.route('/files/:folderId').get(verifyJWT, getAllFilesByFolderId); // verifed
router.route('/file/:id').get(verifyJWT, fileDetails); // verifed



//Destination
router.route('/destination/connect').get(verifyJWT, connectDestinationDrive); //verifed
router.route('/destination/callback').get(destinationDriveCallback);  // verifed
router.route('/destination/account').get(verifyJWT, getDestinationAccount);
router.route('/destination/disconnect').delete(verifyJWT, disconnectDestinationAccount);


module.exports = router;