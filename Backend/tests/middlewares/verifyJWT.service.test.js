const jwt = require("jsonwebtoken");
const prisma = require("../../config/prisma");
const verifyJWT = require("../../middlewares/verifyJWT");

jest.mock("jsonwebtoken");

jest.mock("../../config/prisma", () => ({
    user: {
        findUnique: jest.fn()
    }
}));


describe("verifyJWT", () => {

    let req;
    let res;
    let next;


    beforeEach(() => {

        req = {
            cookies: {}
        };

        res = {};

        next = jest.fn();

        jest.clearAllMocks();
    });


    test("should throw error when token is missing", async () => {

        await expect(
            verifyJWT(req, res, next)
        ).rejects.toThrow("Authentication failed");


        expect(next)
            .not.toHaveBeenCalled();

    });


    test("should throw error when JWT is invalid", async () => {

        req.cookies.token = "invalid-token";


        jwt.verify.mockImplementation(() => {
            throw new Error("invalid token");
        });


        await expect(
            verifyJWT(req, res, next)
        ).rejects.toThrow("invalid token");


        expect(jwt.verify)
            .toHaveBeenCalledWith(
                "invalid-token",
                process.env.JWT_SECRET
            );


        expect(next)
            .not.toHaveBeenCalled();

    });


    test("should authenticate user when token is valid", async () => {

        req.cookies.token = "valid-token";


        jwt.verify.mockReturnValue({
            id: "user123"
        });


        prisma.user.findUnique.mockResolvedValue({
            id: "user123",
            email: "user@gmail.com"
        });


        await verifyJWT(req, res, next);


        expect(jwt.verify)
            .toHaveBeenCalledWith(
                "valid-token",
                process.env.JWT_SECRET
            );


        expect(prisma.user.findUnique)
            .toHaveBeenCalledWith({
                where: {
                    id: "user123"
                }
            });


        expect(req.user)
            .toEqual({
                id: "user123",
                email: "user@gmail.com"
            });


        expect(next)
            .toHaveBeenCalledTimes(1);

    });


    test("should throw error when user does not exist", async () => {

        req.cookies.token = "valid-token";


        jwt.verify.mockReturnValue({
            id: "user123"
        });


        prisma.user.findUnique
            .mockResolvedValue(null);


        await expect(
            verifyJWT(req, res, next)
        ).rejects.toThrow(
            "Error while fetching the user"
        );


        expect(next)
            .not.toHaveBeenCalled();

    });

});