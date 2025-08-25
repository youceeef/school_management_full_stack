"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import NotificationDropdown from "./NotificationDropdown";
import { getStorageImageUrl } from "../services/userProfileService";
import { useAuth } from "../context/AuthContext";

const TopBar = ({ pathname, isMobileView, toggleSidebar, handleLogout, unreadCount, showNotifications, toggleNotifications, showProfileMenu, toggleProfileMenu, notificationRef, profileRef, setShowProfileMenu }) => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);

  // Update profile image when user data changes
  useEffect(() => {
    if (user?.picture) {
      const imageUrl = getStorageImageUrl(user.picture);
      setProfileImage(imageUrl);
    } else {
      setProfileImage(null);
    }
  }, [user?.picture]);

  const getPageTitle = () => {
    if (pathname === "/dashboard") {
      return "Tableau de bord";
    }

    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    const parentSegment = segments[segments.length - 2];

    const titles = {
      salles: "la Salle",
      equipements: "l'Équipement",
      reservations: "la Réservation",
      documents: "le Document",
      telechargements: "le Téléchargement",
      users: "l'Utilisateur",
      roles: "le Rôle",
      permissions: "la Permission",
      "mes-reservations": "la Réservation",
    };

    // Check if we're on a detail page (numeric ID)
    if (lastSegment && !isNaN(lastSegment) && parentSegment && titles[parentSegment]) {
      return `Détails de ${titles[parentSegment]}`;
    }

    // Special cases
    if (lastSegment === "mes-reservations") {
      return "Mes Réservations";
    }

    // Default case: capitalize words
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <header className="bg-white dark:bg-dark-card shadow-sm sticky top-0 z-20">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          {isMobileView && (
            <button onClick={toggleSidebar} className="mr-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border/30 transition-colors">
              ☰
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-text truncate">{getPageTitle()}</h1>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="relative" ref={notificationRef}>
            <button onClick={toggleNotifications} className="p-2 rounded-full bg-gray-100 dark:bg-dark-border/30 hover:bg-gray-200 dark:hover:bg-dark-border/50 relative transition-colors">
              🔔
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">{unreadCount}</span>}
            </button>

            <NotificationDropdown isOpen={showNotifications} onClose={toggleNotifications} />
          </div>

          <div className="relative" ref={profileRef}>
            <button onClick={toggleProfileMenu} className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-primary-500 text-white">
              {profileImage ? (
                <Image
                  key={profileImage}
                  src={profileImage}
                  alt={`${user.first_name} ${user.last_name}`}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                    setProfileImage(null);
                  }}
                  unoptimized
                />
              ) : (
                <Image src="/default-avatar.png" alt="Default Avatar" width={40} height={40} className="w-full h-full object-cover" unoptimized priority />
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-lg shadow-lg dark:shadow-dark-border/10 overflow-hidden z-40 border border-gray-200 dark:border-dark-border">
                <div className="py-4 px-4 border-b border-gray-100 dark:border-dark-border flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-500 flex-shrink-0">
                    {profileImage ? (
                      <Image
                        key={profileImage}
                        src={profileImage}
                        alt={`${user.first_name} ${user.last_name}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                          setProfileImage(null);
                        }}
                        unoptimized
                      />
                    ) : (
                      <Image src="/default-avatar.png" alt="Default Avatar" width={64} height={64} className="w-full h-full object-cover" unoptimized priority />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-800 dark:text-dark-text truncate">
                      {user?.first_name} {user?.last_name || "Admin User"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5 truncate">{user?.email || "admin"}</p>
                  </div>
                </div>
                <div className="py-1">
                  <Link href="/dashboard/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border/20" onClick={() => setShowProfileMenu(false)}>
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profil
                  </Link>
                  <Link href="/dashboard/change-password" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border/20" onClick={() => setShowProfileMenu(false)}>
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Changer le mot de passe
                  </Link>
                  <div className="border-t border-gray-100 dark:border-dark-border"></div>
                  <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-border/20">
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
