// Minimal service worker for PWA installability.
// Chromium requires a fetch handler to consider the page installable, so we
// register a pass-through one. No caching is wired up yet — adding a
// stale-while-revalidate strategy for static assets is the natural next step.

const VERSION = "v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through: let the browser handle the request normally.
  // Wrapping this with respondWith would let us add caching later.
  void event;
});
