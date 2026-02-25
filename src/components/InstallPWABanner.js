"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * InstallPWABanner — shows a contextual install prompt for the PWA.
 *
 * • Chromium browsers: captures `beforeinstallprompt` and triggers it on click.
 * • iOS Safari: detects standalone-capable Safari and shows manual instructions.
 * • Already installed / dismissed: hides the banner.
 */
export default function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — nothing to show
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone
    ) {
      return;
    }

    // Check if user previously dismissed the banner
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Re-show after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS Safari (no beforeinstallprompt support)
    const ua = window.navigator.userAgent;
    const isiOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);

    if (isiOS && isSafari) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // Chromium: listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Hide if installed through browser UI
    const installedHandler = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      const result = await deferredPrompt.prompt();
      if (result.outcome === "accepted") {
        setShowBanner(false);
      }
    } catch (err) {
      console.error("Erro ao instalar PWA:", err);
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  }, []);

  if (!showBanner) return null;

  return (
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-4 text-white/70 hover:text-white text-xl leading-none"
          aria-label="Fechar"
        >
          ✕
        </button>

        {showIOSInstructions ? (
          /* iOS manual instructions */
          <div className="text-center space-y-3">
            <h3 className="text-lg font-bold">
              Como instalar no seu iPhone/iPad
            </h3>
            <div className="flex flex-col items-center gap-3 text-base">
              <p className="flex items-center gap-2">
                <span className="text-2xl">1.</span>
                Toque no botão
                <span className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M11.47 1.72a.75.75 0 011.06 0l3 3a.75.75 0 01-1.06 1.06l-1.72-1.72V15a.75.75 0 01-1.5 0V4.06L9.53 5.78a.75.75 0 01-1.06-1.06l3-3z" />
                    <path d="M3.75 13.5a.75.75 0 01.75.75v3c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-3a.75.75 0 011.5 0v3A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25v-3a.75.75 0 01.75-.75z" />
                  </svg>
                </span>
                <strong>Compartilhar</strong> do Safari
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">2.</span>
                Depois toque em{" "}
                <strong>&quot;Adicionar à Tela de Início&quot;</strong>
                <span className="text-xl">➕</span>
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="mt-2 px-5 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Entendi
            </button>
          </div>
        ) : (
          /* Standard install banner */
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* App icon */}
            <div className="flex-shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">📲</span>
            </div>

            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold">
                Instale o Nosso Local no seu celular!
              </h3>
              <p className="text-sm text-white/85 mt-0.5">
                Acesso rápido, funciona offline e receba atualizações — como um
                app de verdade.
              </p>
            </div>

            {/* Install button */}
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="flex-shrink-0 px-6 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-md disabled:opacity-70"
            >
              {installing ? "Instalando..." : "Instalar App"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
