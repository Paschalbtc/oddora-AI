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
} from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "WON" | "BANKER_DROP" | "SUMMARY";
  timeAgo: string;
  isRead: boolean;
  targetTab?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_1",
    title: "🎉 Ticket Won!",
    message: "Your 3.20x Banker Ticket won! SportyBet payout is ready for cashout.",
    type: "WON",
    timeAgo: "15m ago",
    isRead: false,
    targetTab: "my_bets",
  },
  {
    id: "notif_2",
    title: "⭐ New VIP Banker Slip Published",
    message: "Today's high-probability 2.10x safe corridor accumulator is live with SportyBet booking code.",
    type: "BANKER_DROP",
    timeAgo: "1h ago",
    isRead: false,
    targetTab: "home",
  },
  {
    id: "notif_3",
    title: "📊 Platform 87.5% Banker Accuracy",
    message: "15 of 18 curated slips won over the last 24 hours. Check today's verified algorithm output.",
    type: "SUMMARY",
    timeAgo: "3h ago",
    isRead: true,
    targetTab: "home",
  },
];

interface NotificationCenterProps {
  onNavigateTab?: (tab: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigateTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Listen for outside click to close
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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setIsOpen(false);
    if (item.targetTab && onNavigateTab) {
      onNavigateTab(item.targetTab);
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
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-80 max-w-[340px] rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
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

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-start gap-2.5 ${
                  !n.isRead ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                    n.type === "WON"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                      : n.type === "BANKER_DROP"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                      : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/40"
                  }`}
                >
                  {n.type === "WON" ? (
                    <Trophy className="w-3.5 h-3.5" />
                  ) : n.type === "BANKER_DROP" ? (
                    <Sparkles className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {n.title}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400 shrink-0">
                      {n.timeAgo}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
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

