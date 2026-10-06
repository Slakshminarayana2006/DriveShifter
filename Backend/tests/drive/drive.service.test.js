const {
    getFiles,
    getAllFilesByFolderIdService,
    getSearchFileService,
    fileDetailsService
} = require("../../services/drive.service");

const prisma = require("../../config/prisma");
const { google } = require("googleapis");

jest.mock("../../config/prisma", () => ({
    googleAccount: {
        findUnique: jest.fn()
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


describe("Drive Services", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    test("getFiles should throw error when Google account does not exist", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValue(null);

        await expect(
            getFiles("user123")
        ).rejects.toThrow("Files not fetched");

    });

    test("getFiles should return files successfully", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValue({
                userId: "user123",
                accessToken: "access-token",
                refreshToken: "refresh-token"
            });


        const drive = {
            files: {
                list: jest.fn()
                    .mockResolvedValue({
                        data: {
                            files: [
                                {
                                    id: "file1",
                                    name: "Resume.pdf",
                                    mimeType: "application/pdf",
                                    size: "5000"
                                },
                                {
                                    id: "file2",
                                    name: "Notes.txt",
                                    mimeType: "text/plain",
                                    size: "1000"
                                }
                            ]
                        }
                    })
            }
        };


        google.drive.mockReturnValue(drive);


        const result = await getFiles("user123");


        expect(result).toHaveLength(2);

        expect(result[0].name)
            .toBe("Resume.pdf");

        expect(result[1].name)
            .toBe("Notes.txt");


        expect(drive.files.list)
            .toHaveBeenCalledTimes(1);

    });


    test("getSearchFileService should return matching files", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValue({
                userId: "user123",
                accessToken: "access-token",
                refreshToken: "refresh-token"
            });


        const drive = {
            files: {
                list: jest.fn()
                    .mockResolvedValue({
                        data: {
                            files: [
                                {
                                    id: "file1",
                                    name: "Resume.pdf",
                                    mimeType: "application/pdf",
                                    size: "5000"
                                }
                            ]
                        }
                    })
            }
        };


        google.drive.mockReturnValue(drive);


        const result = await getSearchFileService(
            "user123",
            "Resume"
        );


        expect(result).toHaveLength(1);

        expect(result[0].name)
            .toBe("Resume.pdf");


        expect(drive.files.list)
            .toHaveBeenCalledTimes(1);


        expect(drive.files.list)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    q: "name contains 'Resume' and trashed=false"
                })
            );

    });

    test("getAllFilesByFolderIdService should return folder files", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValue({
                userId: "user123",
                accessToken: "access-token",
                refreshToken: "refresh-token"
            });


        const drive = {
            files: {
                list: jest.fn()
                    .mockResolvedValue({
                        data: {
                            files: [
                                {
                                    id: "file1",
                                    name: "Resume.pdf",
                                    mimeType: "application/pdf",
                                    size: "5000"
                                },
                                {
                                    id: "file2",
                                    name: "Notes.pdf",
                                    mimeType: "application/pdf",
                                    size: "3000"
                                }
                            ]
                        }
                    })
            }
        };


        google.drive.mockReturnValue(drive);


        const result =
            await getAllFilesByFolderIdService(
                "user123",
                "folder123"
            );


        expect(result).toHaveLength(2);


        expect(drive.files.list)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    q: "'folder123' in parents and trashed=false"
                })
            );

    });


    test("fileDetailsService should return file details", async () => {

        prisma.googleAccount.findUnique
            .mockResolvedValue({
                userId: "user123",
                accessToken: "access-token",
                refreshToken: "refresh-token"
            });


        const drive = {
            files: {
                get: jest.fn()
                    .mockResolvedValue({
                        data: {
                            id: "file123",
                            name: "Resume.pdf",
                            mimeType: "application/pdf",
                            size: "5000",
                            createdTime: "2026-08-25T10:00:00Z",
                            modifiedTime: "2026-08-25T11:00:00Z"
                        }
                    })
            }
        };


        google.drive.mockReturnValue(drive);


        const result =
            await fileDetailsService(
                "user123",
                "file123"
            );


        expect(result).toEqual({
            id: "file123",
            name: "Resume.pdf",
            mimeType: "application/pdf",
            size: "5000",
            createdTime: "2026-08-25T10:00:00Z",
            modifiedTime: "2026-08-25T11:00:00Z"
        });


        expect(drive.files.get)
            .toHaveBeenCalledTimes(1);

    });

});