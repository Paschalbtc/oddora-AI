"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Lightweight, non-blocking visitor ping component.
 * Tracks page navigation and active visitor sessions for live admin analytics.
 */
export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Avoid duplicate pings within the same pathname
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    try {
      // Manage or create a lightweight session ID
      let sessionId = sessionStorage.getItem("oddora_sid");
      if (!sessionId) {
        sessionId =
          "sid_" +
          Date.now().toString(36) +
          "_" +
          Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem("oddora_sid", sessionId);
      }

      // Check for active user email
      let userEmail: string | undefined;
      try {
        const storedUser = localStorage.getItem("oddora_auth_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.email) userEmail = parsed.email;
        }
      } catch {}

      const payload = JSON.stringify({
        path: pathname || "/",
        sessionId,
        referrer: typeof document !== "undefined" ? document.referrer || "" : "",
        userEmail,
      });

      // Prefer non-blocking beacon if available, fallback to fetch keepalive
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track-visit",
          new Blob([payload], { type: "application/json" })
        );
      } else {
        fetch("/api/track-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Completely silent failover
    }
  }, [pathname]);

  return null;
}
