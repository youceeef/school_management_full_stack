"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({ isSidebarOpen, toggleSidebar, handleLogout, navItems, isMobileView, setIsSidebarOpen }) => {
  const pathname = usePathname();

  return (
    <>
      {isMobileView && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 transition-all duration-200 flex flex-col ${
          isSidebarOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full lg:translate-x-0 w-0 lg:w-[68px] overflow-hidden"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className={`relative w-8 h-8 shrink-0 ${!isSidebarOpen ? "mx-auto" : ""}`}>
              <Image
                src="/logo.png"
                alt="EduSpace"
                fill
                sizes="32px"
                className="object-contain dark:hidden"
              />
              <Image
                src="/logo_var.png"
                alt="EduSpace"
                fill
                sizes="32px"
                className="object-contain hidden dark:block"
              />
            </div>
            {isSidebarOpen && (
              <span className="font-bold font-display text-base tracking-tight text-slate-900 dark:text-white truncate">
                EduSpace
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Réduire le menu" : "Déployer le menu"}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:flex items-center justify-center"
            title={isSidebarOpen ? "Réduire le menu" : "Déployer le menu"}
          >
            {isSidebarOpen ? (
              <ChevronDoubleLeftIcon className="w-4 h-4" />
            ) : (
              <ChevronDoubleRightIcon className="w-4 h-4" />
            )}
          </button>

          {isMobileView && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Fermer le menu"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4">
          <ul className={`space-y-1 ${isSidebarOpen ? "px-3" : "px-2"}`}>
            {navItems.map((item) => {
              const isActive =
                item.path === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.path || pathname.startsWith(`${item.path}/`);
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={isMobileView ? () => setIsSidebarOpen(false) : undefined}
                    className={`flex items-center rounded-lg text-sm font-medium transition-colors relative ${
                      isActive
                        ? "bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100"
                    } ${
                      isSidebarOpen
                        ? "px-3 py-2.5 gap-3"
                        : "justify-center w-11 h-10 mx-auto"
                    }`}
                    title={!isSidebarOpen ? item.name : undefined}
                  >
                    {Icon && <Icon className="w-5 h-5 shrink-0" />}
                    {isSidebarOpen && <span className="truncate">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ${
              isSidebarOpen
                ? "px-3 py-2.5 w-full gap-3"
                : "justify-center w-11 h-10 mx-auto"
            }`}
            title={!isSidebarOpen ? "Déconnexion" : undefined}
          >
            <ArrowRightStartOnRectangleIcon className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="truncate">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
