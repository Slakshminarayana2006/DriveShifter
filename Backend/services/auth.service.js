const {OAuth2Client} = require('google-auth-library');
const ApiError = require("../utils/ApiError");
const prisma = require("../config/prisma");
const generateToken = require("../utils/jwt");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const googleLoginService = async (credentials) => {
    try {
        if(!credentials) {
            throw new ApiError(400, "Innternal Error");
        }


        const ticket = await client.verifyIdToken({
            idToken : credentials, 
            audience : process.env.GOOGLE_CLIENT_ID
        })

        if(!ticket) {
            throw new ApiError(400, "Internal Error");
        }

        const payload = (await ticket).getPayload();

        if(!payload) {
            throw new ApiError(400, "Internal Error");
        }

        const email = payload.email;

        if(!email) {
            throw new ApiError(400, "Internal Error");
        }

        //db call

        const existedUser = await prisma.user.findUnique({
            where : {
                email : email
            }
        });

        if(existedUser) {
            const token = generateToken(existedUser);

            if(!token) {
                throw new ApiError(400, "Internal Error");
            }

            return {token, user : existedUser};
        }

        const newUser = await prisma.user.create({
            data : {
                googleId : payload.sub,
                email,
                name : payload.name,
                picture : payload.picture
            }
        });

        if(!newUser) {
            throw new ApiError(400, "Internal Error");
        }

        const token = generateToken(newUser);

        if(!token) {
            throw new ApiError(400, "Internal Error");
        }

        return {token, user : newUser};

    } catch (error) {
        throw new ApiError(500, error.message);
    }
}
module.exports = {
    googleLoginService
}