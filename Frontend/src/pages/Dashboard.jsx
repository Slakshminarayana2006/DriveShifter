
import React, { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  Cloud,
  CloudOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileArchive,
  FileText,
  FileVideo,
  Folder,
  Plus,
  MoreVertical,
  X,
} from "lucide-react";

import { toast } from "sonner";
import useAuth from "../hooks/useAuth";
import { getDashboardStats } from "../services/dashboard.service";
import { getTransferHistory } from "../services/transfer.service";
import { disconnectDestinationAccount, getDestinationAccount } from "../services/drive.service";

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </h2>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function FileIcon({ type }) {
  const iconClass = "h-5 w-5";

  if (type === "zip") return <FileArchive className={iconClass} />;
  if (type === "pdf") return <FileText className={iconClass} />;
  if (type === "mp4") return <FileVideo className={iconClass} />;
  if (type === "folder") return <Folder className={iconClass} />;

  return <FileText className={iconClass} />;
}

function StatusBadge({ status }) {
  const styles = {
    SUCCESS:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    FAILED:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    "IN PROGRESS":
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status === "SUCCESS" && <CheckCircle2 size={14} />}
      {status === "FAILED" && <AlertCircle size={14} />}
      {status === "IN PROGRESS" && (
        <RefreshCw size={14} className="animate-spin" />
      )}
      {status}
    </span>
  );
}

function NewTransferModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              New Transfer
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Transfer files from your source Drive.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
              <Folder size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              Select files or folders
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Choose items from your connected Google Drive.
            </p>

            <button className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Browse Drive
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Cloud className="text-cyan-600" size={20} />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Destination
                </p>
                <p className="text-xs text-slate-500">
                  Your connected destination Drive
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Start Transfer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [destination, setDestination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [destinationLoading, setDestinationLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
    setLoading(true);

    try {
        const [statsResult, historyResult] = await Promise.allSettled([
            getDashboardStats(),
            getTransferHistory(),
        ]);

        if (statsResult.status === "fulfilled") {
            setStats(statsResult.value);
        } else {
            console.error("Dashboard stats error:", statsResult.reason);
            toast.error(
                statsResult.reason?.response?.data?.message ||
                "Failed to fetch dashboard stats"
            );
        }

        if (historyResult.status === "fulfilled") {
            const hist = historyResult.value;

            setTransfers(
                Array.isArray(hist)
                    ? hist
                    : hist?.transfers || []
            );
        } else {
            console.error("Transfer history error:", historyResult.reason);
            toast.error(
                historyResult.reason?.response?.data?.message ||
                "Failed to fetch transfer history"
            );
        }

    } finally {
        setLoading(false);
    }
};

    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        setDestinationLoading(true);

        const data = await getDestinationAccount();
        setDestination(data);
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch destination account"
        );
      } finally {
        setDestinationLoading(false);
      }
    };

    fetchDestination();
  }, []);

  const handleConnectDestination = () => {
    window.location.href = `${
      import.meta.env.VITE_API_URL
    }/api/drive/destination/connect`;
  };

  const handleDisconnectDestination = async () => {
    const confirmed = window.confirm(
        "Are you sure you want to disconnect your destination Google Drive?"
    );

    if (!confirmed) return;

    try {
        await disconnectDestinationAccount();

        setDestination({
            connected: false,
            account: null
        });

        toast.success("Destination Drive disconnected successfully");
    } catch (error) {
        toast.error(
            error?.response?.data?.message ||
            "Failed to disconnect destination Drive"
        );
    }
};

  const formatBytes = (bytes) => {
    if (!bytes || bytes === "0") return "0 B";

    let size = Number(bytes);
    const units = ["B", "KB", "MB", "GB", "TB"];
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }

    return `${size.toFixed(1)} ${units[index]}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFileType = (fileName) => {
    if (!fileName) return "file";

    const extension = fileName.split(".").pop().toLowerCase();

    if (["zip", "rar"].includes(extension)) return "zip";
    if (extension === "pdf") return "pdf";

    if (["mp4", "mkv", "mov"].includes(extension)) {
      return "mp4";
    }

    return "file";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="animate-spin" size={20} />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Heading */}

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-cyan-600">
            Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your Google Drive transfers from one place.
          </p>
        </div>
      </div>

      {/* Stats */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Transfers"
          value={stats?.totalTransfersCount ?? 0}
          icon={ArrowRightLeft}
          description="All transfer requests"
        />

        <StatCard
          title="Successful"
          value={stats?.totalTransfersSuccessCount ?? 0}
          icon={CheckCircle2}
          description="Completed successfully"
        />

        <StatCard
          title="Failed"
          value={stats?.totalTransfersFailedCount ?? 0}
          icon={AlertCircle}
          description="Transfers requiring attention"
        />

        <StatCard
          title="Data Transferred"
          value={formatBytes(stats?.totalTransfersSize)}
          icon={Cloud}
          description="Total file size"
        />
      </div>

      {/* Drive Cards */}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* Source Drive */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Cloud size={23} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Source Drive
                </p>

                <h2 className="mt-1 font-semibold text-slate-900">
                  Google Drive
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {user?.email || "Google Drive Account"}
                </p>
              </div>
            </div>

            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
              <MoreVertical size={19} />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircle2 size={17} />
            Connected
          </div>
        </div>

        {/* Destination Drive */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Cloud size={23} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Destination Drive
                </p>

                <h2 className="mt-1 font-semibold text-slate-900">
                  Google Drive
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {destinationLoading
                    ? "Checking connection..."
                    : destination?.connected
                    ? destination.account?.email
                    : "No destination account connected"}
                </p>
              </div>
            </div>

            {destinationLoading ? (
              <RefreshCw
                className="animate-spin text-slate-400"
                size={20}
              />
            ) : destination?.connected ? (
              <CheckCircle2
                className="text-emerald-500"
                size={22}
              />
            ) : (
              <CloudOff
                className="text-slate-300"
                size={22}
              />
            )}
          </div>

          {!destinationLoading && (
    destination?.connected ? (
        <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 size={17} />
                Connected
            </div>

            <button
                onClick={handleDisconnectDestination}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
                Disconnect
            </button>
        </div>
    ) : (
        <button
            onClick={handleConnectDestination}
            className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
            Connect Destination
        </button>
    )
)}
        </div>
      </div>

      {/* Recent Transfers */}

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-bold text-slate-900">
              Recent Transfers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest file transfers
            </p>
          </div>

          <button className="text-sm font-semibold text-cyan-600 hover:text-cyan-700">
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-175">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-6 py-4 font-semibold">File</th>
                <th className="px-6 py-4 font-semibold">Size</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>

            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    No transfers found.
                  </td>
                </tr>
              ) : (
                transfers.slice(0, 5).map((transfer) => (
                  <tr
                    key={transfer.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <FileIcon
                            type={getFileType(transfer.fileName)}
                          />
                        </div>

                        <div className="max-w-60">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {transfer.fileName || "Unnamed file"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Google Drive
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatBytes(transfer.fileSize)}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={transfer.status} />
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(transfer.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}

      {showTransferModal && (
        <NewTransferModal
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  );
}