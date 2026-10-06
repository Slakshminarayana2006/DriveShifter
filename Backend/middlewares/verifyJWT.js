const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');


const verifyJWT = async (req, res, next) => {
    try {
        const{token} = req.cookies;

        console.log("Cookies:", req.cookies);
        console.log("Token:", req.cookies.token);

        if(!token) {
            throw new ApiError(400, "Authentication failed");
        }

        const user = await jwt.verify(token, process.env.JWT_SECRET);
        
        if(!user) {
            throw new ApiError(400, "Error While doing Authentication");
        }

        const findUser = await prisma.user.findUnique({
            where : {
                id : user.id
            }
        })

        if(!findUser) {
            throw new ApiError(400, "Error while fetching the user");
        }

        req.user = findUser;
        
        next();
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
}

module.exports = verifyJWT;