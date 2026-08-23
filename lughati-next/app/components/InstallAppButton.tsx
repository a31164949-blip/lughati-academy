"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();

      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }

      setInstallPrompt(null);
      return;
    }

    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }

    setShowIOSHelp(true);
  };

  return (
    <>
      <button
        onClick={handleInstall}
        style={{
          border: "none",
          borderRadius: "18px",
          padding: "12px 18px",
          fontSize: "16px",
          fontWeight: 800,
          cursor: "pointer",
          background: "#0f766e",
          color: "#ffffff",
          boxShadow: "0 8px 20px rgba(15, 118, 110, 0.18)",
        }}
      >
        📱 ثبّت الأكاديمية على جوالك
      </button>

      {showIOSHelp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#ffffff",
              borderRadius: "24px",
              padding: "24px",
              textAlign: "center",
              direction: "rtl",
            }}
          >
            <div style={{ fontSize: "42px", marginBottom: "10px" }}>
              📱
            </div>

            <h2 style={{ margin: "0 0 12px" }}>
              ثبّت أكاديمية لغتي الرقمية
            </h2>

            <p
              style={{
                lineHeight: 1.9,
                margin: 0,
                color: "#475569",
              }}
            >
              على الآيفون أو الآيباد:
              <br />
              اضغط زر المشاركة في Safari
              <br />
              ثم اختر
              <strong> إضافة إلى الشاشة الرئيسية</strong>.
            </p>

            <button
              onClick={() => setShowIOSHelp(false)}
              style={{
                marginTop: "20px",
                border: "none",
                borderRadius: "14px",
                padding: "11px 22px",
                background: "#0f766e",
                color: "#ffffff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              فهمت 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}