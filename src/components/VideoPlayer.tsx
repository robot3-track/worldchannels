import React, { useEffect, useRef } from "react";
import { Tv, CheckCircle } from "lucide-react";
import { StreamChannel } from "../types";

interface VideoPlayerProps {
  channel: StreamChannel | null;
  onReportBroken: (url: string) => Promise<{ success: boolean; backupAvailable: boolean; backups: StreamChannel[] }>;
  onSelectBackup: (backup: StreamChannel) => void;
  theme: "light" | "dark";
}

export default function VideoPlayer({
  channel,
  onReportBroken,
  onSelectBackup,
  theme
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize and assign source directly to the native video element
  useEffect(() => {
    if (!channel || !videoRef.current) return;

    const cleanUrlPath = channel.url.split('?')[0].toLowerCase();
    const isM3U8 = cleanUrlPath.includes(".m3u8");
    const isVideoFile = cleanUrlPath.includes(".mp4") || cleanUrlPath.includes(".m4s");

    // Let the browser load the source string natively with its original parameters intact
    if (isM3U8 || isVideoFile) {
      videoRef.current.src = channel.url;
      videoRef.current.load();
      
      // Auto-play handling when channel changes
      videoRef.current.play().catch((err) => {
        console.log("Autoplay blocked or stream requires user interaction:", err);
      });
    }
  }, [channel?.id, channel?.url]);

  // Handle native video error reporting
  const handleNativeError = () => {
    if (!channel) return;
    console.warn("Native video playback encountered an error. Attempting stream self-healing...");
    onReportBroken(channel.url).then((response) => {
      if (response.success && response.backupAvailable && response.backups.length > 0) {
        // Automatically switch to top backup if available
        onSelectBackup(response.backups[0]);
      }
    }).catch((err) => {
      console.error("Stream recovery failed:", err);
    });
  };

  // Render idle receiver state if no channel selected
  if (!channel) {
    return (
      <div className={`w-full aspect-video border rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-xs relative overflow-hidden transition-all ${
        theme === "light"
          ? "bg-slate-50 border-slate-200 text-slate-500"
          : "bg-slate-950 border-slate-800 text-slate-400"
      }`}>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,transparent_70%)]" />
        <Tv className="w-10 h-10 text-slate-400 mb-4 animate-pulse" />
        <p className={`text-sm font-semibold ${theme === "light" ? "text-slate-700" : "text-slate-300"}`}>
          Broadcast Feed Receiver Idle
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed font-sans font-medium">
          Select any broadcasting station on the map or channel list to tune in.
        </p>
      </div>
    );
  }

  const cleanUrlPath = channel.url.split('?')[0].toLowerCase();
  const isM3U8 = cleanUrlPath.includes(".m3u8");
  const isVideoFile = cleanUrlPath.includes(".mp4") || cleanUrlPath.includes(".m4s");

  return (
    <div className="flex flex-col gap-4">
      {/* Viewport Frame */}
      <div className={`w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-lg border ${
        theme === "light" ? "border-slate-200" : "border-slate-850"
      }`}>
        {channel.url.startsWith("http") && !isM3U8 && !isVideoFile ? (
          /* Standard Site / Iframe Stream Wrapper */
          <iframe
            src={channel.url}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          /* Native Engine Video Element with Original Controls Overlay */
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            onError={handleNativeError}
          />
        )}
      </div>

      {/* Channel Summary Info Bar */}
      <div className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        theme === "light"
          ? "bg-slate-50 border-slate-200"
          : "bg-slate-900 border-slate-850"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-lg overflow-hidden border flex items-center justify-center flex-shrink-0 shadow-sm ${
            theme === "light" ? "bg-white border-slate-200" : "bg-slate-950 border-slate-800"
          }`}>
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "";
                }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <Tv className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${theme === "light" ? "text-slate-800" : "text-slate-100"}`}>
              {channel.name}
            </h3>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className={`text-[10px] font-sans px-2.5 py-0.5 rounded-full border ${
                theme === "light" ? "bg-white text-slate-600 border-slate-200" : "bg-slate-950 text-slate-400 border-slate-800"
              } uppercase`}>
                Category: <span className={`font-semibold ${theme === "light" ? "text-slate-800" : "text-slate-300"}`}>{channel.category}</span>
              </span>
              <span className={`text-[10px] font-sans px-2.5 py-0.5 rounded-full border ${
                theme === "light" ? "bg-white text-slate-600 border-slate-200" : "bg-slate-950 text-slate-400 border-slate-800"
              }`}>
                Nation: <span className={`font-semibold ${theme === "light" ? "text-slate-800" : "text-slate-300"}`}>{channel.country}</span>
              </span>
              <span className={`text-[10px] font-sans px-2.5 py-0.5 rounded-full border ${
                theme === "light" ? "bg-white text-slate-600 border-slate-200" : "bg-slate-950 text-slate-400 border-slate-800"
              } flex items-center gap-1.5`}>
                Status:
                <span className={`w-1.5 h-1.5 rounded-full ${channel.status === "online" ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} />
                <span className={`font-bold ${channel.status === "online" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>{channel.status}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}