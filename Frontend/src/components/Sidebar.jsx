import React from "react";
import {
  LayoutDashboard,
  FolderOpen,
  ArrowRightLeft,
  History,
  Settings,
  HelpCircle,
  UserCircle2,
  Cloud,
} from "lucide-react";
import logo1 from '../assets/DriveShifter.png' 

import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "drive", label: "My Drive", icon: FolderOpen },
  { key: "transfer", label: "Transfer", icon: ArrowRightLeft },
  { key: "history", label: "History", icon: History },
];

export default function Sidebar({ mobileMenu, setMobileMenu }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeNav = location.pathname.split("/")[1] || "dashboard";

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[#0B1220] text-white transition-transform duration-300 md:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">

          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-cyan-500">
              <img src={logo1} className="rounded" />
            </div>

            <div>
              <h1 className="text-lg font-bold"><span className="text-[#2E2A68]">Drive</span><span className="text-[#12B2D6]">Shifter</span></h1>
              <p className="text-xs text-slate-400">
                Cloud transfer
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(`/${item.key}`);
                    setMobileMenu(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-linear-to-r from-teal-600/30 to-cyan-600/20 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenu && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}
    </>
  );
}

