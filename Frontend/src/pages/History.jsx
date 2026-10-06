
import { useCallback, useEffect, useState } from "react";
import {
  getNextTransferHistory,
  searchTransferHistory,
  filterTransferHistory,
} from "../services/history.service";

const LIMIT = 10;

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return "—";

  const size = Number(bytes);

  if (Number.isNaN(size)) return "—";
  if (size === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(size) / Math.log(1024));

  return `${(size / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "success":
    case "completed":
      return "bg-green-100 text-green-700";

    case "failed":
      return "bg-red-100 text-red-700";

    case "pending":
    case "processing":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const extractData = (response) => {
  return response?.data ?? response;
};

export default function History() {
  const [transfers, setTransfers] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let response;

      if (status !== "all") {
        response = await filterTransferHistory(
          status,
          page,
          LIMIT,
          search.trim()
        );
      } else if (search.trim()) {
        response = await searchTransferHistory(
          search.trim(),
          page,
          LIMIT
        );
      } else {
        response = await getNextTransferHistory(page, LIMIT);
      }

      const data = extractData(response);

      setTransfers(
        Array.isArray(data?.transfers) ? data.transfers : []
      );

      setTotal(Number(data?.total ?? 0));
      setTotalPages(Math.max(1, Number(data?.totalPages ?? 1)));
    } catch (err) {
      console.error("Failed to fetch transfer history:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load transfer history. Please try again."
      );

      setTransfers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handlePrevious = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  const startIndex = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endIndex = Math.min(page * LIMIT, total);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Transfer History
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Track and manage your Google Drive file transfers.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">

          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path
                d="m16 16 4 4"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search files or email addresses..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total matching transfers
          </p>

          <p className="mt-1 text-3xl font-bold text-gray-900">
            {total}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>

            <button
              onClick={fetchHistory}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] divide-y divide-gray-200 text-left">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    File Name
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Size
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Source
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Destination
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                        <p className="text-sm text-gray-500">
                          Loading transfer history...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-gray-100 p-4">
                          <svg
                            className="h-8 w-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M8 7h8M8 12h8M8 17h5M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        <p className="font-medium text-gray-700">
                          No transfers found
                        </p>

                        <p className="text-sm text-gray-500">
                          {search || status !== "all"
                            ? "Try changing your search or filter."
                            : "Your completed transfers will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer) => (
                    <tr
                      key={transfer.id || transfer.fileId}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="max-w-xs px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-2">
                            <svg
                              className="h-5 w-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M6 2h8l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M14 2v6h6M8 13h8M8 17h8"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>

                          <span
                            className="truncate text-sm font-medium text-gray-900"
                            title={transfer.fileName}
                          >
                            {transfer.fileName || "Unnamed file"}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {formatFileSize(transfer.fileSize)}
                      </td>

                      <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600">
                        {transfer.sourceEmail || "—"}
                      </td>

                      <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600">
                        {transfer.destinationEmail || "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {formatDate(transfer.createdAt)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            transfer.status
                          )}`}
                        >
                          {transfer.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row">

            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {startIndex}
              </span>
              {" "}to{" "}
              <span className="font-medium text-gray-700">
                {endIndex}
              </span>
              {" "}of{" "}
              <span className="font-medium text-gray-700">
                {total}
              </span>
              {" "}transfers
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-3 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={handleNext}
                disabled={page >= totalPages || loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
