const {
    getDashboardStatsService
} = require("../../services/dashboard.service");

const prisma = require("../../config/prisma");

jest.mock("../../config/prisma", () => ({
    transfer: {
        count: jest.fn(),
        aggregate: jest.fn(),
        findFirst: jest.fn()
    }
}));

describe("getDashboardStatsService", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    test("should throw error when userId is missing", async () => {

        await expect(
            getDashboardStatsService()
        ).rejects.toThrow();
    });


    test("should return dashboard statistics", async () => {

        prisma.transfer.count
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(8)
            .mockResolvedValueOnce(2);

        prisma.transfer.aggregate.mockResolvedValue({
            _sum: {
                fileSize: BigInt(5000)
            }
        });

        prisma.transfer.findFirst.mockResolvedValue({
            fileName: "Resume.pdf",
            status: "SUCCESS",
            createdAt: new Date()
        });


        const result =
            await getDashboardStatsService("user123");


        expect(result.totalTransfersCount)
            .toBe(10);

        expect(result.totalTransfersSuccessCount)
            .toBe(8);

        expect(result.totalTransfersFailedCount)
            .toBe(2);

        expect(result.totalTransfersSize)
            .toBe(BigInt(5000));

        expect(result.lastTransfer.fileName)
            .toBe("Resume.pdf");


        expect(prisma.transfer.count)
            .toHaveBeenCalledTimes(3);

        expect(prisma.transfer.aggregate)
            .toHaveBeenCalledTimes(1);

        expect(prisma.transfer.findFirst)
            .toHaveBeenCalledTimes(1);

    });

});