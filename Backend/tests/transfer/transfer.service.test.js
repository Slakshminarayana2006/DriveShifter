const {
    transerFilesService,
    transferFolderService
} = require("../../services/transfer.service");

const prisma = require("../../config/prisma");
const { google } = require("googleapis");

jest.mock("../../config/prisma", () => ({
    googleAccount: {
        findUnique: jest.fn()
    },

    destinationAccount: {
        findUnique: jest.fn()
    },

    transfer: {
        create: jest.fn()
    }
}));

jest.mock("../../config/googleOAuth", () => ({
    sourceClient: {
        setCredentials: jest.fn()
    },

    destinationClient: {
        setCredentials: jest.fn()
    }
}));

jest.mock("googleapis", () => ({
    google: {
        drive: jest.fn()
    }
}));


describe("transerFilesService", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    test("should throw error when userId is missing", async () => {

        await expect(
            transerFilesService()
        ).rejects.toThrow("Internal Error1");

    });


    test("should throw error when fileIds is missing", async () => {

        await expect(
            transerFilesService("user123")
        ).rejects.toThrow("Internal Error1");

    });


    test("should throw error when fileIds is not an array", async () => {

        await expect(
            transerFilesService(
                "user123",
                "file123"
            )
        ).rejects.toThrow("Internal Error2");

    });


    test("should throw error when fileIds is empty", async () => {

        await expect(
            transerFilesService(
                "user123",
                []
            )
        ).rejects.toThrow("Internal Error3");

    });


    test("should throw error when source account does not exist", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValue(null);

        await expect(
            transerFilesService(
                "user123",
                ["file123"]
            )
        ).rejects.toThrow("Internal Error4");

    });


    test("should throw error when destination account does not exist", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValue({
                id: "source-account",
                userId: "user123",
                email: "source@gmail.com",
                accessToken: "source-access-token",
                refreshToken: "source-refresh-token"
            });

        prisma.destinationAccount.findUnique
            .mockResolvedValue(null);

        await expect(
            transerFilesService(
                "user123",
                ["file123"]
            )
        ).rejects.toThrow("Internal Error5");

    });


    test("should successfully transfer a file", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValueOnce({
                userId: "user123",
                email: "source@gmail.com",
                accessToken: "source-access-token",
                refreshToken: "source-refresh-token"
            });

        prisma.destinationAccount.findUnique
            .mockResolvedValueOnce({
                userId: "user123",
                email: "destination@gmail.com",
                accessToken: "destination-access-token",
                refreshToken: "destination-refresh-token"
            });


        const sourceDrive = {
            files: {
                get: jest
                    .fn()
                    .mockResolvedValueOnce({
                        data: {
                            id: "file123",
                            name: "Resume.pdf",
                            mimeType: "application/pdf",
                            size: "5000"
                        }
                    })
                    .mockResolvedValueOnce({
                        body: "fake-file-stream"
                    })
            }
        };

        const destinationDrive = {
            files: {
                create: jest
                    .fn()
                    .mockResolvedValue({
                        data: {
                            id: "destination-file123",
                            name: "Resume.pdf"
                        }
                    })
            }
        };

        google.drive
            .mockReturnValueOnce(sourceDrive)
            .mockReturnValueOnce(destinationDrive);

        prisma.transfer.create
            .mockResolvedValue({
                id: "transfer123"
            });

        const result = await transerFilesService(
            "user123",
            ["file123"]
        );

        expect(result.totalFiles)
            .toBe(1);

        expect(result.successful)
            .toBe(1);

        expect(result.failed)
            .toBe(0);


        expect(result.result)
            .toEqual([
                {
                    fileId: "file123",
                    status: "SUCCESS"
                }
            ]);


        expect(google.drive)
            .toHaveBeenCalledTimes(2);

        expect(sourceDrive.files.get)
            .toHaveBeenCalledTimes(2);

        expect(destinationDrive.files.create)
            .toHaveBeenCalledTimes(1);

        expect(prisma.transfer.create)
            .toHaveBeenCalledTimes(1);

    });


    test("should mark file as failed when Google Drive transfer fails", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValueOnce({
                userId: "user123",
                email: "source@gmail.com",
                accessToken: "source-token",
                refreshToken: "source-refresh-token"
            });

        prisma.destinationAccount.findUnique
            .mockResolvedValueOnce({
                userId: "user123",
                email: "destination@gmail.com",
                accessToken: "destination-token",
                refreshToken: "destination-refresh-token"
            });


        const sourceDrive = {
            files: {
                get: jest
                    .fn()
                    .mockRejectedValue(
                        new Error("Google Drive download failed")
                    )
            }
        };


        const destinationDrive = {
            files: {
                create: jest.fn()
            }
        };


        google.drive
            .mockReturnValueOnce(sourceDrive)
            .mockReturnValueOnce(destinationDrive);


        const result = await transerFilesService(
            "user123",
            ["file123"]
        );


        expect(result.totalFiles)
            .toBe(1);

        expect(result.successful)
            .toBe(0);

        expect(result.failed)
            .toBe(1);

        expect(result.result)
            .toEqual([
                {
                    fileId: "file123",
                    status: "FAILED"
                }
            ]);


        expect(prisma.transfer.create)
            .not.toHaveBeenCalled();
    });


    test("should recursively transfer a folder", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValueOnce({
                userId: "user123",
                email: "source@gmail.com",
                accessToken: "source-token",
                refreshToken: "source-refresh-token"
            });

        prisma.destinationAccount.findUnique
            .mockResolvedValueOnce({
                userId: "user123",
                email: "destination@gmail.com",
                accessToken: "destination-token",
                refreshToken: "destination-refresh-token"
            });


        const sourceDrive = {
            files: {
                get: jest
                    .fn()
                    .mockResolvedValueOnce({
                        data: {
                            id: "folder123",
                            name: "Projects",
                            mimeType: "application/vnd.google-apps.folder"
                        }
                    })
                    .mockResolvedValue({
                        data: {
                            id: "file",
                            name: "test.pdf",
                            mimeType: "application/pdf",
                            size: "1000"
                        }
                    }),

                list: jest
                    .fn()
                    .mockResolvedValueOnce({
                        data: {
                            files: [
                                {
                                    id: "file1",
                                    name: "file1.pdf",
                                    mimeType: "application/pdf",
                                    size: "1000"
                                },
                                {
                                    id: "subfolder",
                                    name: "SubFolder",
                                    mimeType: "application/vnd.google-apps.folder"
                                }
                            ]
                        }
                    })
                    .mockResolvedValueOnce({
                        data: {
                            files: [
                                {
                                    id: "file2",
                                    name: "file2.txt",
                                    mimeType: "text/plain",
                                    size: "2000"
                                }
                            ]
                        }
                    })
            }
        };


        const destinationDrive = {
            files: {
                create: jest
                    .fn()
                    .mockResolvedValue({
                        data: {
                            id: "destination-id",
                            name: "test"
                        }
                    }),

                list: jest
                    .fn()
                    .mockResolvedValue({
                        data: {
                            files: []
                        }
                    })
            }
        };


        google.drive
            .mockReturnValueOnce(sourceDrive)
            .mockReturnValueOnce(destinationDrive);


        prisma.transfer.create
            .mockResolvedValue({
                id: "transfer123"
            });


        const result = await transferFolderService(
            "user123",
            "folder123"
        );


        expect(result.totalFiles)
            .toBe(2);

        expect(result.successful)
            .toBe(2);

        expect(result.failed)
            .toBe(0);


        expect(sourceDrive.files.list)
            .toHaveBeenCalledTimes(2);


        expect(destinationDrive.files.create)
            .toHaveBeenCalled();


        expect(prisma.transfer.create)
            .toHaveBeenCalledTimes(2);
    });

});