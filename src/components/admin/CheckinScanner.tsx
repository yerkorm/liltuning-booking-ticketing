"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type ResultState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "valid"; eventName: string; typeName: string; code: string }
  | { kind: "invalid"; message: string };

const RESCAN_DELAY_MS = 2500;

export function CheckinScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastCodeRef = useRef<{ value: string; at: number } | null>(null);
  const scanningLockedRef = useRef(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const [manualCode, setManualCode] = useState("");

  const submitCode = useCallback(async (code: string) => {
    scanningLockedRef.current = true;
    setResult({ kind: "checking" });
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ kind: "valid", eventName: data.eventName, typeName: data.typeName, code: data.code });
      } else {
        setResult({ kind: "invalid", message: data.error ?? "Código no válido" });
      }
    } catch {
      setResult({ kind: "invalid", message: "Error de conexión" });
    } finally {
      setTimeout(() => {
        scanningLockedRef.current = false;
        setResult({ kind: "idle" });
      }, RESCAN_DELAY_MS);
    }
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        setCameraError("No se pudo acceder a la cámara. Usa el código manual abajo.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(imageData.data, imageData.width, imageData.height);
          if (qr && qr.data && !scanningLockedRef.current) {
            const now = Date.now();
            const last = lastCodeRef.current;
            if (!last || last.value !== qr.data || now - last.at > RESCAN_DELAY_MS) {
              lastCodeRef.current = { value: qr.data, at: now };
              submitCode(qr.data);
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [submitCode]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim() || scanningLockedRef.current) return;
    submitCode(manualCode.trim().toUpperCase());
    setManualCode("");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="relative aspect-square overflow-hidden rounded-md bg-black">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-sm text-white">
            {cameraError}
          </div>
        )}

        {result.kind !== "idle" && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white ${
              result.kind === "valid"
                ? "bg-green-600/95"
                : result.kind === "checking"
                  ? "bg-black/70"
                  : "bg-brand-red/95"
            }`}
          >
            {result.kind === "checking" && (
              <>
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <p className="text-sm">Validando…</p>
              </>
            )}
            {result.kind === "valid" && (
              <>
                <span className="text-4xl">✓</span>
                <p className="heading-condensed text-lg">Entrada válida</p>
                <p className="text-sm">{result.typeName}</p>
                <p className="text-xs opacity-80">{result.eventName}</p>
              </>
            )}
            {result.kind === "invalid" && (
              <>
                <span className="text-4xl">✗</span>
                <p className="heading-condensed text-lg">{result.message}</p>
              </>
            )}
          </div>
        )}

        {!cameraError && result.kind === "idle" && (
          <div className="pointer-events-none absolute inset-8 rounded-md border-2 border-white/60" />
        )}
      </div>

      <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Código manual (ej. LT-4F82A1)"
          className="input flex-1"
        />
        <button
          type="submit"
          className="rounded-sm bg-brand-black px-4 py-2 text-xs heading-condensed text-white shrink-0"
        >
          Validar
        </button>
      </form>
    </div>
  );
}
