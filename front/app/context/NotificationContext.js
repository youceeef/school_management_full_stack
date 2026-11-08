"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import axiosInstance from "../config/axios";
import { useAuth } from "./AuthContext";
import toast from "../utils/toast";

const NotificationContext = createContext();

const emptyStats = { total: 0, unread: 0, read: 0 };

const normalizeActionUrl = (url) => {
  if (!url) return null;

  return url
    .replace(/^\/admin\/reservations\//, "/dashboard/reservations/")
    .replace(/^\/my-reservations\//, "/dashboard/mes-reservations/")
    .replace(/^\/admin\/users(?:\/\d+)?$/, "/dashboard/users")
    .replace(/^\/profile$/, "/dashboard/profile");
};

const normalizeNotification = (notification) => ({
  id: notification.id,
  message: notification.data?.message || notification.message || "Notification",
  created_at: notification.created_at,
  read_at: notification.read_at,
  data: {
    ...(notification.data || {}),
    action_url: normalizeActionUrl(notification.data?.action_url),
  },
  type: notification.type,
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const knownIds = useRef(new Set());
  const hasLoaded = useRef(false);
  const requestInFlight = useRef(false);

  const resetNotifications = useCallback(() => {
    setNotifications([]);
    setStats(emptyStats);
    setLoading(false);
    knownIds.current = new Set();
    hasLoaded.current = false;
  }, []);

  const fetchNotifications = useCallback(
    async ({ showLoading = false } = {}) => {
      if (!user) {
        resetNotifications();
        return [];
      }

      if (requestInFlight.current) return [];
      requestInFlight.current = true;
      if (showLoading) setLoading(true);

      try {
        const response = await axiosInstance.get("/api/notifications", {
          params: { limit: 100 },
        });
        const notificationItems = Array.isArray(response.data?.data) ? response.data.data : [];
        const processed = notificationItems.map(normalizeNotification);

        if (hasLoaded.current) {
          processed
            .filter((notification) => !notification.read_at && !knownIds.current.has(notification.id))
            .forEach((notification) => {
              toast.info(notification.message, {
                id: `notification-${notification.id}`,
                duration: 5000,
              });
            });
        }

        knownIds.current = new Set(processed.map((notification) => notification.id));
        hasLoaded.current = true;
        setNotifications(processed);
        setStats(response.data?.stats || emptyStats);

        return processed;
      } catch (error) {
        if (error.response?.status === 401) {
          resetNotifications();
        } else {
          console.error("Notification refresh failed:", error);
        }
        throw error;
      } finally {
        requestInFlight.current = false;
        setLoading(false);
      }
    },
    [resetNotifications, user]
  );

  const markAsRead = useCallback(async (notificationId) => {
    await axiosInstance.post(`/api/notifications/${notificationId}/mark-as-read`);
    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, read_at: notification.read_at || readAt } : notification
      )
    );
    setStats((current) => ({
      ...current,
      unread: Math.max(0, current.unread - 1),
      read: Math.min(current.total, current.read + 1),
    }));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await axiosInstance.post("/api/notifications/mark-all-as-read");
    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: notification.read_at || readAt,
      }))
    );
    setStats((current) => ({ ...current, unread: 0, read: current.total }));
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    const deleted = notifications.find((notification) => notification.id === notificationId);
    await axiosInstance.delete(`/api/notifications/${notificationId}`);

    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    setStats((currentStats) => ({
      total: Math.max(0, currentStats.total - 1),
      unread: Math.max(0, currentStats.unread - (deleted && !deleted.read_at ? 1 : 0)),
      read: Math.max(0, currentStats.read - (deleted?.read_at ? 1 : 0)),
    }));
    knownIds.current.delete(notificationId);
  }, [notifications]);

  useEffect(() => {
    if (!user) {
      resetNotifications();
      return undefined;
    }

    fetchNotifications({ showLoading: true }).catch(() => {});

    const refresh = () => fetchNotifications().catch(() => {});
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refresh, 60000);

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications, resetNotifications, user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: stats.unread,
        readCount: stats.read,
        totalCount: stats.total,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
