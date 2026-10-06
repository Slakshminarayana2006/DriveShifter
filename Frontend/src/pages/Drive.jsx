import React, { useEffect, useState } from "react";
import {
  Folder,
  FileText,
  FileVideo,
  FileImage,
  FileArchive,
  Search,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import {
  getFiles,
  getFilesByFolder,
  searchFiles,
} from "../services/drive.service";

// Google Drive MIME type icons
function getFileIcon(mimeType) {
  if (mimeType === "application/vnd.google-apps.folder") {
    return Folder;
  }

  if (mimeType?.includes("pdf")) {
    return FileText;
  }

  if (mimeType?.includes("video")) {
    return FileVideo;
  }

  if (mimeType?.includes("image")) {
    return FileImage;
  }

  if (
    mimeType?.includes("zip") ||
    mimeType?.includes("compressed")
  ) {
    return FileArchive;
  }

  return FileText;
}

// Normalize different API response structures into an array
function extractFiles(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.files)) {
    return response.files;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.files)) {
    return response.data.files;
  }

  if (Array.isArray(response?.data?.data?.files)) {
    return response.data.data.files;
  }

  console.error("Unexpected files response:", response);

  return [];
}

export default function Drive() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderStack, setFolderStack] = useState([]);

  const [search, setSearch] = useState("");

  // Fetch root Drive files
  const fetchFiles = async () => {
    try {
      setLoading(true);

      const data = await getFiles();

      console.log("Drive files response:", data);

      setFiles(extractFiles(data));

      setCurrentFolder(null);
      setFolderStack([]);
      setSearch("");
    } catch (error) {
      console.error("Fetch files error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to fetch Google Drive files"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Open a folder
  const openFolder = async (folder) => {
    try {
      setLoading(true);

      const data = await getFilesByFolder(folder.id);

      const folderFiles = extractFiles(data);

      setFolderStack((prev) => [
        ...prev,
        {
          id: folder.id,
          name: folder.name,
        },
      ]);

      setCurrentFolder(folder);

      setFiles(folderFiles);
      setSearch("");
    } catch (error) {
      console.error("Open folder error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to open folder"
      );
    } finally {
      setLoading(false);
    }
  };

  // Navigate to parent folder
  const goBack = async () => {
    try {
      setLoading(true);

      const newStack = [...folderStack];

      newStack.pop();

      if (newStack.length === 0) {
        const data = await getFiles();

        setFiles(extractFiles(data));
        setCurrentFolder(null);
      } else {
        const parentFolder =
          newStack[newStack.length - 1];

        const data = await getFilesByFolder(
          parentFolder.id
        );

        setFiles(extractFiles(data));
        setCurrentFolder(parentFolder);
      }

      setFolderStack(newStack);
      setSearch("");
    } catch (error) {
      console.error("Go back error:", error);

      toast.error("Failed to navigate back");
    } finally {
      setLoading(false);
    }
  };

  // Search files
  const handleSearch = async (e) => {
    const value = e.target.value;

    setSearch(value);

    if (!value.trim()) {
      try {
        setLoading(true);

        if (currentFolder) {
          const data = await getFilesByFolder(
            currentFolder.id
          );

          setFiles(extractFiles(data));
        } else {
          const data = await getFiles();

          setFiles(extractFiles(data));
        }
      } catch (error) {
        console.error("Restore files error:", error);

        toast.error("Failed to restore files");
      } finally {
        setLoading(false);
      }

      return;
    }

    try {
      setLoading(true);

      const data = await searchFiles(value);

      console.log("Search response:", data);

      setFiles(extractFiles(data));
    } catch (error) {
      console.error("Search error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Search failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">

      {/* Header */}

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-medium text-cyan-600">
            Google Drive
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            My Drive
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Browse files from your connected Google Drive.
          </p>
        </div>

        <button
          onClick={fetchFiles}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />

          Refresh
        </button>

      </div>

      {/* Search */}

      <div className="mt-7">
        <div className="relative">

          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search your Drive..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />

        </div>
      </div>

      {/* Breadcrumb */}

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">

        {folderStack.length > 0 && (
          <button
            onClick={goBack}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        <span className="font-medium text-slate-700">
          My Drive
        </span>

        {folderStack.map((folder) => (
          <React.Fragment key={folder.id}>
            <ChevronRight
              size={16}
              className="text-slate-400"
            />

            <span className="text-slate-500">
              {folder.name}
            </span>
          </React.Fragment>
        ))}

      </div>

      {/* Files */}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <RefreshCw
              size={20}
              className="mr-3 animate-spin"
            />

            Loading files...
          </div>
        ) : !Array.isArray(files) || files.length === 0 ? (
          <div className="py-20 text-center">

            <Folder
              size={42}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-semibold text-slate-700">
              No files found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {search
                ? "No files match your search."
                : "This folder doesn't contain any files."}
            </p>

          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {files.map((file) => {
              const Icon = getFileIcon(file.mimeType);

              const isFolder =
                file.mimeType ===
                "application/vnd.google-apps.folder";

              return (
                <div
                  key={file.id}
                  onDoubleClick={() =>
                    isFolder && openFolder(file)
                  }
                  className={`flex items-center justify-between px-5 py-4 transition hover:bg-slate-50 ${
                    isFolder
                      ? "cursor-pointer"
                      : "cursor-default"
                  }`}
                >

                  <div className="flex min-w-0 items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {file.name}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {isFolder
                          ? "Folder"
                          : file.mimeType || "File"}
                      </p>
                    </div>

                  </div>

                  {isFolder && (
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-slate-400"
                    />
                  )}

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}