"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Trophy,
  Sparkles,
  TrendingUp,
  Check,
  ChevronRight,
  ExternalLink,
  Layers,
  Trash2,
  BookmarkCheck,
  XCircle,
} from "lucide-react";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  clearAllNotifications,
  formatTimeAgo,
  UserNotification,
} from "@/lib/userNotifications";

interface NotificationCenterProps {
  onNavigateTab?: (tab: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigateTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [, setTick] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    setNotifications(getUserNotifications());
  };

  // Sync notifications on mount and when events fire
  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => loadNotifications();
    window.addEventListener("oddora:notifications-updated", handleUpdate);
    window.addEventListener("oddora:ticket-saved", handleUpdate);
    window.addEventListener("oddora:ticket-updated", handleUpdate);

    return () => {
      window.removeEventListener("oddora:notifications-updated", handleUpdate);
      window.removeEventListener("oddora:ticket-saved", handleUpdate);
      window.removeEventListener("oddora:ticket-updated", handleUpdate);
    };
  }, []);

  // Live timer interval: re-calculate relative timestamps every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Outside click handler to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    loadNotifications();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setNotifications([]);
  };

  const handleNotificationClick = (item: UserNotification) => {
    markNotificationAsRead(item.id);
    loadNotifications();
    setIsOpen(false);
    if (item.targetTab && onNavigateTab) {
      onNavigateTab(item.targetTab);
    }
  };

  const getNotifIcon = (type: UserNotification["type"]) => {
    switch (type) {
      case "WON":
        return <Trophy className="w-3.5 h-3.5" />;
      case "LOST":
        return <XCircle className="w-3.5 h-3.5" />;
      case "TICKET_SAVED":
        return <BookmarkCheck className="w-3.5 h-3.5" />;
      case "BANKER_DROP":
        return <Sparkles className="w-3.5 h-3.5" />;
      default:
        return <TrendingUp className="w-3.5 h-3.5" />;
    }
  };

  const getNotifBadgeStyle = (type: UserNotification["type"]) => {
    switch (type) {
      case "WON":
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40";
      case "LOST":
        return "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40";
      case "TICKET_SAVED":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40";
      case "BANKER_DROP":
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40";
      default:
        return "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/40";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center border ${
          isOpen
            ? "bg-slate-200 text-slate-900 dark:bg-white/[0.14] dark:text-white border-emerald-500/50"
            : "bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
        }`}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-mono font-black flex items-center justify-center border-2 border-white dark:border-[#070A0E] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-88 max-w-[360px] rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="p-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-black text-xs text-slate-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full font-mono text-[9.5px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  {unreadCount} NEW
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition cursor-pointer flex items-center gap-0.5"
                  title="Clear all notifications"
                >
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <Bell className="w-6 h-6 mx-auto mb-2 text-slate-500 opacity-40" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Alerts for saved slips, SportyBet bookings, and match grading will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-start gap-2.5 ${
                    !n.isRead ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${getNotifBadgeStyle(
                      n.type
                    )}`}
                  >
                    {getNotifIcon(n.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {n.title}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 shrink-0">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-2.5 bg-slate-50 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onNavigateTab) onNavigateTab("my_bets");
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-900 dark:text-white text-xs font-bold transition flex items-center justify-between cursor-pointer border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>Open My Bets Tracker</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

