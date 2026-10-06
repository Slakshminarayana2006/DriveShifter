import React, { useState, useRef, useEffect } from "react";
import { Menu, UserCircle2, User, Settings, LogOut } from "lucide-react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import useAuth from "../hooks/useAuth";
import {toast} from 'sonner';

export default function DashboardLayout() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);

  const accountRef = useRef(null);
  const { user, handleLogout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogoutByClicking = async () => {
    try {
      await handleLogout();
      toast.success("Your Succesfully logged out");
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
      />

      <main className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

            <button
              onClick={() => setMobileMenu(true)}
              className="rounded-lg p-2 text-slate-600 md:hidden"
            >
              <Menu size={22} />
            </button>

            <div className="hidden md:block" />

            {/* Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountMenu((prev) => !prev)}
                aria-expanded={accountMenu}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <UserCircle2 size={20} />
                Account
              </button>

              {accountMenu && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                >
                  {/* User Details */}
                  <div className="border-b border-slate-100 p-4">
                    <p className="font-semibold text-slate-900">
                      {user?.name || "User"}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {user?.email || "No email available"}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      role="menuitem"
                      onClick={() => {
                        setAccountMenu(false);
                        handleLogoutByClicking();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}