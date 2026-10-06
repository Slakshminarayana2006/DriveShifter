
import React, { useCallback, useEffect, useState } from "react";
import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileArchive,
  Folder,
  FolderOpen,
  ArrowLeft,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  Cloud,
  HardDrive,
  FileUp,
  FolderUp,
  ChevronRight,
} from "lucide-react";

import {
  getFiles,
  getFilesByFolder,
  getDestinationAccount,
} from "../services/drive.service";

import {
  transferFiles,
  transferFolder,
} from "../services/transfer.service";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

const formatFileSize = (bytes) => {
  if (bytes === undefined || bytes === null || bytes === "") {
    return "--";
  }

  const size = Number(bytes);

  if (!Number.isFinite(size) || size < 0) {
    return "--";
  }

  if (size === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(size) / Math.log(1024));

  return `${(size / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

const formatDate = (date) => {
  if (!date) return "--";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFileIcon = (mimeType) => {
  if (mimeType === FOLDER_MIME_TYPE) {
    return <Folder className="text-blue-500" size={22} />;
  }

  if (mimeType?.startsWith("image/")) {
    return <FileImage className="text-purple-500" size={22} />;
  }

  if (mimeType?.startsWith("video/")) {
    return <FileVideo className="text-pink-500" size={22} />;
  }

  if (mimeType?.startsWith("audio/")) {
    return <FileAudio className="text-orange-500" size={22} />;
  }

  if (
    mimeType?.includes("spreadsheet") ||
    mimeType?.includes("excel")
  ) {
    return <FileSpreadsheet className="text-green-600" size={22} />;
  }

  if (
    mimeType?.includes("pdf") ||
    mimeType?.includes("document") ||
    mimeType?.includes("word")
  ) {
    return <FileText className="text-red-500" size={22} />;
  }

  if (
    mimeType?.includes("zip") ||
    mimeType?.includes("compressed")
  ) {
    return <FileArchive className="text-yellow-600" size={22} />;
  }

  return <File className="text-slate-500" size={22} />;
};

// Handles common API response structures.
const extractFiles = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.files)) return response.files;

  if (Array.isArray(response?.data)) return response.data;

  if (Array.isArray(response?.data?.files)) {
    return response.data.files;
  }

  if (Array.isArray(response?.data?.data?.files)) {
    return response.data.data.files;
  }

  return [];
};

const extractDestination = (response) => {
  return (
    response?.account ||
    response?.data?.account ||
    response?.data?.data?.account ||
    response?.data ||
    response ||
    null
  );
};

export default function Transfer() {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [destination, setDestination] = useState(null);

  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingDestination, setLoadingDestination] = useState(true);
  const [transferring, setTransferring] = useState(false);

  const [error, setError] = useState("");
  const [destinationError, setDestinationError] = useState("");
  const [search, setSearch] = useState("");

  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderStack, setFolderStack] = useState([]);

  const [transferResult, setTransferResult] = useState(null);
  const [transferError, setTransferError] = useState("");

  const [transferType, setTransferType] = useState("files");

  // Fetch source Drive files.
  const fetchFiles = useCallback(async (folderId = null) => {
    try {
      setLoadingFiles(true);
      setError("");

      const response = folderId
        ? await getFilesByFolder(folderId)
        : await getFiles();

      setFiles(extractFiles(response));
    } catch (err) {
      console.error("Failed to fetch Drive files:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load Google Drive files."
      );
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  // Fetch destination account.
  const fetchDestination = useCallback(async () => {
    try {
      setLoadingDestination(true);
      setDestinationError("");

      const response = await getDestinationAccount();

      setDestination(extractDestination(response));
    } catch (err) {
      console.error("Failed to fetch destination account:", err);

      setDestination(null);

      setDestinationError(
        err.response?.data?.message ||
          "Unable to fetch destination account."
      );
    } finally {
      setLoadingDestination(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchDestination();
  }, [fetchFiles, fetchDestination]);

  // Navigate into a folder.
  const openFolder = async (folder) => {
    setFolderStack((prev) => [
      ...prev,
      {
        id: currentFolder?.id || null,
        name: currentFolder?.name || "My Drive",
      },
    ]);

    setCurrentFolder(folder);
    setSelectedFiles([]);
    setSearch("");

    await fetchFiles(folder.id);
  };

  // Navigate back to the previous folder.
  const goBack = async () => {
    if (folderStack.length === 0) return;

    const previous = folderStack[folderStack.length - 1];

    setFolderStack((prev) => prev.slice(0, -1));
    setCurrentFolder(
      previous.id
        ? { id: previous.id, name: previous.name }
        : null
    );

    setSelectedFiles([]);
    setSearch("");

    await fetchFiles(previous.id);
  };

  // Return to My Drive.
  const goToRoot = async () => {
    setCurrentFolder(null);
    setFolderStack([]);
    setSelectedFiles([]);
    setSearch("");

    await fetchFiles();
  };

  // Select or deselect a file.
  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) => {
      const exists = prev.some((item) => item.id === file.id);

      if (exists) {
        return prev.filter((item) => item.id !== file.id);
      }

      return [...prev, file];
    });

    setTransferResult(null);
    setTransferError("");
  };

  // Select all visible files, excluding folders.
  const visibleFiles = files.filter((file) =>
    file.name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectableFiles = visibleFiles.filter(
    (file) => file.mimeType !== FOLDER_MIME_TYPE
  );

  const allSelected =
    selectableFiles.length > 0 &&
    selectableFiles.every((file) =>
      selectedFiles.some((selected) => selected.id === file.id)
    );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedFiles((prev) =>
        prev.filter(
          (selected) =>
            !selectableFiles.some((file) => file.id === selected.id)
        )
      );
    } else {
      setSelectedFiles((prev) => {
        const existingIds = new Set(prev.map((file) => file.id));

        return [
          ...prev,
          ...selectableFiles.filter(
            (file) => !existingIds.has(file.id)
          ),
        ];
      });
    }
  };

  // Transfer selected files.
  const handleFileTransfer = async () => {
    if (selectedFiles.length === 0) {
      setTransferError("Please select at least one file.");
      return;
    }

    try {
      setTransferring(true);
      setTransferError("");
      setTransferResult(null);

      const ids = selectedFiles.map((file) => file.id);

      const response = await transferFiles(ids);

      setTransferResult(response);
    } catch (err) {
      console.error("File transfer failed:", err);

      setTransferError(
        err.response?.data?.message ||
          "File transfer failed. Please try again."
      );
    } finally {
      setTransferring(false);
    }
  };

  // Transfer an entire folder.
  const handleFolderTransfer = async (folder) => {
    const confirmed = window.confirm(
      `Transfer the folder "${folder.name}" and all its contents?`
    );

    if (!confirmed) return;

    try {
      setTransferring(true);
      setTransferError("");
      setTransferResult(null);

      const response = await transferFolder(folder.id);

      setTransferResult(response);
    } catch (err) {
      console.error("Folder transfer failed:", err);

      setTransferError(
        err.response?.data?.message ||
          "Folder transfer failed. Please try again."
      );
    } finally {
      setTransferring(false);
    }
  };

  const handleRefresh = () => {
    fetchFiles(currentFolder?.id || null);
    fetchDestination();
  };

  const isDestinationConnected =
    Boolean(destination?.email || destination?.googleId);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        {/* Transfer Loading Popup */}
        {transferring && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">

            {/* Animated Loader */}
            <div className="mb-5 flex justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <Loader2
                    size={42}
                    className="animate-spin text-blue-600"
                />

                <div className="absolute inset-0 animate-ping rounded-full border-2 border-blue-200 opacity-30" />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-slate-900">
                Transferring Files
            </h2>

            {/* Description */}
            <p className="mt-2 text-sm leading-6 text-slate-500">
                Please wait while your files are being transferred to your destination Google Drive.
            </p>

            {/* Animated Progress Bar */}
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
            </div>

            {/* Warning */}
            <p className="mt-4 text-xs font-medium text-amber-600">
                Please do not close or refresh this page.
            </p>

            </div>
        </div>
        )}
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Transfer Files
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Select files or folders from your Google Drive and transfer them.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingFiles || loadingDestination}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loadingFiles ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Account connection cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* Source account */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Cloud size={23} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Source Account
                </p>

                <p className="truncate font-semibold text-slate-800">
                  My Google Drive
                </p>

                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <CheckCircle2 size={14} />
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Destination account */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                <HardDrive size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Destination Account
                </p>

                {loadingDestination ? (
                  <p className="mt-1 text-sm text-slate-500">
                    Checking connection...
                  </p>
                ) : isDestinationConnected ? (
                  <>
                    <p className="truncate font-semibold text-slate-800">
                      {destination.email || "Connected Google Account"}
                    </p>

                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle2 size={14} />
                      Connected
                    </span>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-800">
                      Not connected
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Connect a destination account from your Dashboard.
                    </p>
                  </>
                )}
              </div>
            </div>

            {destinationError && (
              <p className="mt-3 text-xs text-red-600">
                {destinationError}
              </p>
            )}
          </div>
        </div>

        {/* Destination warning */}
        {!loadingDestination && !isDestinationConnected && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">
                Destination account required
              </p>

              <p className="mt-1">
                Please connect your destination Google Drive from the Dashboard
                before starting a transfer.
              </p>
            </div>
          </div>
        )}

        {/* Transfer mode */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setTransferType("files");
              setTransferResult(null);
              setTransferError("");
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
              transferType === "files"
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <FileUp size={18} />
            Transfer Selected Files
          </button>

          <button
            type="button"
            onClick={() => {
              setTransferType("folder");
              setTransferResult(null);
              setTransferError("");
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
              transferType === "folder"
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <FolderUp size={18} />
            Transfer Folder
          </button>
        </div>

        {/* File browser */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Browser header */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={goBack}
                disabled={folderStack.length === 0 || loadingFiles}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                title="Go back"
              >
                <ArrowLeft size={19} />
              </button>

              <div className="flex min-w-0 items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={goToRoot}
                  className="shrink-0 font-medium text-blue-600 hover:underline"
                >
                  My Drive
                </button>

                {folderStack.map((folder, index) => (
                  <React.Fragment key={`${folder.id}-${index}`}>
                    <ChevronRight
                      size={15}
                      className="shrink-0 text-slate-400"
                    />

                    <span className="max-w-28 truncate text-slate-500">
                      {folder.name}
                    </span>
                  </React.Fragment>
                ))}

                {currentFolder && (
                  <>
                    <ChevronRight
                      size={15}
                      className="shrink-0 text-slate-400"
                    />

                    <span className="max-w-36 truncate font-medium text-slate-800">
                      {currentFolder.name}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search current folder..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Selection toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                disabled={selectableFiles.length === 0 || loadingFiles}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
              />

              <span className="text-sm text-slate-600">
                {selectedFiles.length} file(s) selected
              </span>

              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Clear selection
                </button>
              )}
            </div>

            {transferType === "files" && (
              <button
                type="button"
                onClick={handleFileTransfer}
                disabled={
                  transferring ||
                  selectedFiles.length === 0 ||
                  !isDestinationConnected
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {transferring ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    Transfer {selectedFiles.length} File(s)
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* File list */}
          {loadingFiles ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <Loader2
                size={28}
                className="animate-spin text-blue-600"
              />
              <p className="text-sm text-slate-500">
                Loading Google Drive files...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center">
              <AlertCircle size={30} className="text-red-500" />

              <p className="text-sm text-red-600">{error}</p>

              <button
                type="button"
                onClick={() => fetchFiles(currentFolder?.id || null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : visibleFiles.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center">
              <FolderOpen size={38} className="text-slate-300" />

              <p className="font-medium text-slate-700">
                {search
                  ? "No matching files found."
                  : "This folder is empty."}
              </p>

              <p className="text-sm text-slate-500">
                Try another search or navigate to a different folder.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-12 px-5 py-3"></th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Modified</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleFiles.map((file) => {
                    const isFolder =
                      file.mimeType === FOLDER_MIME_TYPE;

                    const isSelected = selectedFiles.some(
                      (item) => item.id === file.id
                    );

                    return (
                      <tr
                        key={file.id}
                        className={`transition ${
                          isSelected
                            ? "bg-blue-50/70"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-5 py-4">
                          {!isFolder && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleFileSelection(file)
                              }
                              disabled={transferring}
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                            />
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            {getFileIcon(file.mimeType)}

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {file.name || "Untitled"}
                              </p>

                              <p className="text-xs text-slate-400">
                                {isFolder ? "Folder" : "File"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-500">
                          {isFolder
                            ? "--"
                            : formatFileSize(file.size)}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-500">
                          {formatDate(file.modifiedTime)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {isFolder ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openFolder(file)}
                                disabled={transferring}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                              >
                                Open
                              </button>

                              {transferType === "folder" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleFolderTransfer(file)
                                  }
                                  disabled={
                                    transferring ||
                                    !isDestinationConnected
                                  }
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Transfer
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {isSelected ? "Selected" : "Available"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loadingFiles && !error && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                Showing {visibleFiles.length} item(s)
              </p>
            </div>
          )}
        </div>

        {/* Transfer error */}
        {transferError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            {transferError}
          </div>
        )}

        {/* Transfer result */}
        {transferResult && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <CheckCircle2 size={26} className="text-green-600" />

              <div>
                <h2 className="font-semibold text-slate-900">
                  Transfer Finished
                </h2>

                <p className="text-sm text-slate-500">
                  Review your transfer summary below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Files</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {transferResult.totalFiles ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm text-green-700">Successful</p>
                <p className="mt-1 text-2xl font-bold text-green-700">
                  {transferResult.successful ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-sm text-red-700">Failed</p>
                <p className="mt-1 text-2xl font-bold text-red-700">
                  {transferResult.failed ?? 0}
                </p>
              </div>
            </div>

            {transferResult.results?.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 font-medium text-slate-800">
                  Transfer Details
                </h3>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {transferResult.results.map((item, index) => (
                    <div
                      key={`${item.fileId}-${index}`}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {item.fileName || item.fileId}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.type || "FILE"}
                        </p>
                      </div>

                      {item.status === "SUCCESS" ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle2 size={16} />
                          Success
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-red-600">
                          <XCircle size={16} />
                          Failed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transferResult.result?.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 font-medium text-slate-800">
                  File Results
                </h3>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {transferResult.result.map((item, index) => (
                    <div
                      key={`${item.fileId}-${index}`}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {item.fileName || item.fileId}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.fileId}
                        </p>
                      </div>

                      {item.status === "SUCCESS" ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle2 size={16} />
                          Success
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-red-600">
                          <XCircle size={16} />
                          Failed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
