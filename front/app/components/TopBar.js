"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bars3Icon,
  BellIcon,
  UserIcon,
  KeyIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationDropdown from "./NotificationDropdown";
import { getStorageImageUrl } from "../services/userProfileService";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const TopBar = ({
  pathname,
  isMobileView,
  toggleSidebar,
  handleLogout,
  unreadCount,
  showNotifications,
  toggleNotifications,
  closeNotifications,
  showProfileMenu,
  toggleProfileMenu,
  notificationRef,
  profileRef,
  setShowProfileMenu,
}) => {
  const { user } = useAuth();
  const { t, tr, isRtl } = useLanguage();
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (user?.picture) {
      setProfileImage(getStorageImageUrl(user.picture));
    } else {
      setProfileImage(null);
    }
  }, [user?.picture]);

  const getPageBreadcrumb = () => {
    if (pathname === "/dashboard") {
      return { section: tr("Espace de travail"), title: tr("Tableau de bord") };
    }

    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    const parentSegment = segments[segments.length - 2];

    const labels = {
      salles: "Salles & Espaces",
      equipements: "Inventaire Équipements",
      reservations: "Gestion des Réservations",
      "mes-reservations": "Mes Réservations",
      calendrier: "Calendrier des Disponibilités",
      documents: "Documents Pédagogiques",
      telechargements: "Portail de Téléchargements",
      users: "Gestion des Utilisateurs",
      roles: "Rôles & Accès",
      permissions: "Matrice des Permissions",
      notifications: "Centre de Notifications",
      profile: "Profil Utilisateur",
      "change-password": "Sécurité du Compte",
    };

    if (lastSegment && !isNaN(lastSegment) && parentSegment && labels[parentSegment]) {
      return { section: tr(labels[parentSegment]), title: `${tr("Détail")} #${lastSegment}` };
    }

    return {
      section: tr("Espace de travail"),
      title: tr(
        labels[lastSegment] ||
          lastSegment
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
      ),
    };
  };

  const { section, title } = getPageBreadcrumb();

  return (
    <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {isMobileView && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={t("nav.openMenu")}
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">{section}</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
          <span className="font-semibold font-display text-slate-900 dark:text-slate-100 truncate">
            {title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <LanguageSwitcher />
        <ThemeToggle />

        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={toggleNotifications}
            aria-label={tr("Afficher les notifications")}
            aria-expanded={showNotifications}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <BellIcon className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-primary-600 rounded-full flex items-center justify-center text-white text-[10px] font-mono tabular-nums font-semibold">
                {unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown isOpen={showNotifications} onClose={closeNotifications} />
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={toggleProfileMenu}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-primary-600 text-white shrink-0">
              {profileImage ? (
                <Image
                  key={profileImage}
                  src={profileImage}
                  alt={`${user?.first_name || ""} ${user?.last_name || ""}`}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                  onError={() => setProfileImage(null)}
                  unoptimized
                />
              ) : (
                <Image
                  src="/default-avatar.png"
                  alt="Avatar"
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                  unoptimized
                  priority
                />
              )}
            </div>
            <span className="hidden md:block text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : t("nav.myAccount")}
            </span>
          </button>

          {showProfileMenu && (
            <div
              className={`absolute ${
                isRtl ? "left-0" : "right-0"
              } mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden z-40 border border-slate-200 dark:border-slate-800`}
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-600 shrink-0">
                  {profileImage ? (
                    <Image
                      key={profileImage}
                      src={profileImage}
                      alt={`${user?.first_name || ""} ${user?.last_name || ""}`}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      onError={() => setProfileImage(null)}
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/default-avatar.png"
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                      priority
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user?.first_name} {user?.last_name || tr("Utilisateur")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || ""}
                  </p>
                </div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  {t("nav.myProfile")}
                </Link>
                <Link
                  href="/dashboard/change-password"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <KeyIcon className="w-4 h-4 text-slate-400" />
                  {t("nav.changePassword")}
                </Link>
                <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full text-start px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                  {t("common.logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
