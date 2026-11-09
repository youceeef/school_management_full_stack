"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Squares2X2Icon,
  BellIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CpuChipIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import AuthMiddleware from "../components/AuthMiddleware";
import { useNotifications } from "../context/NotificationContext";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { PERMISSIONS } from "../constants/permissions";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, hasRole, hasPermission } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const { unreadCount } = useNotifications();

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const toggleNotifications = () => {
    setShowNotifications((current) => !current);
    setShowProfileMenu(false);
  };

  const closeNotifications = () => setShowNotifications(false);

  const toggleProfileMenu = () => {
    setShowProfileMenu((current) => !current);
    setShowNotifications(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      toast.success("Déconnexion réussie");
      router.push("/login");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const allNavItems = useMemo(
    () => [
      {
        name: "Tableau de bord",
        path: "/dashboard",
        icon: Squares2X2Icon,
      },
      {
        name: "Notifications",
        path: "/dashboard/notifications",
        icon: BellIcon,
      },
      {
        name: "Salles",
        path: "/dashboard/salles",
        icon: BuildingOffice2Icon,
        permissions: [PERMISSIONS.LIST_SALLES],
      },
      {
        name: "Calendrier",
        path: "/dashboard/calendrier",
        icon: CalendarDaysIcon,
      },
      {
        name: "Équipements",
        path: "/dashboard/equipements",
        icon: CpuChipIcon,
        permissions: [PERMISSIONS.LIST_EQUIPEMENTS],
      },
      {
        name: "Mes Réservations",
        path: "/dashboard/mes-reservations",
        icon: ClipboardDocumentListIcon,
        permissions: [PERMISSIONS.LIST_OWN_RESERVATIONS],
      },
      {
        name: "Gestion Réservations",
        path: "/dashboard/reservations",
        icon: ClipboardDocumentCheckIcon,
        permissions: [PERMISSIONS.LIST_ALL_RESERVATIONS],
      },
      {
        name: "Documents",
        path: "/dashboard/documents",
        icon: DocumentTextIcon,
        permissions: [PERMISSIONS.SHOW_DOCUMENTS],
      },
      {
        name: "Téléchargements",
        path: "/dashboard/telechargements",
        icon: ArrowDownTrayIcon,
        permissions: [PERMISSIONS.TELECHARGEMENTS],
      },
      {
        name: "Utilisateurs",
        path: "/dashboard/users",
        icon: UsersIcon,
        roles: ["admin"],
        permissions: [PERMISSIONS.LIST_USERS],
      },
      {
        name: "Rôles",
        path: "/dashboard/roles",
        icon: UserGroupIcon,
        roles: ["admin"],
        permissions: [PERMISSIONS.LIST_ROLES],
      },
      {
        name: "Permissions",
        path: "/dashboard/permissions",
        icon: ShieldCheckIcon,
        roles: ["admin"],
        permissions: [PERMISSIONS.LIST_PERMISSIONS],
      },
      {
        name: "Profil",
        path: "/dashboard/profile",
        icon: UserCircleIcon,
      },
    ],
    []
  );

  const navItems = useMemo(() => {
    return allNavItems.filter((item) => {
      if (!item.roles && !item.permissions) return true;
      const hasRequiredRole = !item.roles || item.roles.some((role) => hasRole(role));
      const hasRequiredPermission = !item.permissions || item.permissions.some((permission) => hasPermission(permission));
      return hasRequiredRole && hasRequiredPermission;
    });
  }, [allNavItems, hasRole, hasPermission]);

  useEffect(() => {
    const currentNavItem = navItems.find((item) => item.path === pathname);
    document.title = currentNavItem ? `${currentNavItem.name} — EduSpace` : "EduSpace — Tableau de bord";
  }, [pathname, navItems]);

  return (
    <AuthMiddleware>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          handleLogout={handleLogout}
          navItems={navItems}
          isMobileView={isMobileView}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className={`transition-[margin] duration-200 ${isSidebarOpen ? "lg:ml-64" : "lg:ml-[68px]"}`}>
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

          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </AuthMiddleware>
  );
}
