/* ============================================================
   Budget Flow – Service Worker
   Enables: PWA installability, background push notifications,
   and notification click handling.
   ============================================================ */

const CACHE_NAME = "budget-flow-v1";

// ── Install ──────────────────────────────────────────────────
self.addEventListener("install", () => {
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ── Push (from server, future use) ───────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json?.() ?? {};
  const title = data.title ?? "Budget Flow";
  const options = {
    body: data.body ?? "Ada yang perlu kamu cek di Budget Flow.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag ?? "budget-flow-general",
    requireInteraction: data.requireInteraction ?? false,
    data: { url: data.url ?? "/" },
    actions: data.actions ?? [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) return clients.openWindow(targetUrl);
    }),
  );
});

// ── Periodic Sync (Chrome Android only) ──────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "daily-budget-reminder") {
    event.waitUntil(
      self.registration.showNotification("Budget Flow", {
        body: "Jangan lupa catat pengeluaranmu hari ini! 💰",
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: "daily-reminder",
      }),
    );
  }
});
