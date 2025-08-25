"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../config/axios";
import { useAuth } from "./AuthContext";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user || !Cookies.get("token")) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      let response = await axiosInstance.get("/api/notifications");

      if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        response = await axiosInstance.get("/api/notifications/unread");
      }

      let notificationsArray;
      if (Array.isArray(response.data)) {
        notificationsArray = response.data;
      } else if (response.data?.notifications) {
        notificationsArray = response.data.notifications;
      } else if (response.data?.data) {
        notificationsArray = response.data.data;
      } else {
        notificationsArray = [];
      }

      const processedNotifications = notificationsArray.map((notification) => ({
        id: notification.id,
        message: notification.data?.message || notification.message || "",
        created_at: notification.created_at,
        read_at: notification.read_at,
        data: notification.data || {},
        type: notification.type,
      }));

      setNotifications(processedNotifications);
    } catch (error) {
      if (error.response?.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || !Cookies.get("token")) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get("/api/notifications/unread-count");
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      if (error.response?.status === 401) {
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      await axiosInstance.post(`/api/notifications/${notificationId}/mark-as-read`);
      setNotifications(notifications.map((notification) => (notification.id === notificationId ? { ...notification, read_at: new Date().toISOString() } : notification)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Erreur lors du marquage de la notification comme lue");
      // MODIFICATION: Re-throw the error for promise-based handlers
      throw error;
    }
  };

  // In NotificationContext.js

  const markAllAsRead = async () => {
    try {
      await axiosInstance.post("/api/notifications/mark-all-as-read");
      setNotifications(
        notifications.map((notification) => ({
          ...notification,
          read_at: notification.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      toast.error("Erreur lors du marquage de toutes les notifications comme lues");
      // This line MUST be here
      throw error;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axiosInstance.delete(`/api/notifications/${notificationId}`);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      const wasUnread = notifications.find((n) => n.id === notificationId && !n.read_at);
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression de la notification");
      // MODIFICATION: Re-throw the error for promise-based handlers
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();

      const interval = setInterval(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 10000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
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
