"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Only register in production
      if (process.env.NODE_ENV === "production") {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/service-worker.js", { scope: "/" })
            .then((registration) => {
              console.log(
                "[Service Worker] Registered successfully:",
                registration.scope,
              );

              // Check for updates
              registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // New service worker available, prompt user to refresh
                    if (confirm("Nova versão disponível! Recarregar agora?")) {
                      newWorker.postMessage({ type: "SKIP_WAITING" });
                      window.location.reload();
                    }
                  }
                });
              });
            })
            .catch((error) => {
              console.error("[Service Worker] Registration failed:", error);
            });
        });
      }
    }
  }, []);

  return null;
}
