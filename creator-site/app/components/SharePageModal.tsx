"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Props = {
  open: boolean;
  onClose: () => void;
  username: string;
  customDomain?: string | null;
  published: boolean;
};

export default function SharePageModal({
  open,
  onClose,
  username,
  customDomain,
  published,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generatingQr, setGeneratingQr] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";

    if (customDomain) {
      const cleaned = customDomain
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/+$/, "");

      return `https://${cleaned}`;
    }

    return `${window.location.origin}/${username}`;
  }, [customDomain, username, open]);

  useEffect(() => {
    if (!open || !shareUrl) return;

    let active = true;

    async function generateQr() {
      try {
        setGeneratingQr(true);

        const dataUrl = await QRCode.toDataURL(shareUrl, {
          width: 720,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });

        if (active) {
          setQrDataUrl(dataUrl);
        }
      } catch (error) {
        console.error("QR GENERATION ERROR:", error);
      } finally {
        if (active) {
          setGeneratingQr(false);
        }
      }
    }

    generateQr();

    return () => {
      active = false;
    };
  }, [open, shareUrl]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function copyLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("COPY LINK ERROR:", error);
      alert("Could not copy the link.");
    }
  }

  async function nativeShare() {
    if (!shareUrl) return;

    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: `@${username}`,
        text: `Check out @${username}'s page`,
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("NATIVE SHARE ERROR:", error);
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${username}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close share dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0d] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Share
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Share your page
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Copy your link, use your device&apos;s share menu, or save a QR
              code for posters, profiles and presentations.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-xl text-gray-500 transition hover:bg-white/[0.07] hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {!published && (
            <div className="mb-5 rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4 text-sm text-amber-300">
              Publish your page before sharing it.
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
              Public link
            </p>

            <div className="mt-3 flex items-center gap-2">
              <div className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 font-mono text-sm text-gray-300">
                {shareUrl}
              </div>

              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={nativeShare}
              disabled={!published}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                ↗
              </div>

              <p className="mt-3 font-semibold">Quick share</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Open your device&apos;s built-in share menu.
              </p>
            </button>

            <button
              type="button"
              onClick={() => window.open(shareUrl, "_blank")}
              disabled={!published || !shareUrl}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                ◎
              </div>

              <p className="mt-3 font-semibold">Preview page</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Open the exact page your visitors will see.
              </p>
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">QR code</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Scan to open your public page instantly.
                </p>
              </div>

              {qrDataUrl && (
                <button
                  type="button"
                  onClick={downloadQr}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/[0.07]"
                >
                  Save PNG
                </button>
              )}
            </div>

            <div className="mt-5 flex min-h-[230px] items-center justify-center rounded-2xl bg-white p-5">
              {generatingQr ? (
                <div className="text-center text-black">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-black" />
                  <p className="mt-3 text-xs text-black/50">
                    Generating QR code...
                  </p>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${shareUrl}`}
                  className="h-auto w-full max-w-[220px]"
                />
              ) : (
                <p className="text-sm text-black/50">
                  QR code could not be generated.
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-600">
            {customDomain
              ? "Sharing your verified custom domain."
              : "Sharing your creator page URL."}
          </p>
        </div>
      </div>
    </div>
  );
}
