"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import AuthMiddleware from "../components/AuthMiddleware";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { PERMISSIONS } from "../constants/permissions";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole, hasPermission } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const { unreadCount } = useNotifications();
  const { darkMode } = useTheme();

  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const sidebarRef = useRef(null);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications((current) => !current);
    setShowProfileMenu(false);
  };

  const closeNotifications = () => setShowNotifications(false);

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (isMobileView && isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileView, isSidebarOpen]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      toast.success("Déconnexion réussie");
      router.push("/login");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  // Navigation items with role and permission requirements
  const allNavItems = useMemo(
    () => [
      {
        name: "Tableau de bord",
        path: "/dashboard",
        icon: "📊",
      },
      // --- NEW: Notifications Link ---
      {
        name: "Notifications",
        path: "/dashboard/notifications",
        icon: "🔔",
        // permissions: [PERMISSIONS.LIST_NOTIFICATIONS],
      },
      {
        name: "Salles",
        path: "/dashboard/salles",
        icon: "🏢",
        permissions: [PERMISSIONS.LIST_SALLES],
      },
      {
        name: "Calendrier",
        path: "/dashboard/calendrier",
        icon: "📅",
      },
      {
        name: "Équipements",
        path: "/dashboard/equipements",
        icon: "🖨️",
        permissions: [PERMISSIONS.LIST_EQUIPEMENTS],
      },
      {
        name: "Réservations",
        path: "/dashboard/mes-reservations",
        icon: "📝",
        permissions: [PERMISSIONS.LIST_OWN_RESERVATIONS],
      },
      {
        name: "Gestion Réservations",
        path: "/dashboard/reservations",
        icon: "📅",
        permissions: [PERMISSIONS.LIST_ALL_RESERVATIONS],
      },
      {
        name: "Documents",
        path: "/dashboard/documents",
        icon: "📄",
        permissions: [PERMISSIONS.SHOW_DOCUMENTS],
      },
      {
        name: "Téléchargements",
        path: "/dashboard/telechargements",
        icon: "⬇️",
        permissions: [PERMISSIONS.TELECHARGEMENTS],
      },
      {
        name: "Utilisateurs",
        path: "/dashboard/users",
        icon: "🧑‍🤝‍🧑",
        roles: ["admin"],
        permissions: [PERMISSIONS.LIST_USERS],
      },
      {
        name: "Rôles",
        path: "/dashboard/roles",
        icon: "👥",
        roles: ["admin"],
        permissions: [PERMISSIONS.LIST_ROLES],
      },
      {
        name: "Permissions",
        path: "/dashboard/permissions",
        icon: "🔒",
        roles: ["admin"],
        permissions: [PERMISSIONS.LIST_PERMISSIONS],
      },
      {
        name: "Profile",
        path: "/dashboard/profile",
        icon: "👤",
      },
    ],
    []
  );

  // Filter navigation items based on user roles and permissions
  const navItems = useMemo(() => {
    return allNavItems.filter((item) => {
      if (!item.roles && !item.permissions) return true;
      const hasRequiredRole = !item.roles || item.roles.some((role) => hasRole(role));
      const hasRequiredPermission = !item.permissions || item.permissions.some((permission) => hasPermission(permission));
      return hasRequiredRole && hasRequiredPermission;
    });
  }, [allNavItems, hasRole, hasPermission]);

  // Update document title when pathname changes
  useEffect(() => {
    const currentNavItem = navItems.find((item) => item.path === pathname);
    document.title = currentNavItem ? `${currentNavItem.name} | Dashboard` : "Dashboard";
  }, [pathname, navItems]);

  return (
    <AuthMiddleware>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        {isMobileView && isSidebarOpen && <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)}></div>}

        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} handleLogout={handleLogout} navItems={navItems} isMobileView={isMobileView} setIsSidebarOpen={setIsSidebarOpen} />

        <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
          <TopBar
            pathname={pathname}
            isMobileView={isMobileView}
            toggleSidebar={toggleSidebar}
            handleLogout={handleLogout}
            unreadCount={unreadCount}
            showNotifications={showNotifications}
            toggleNotifications={toggleNotifications}
            closeNotifications={closeNotifications}
            showProfileMenu={showProfileMenu}
            toggleProfileMenu={toggleProfileMenu}
            notificationRef={notificationRef}
            profileRef={profileRef}
            setShowProfileMenu={setShowProfileMenu}
          />

          <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthMiddleware>
  );
}
