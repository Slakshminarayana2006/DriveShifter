const express = require('express');
const router = express.Router();
const {googleLogin, getUser, logout} = require('../controllers/auth.controller');
const verifyJWT = require('../middlewares/verifyJWT');

router.route('/google').post(googleLogin); // verifed
router.route('/me').get(verifyJWT, getUser);  // verifed
router.route('/logout').post(verifyJWT, logout); // verifed


module.exports = router;