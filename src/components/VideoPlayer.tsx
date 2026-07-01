import React, { useEffect, useRef, useState } from "react";
import { Tv, AlertTriangle, RefreshCw } from "lucide-react";
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
  
  // Local states for error management
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Initialize and assign source directly to the native video element
  useEffect(() => {
    if (!channel) return;

    // Reset error states on channel switch
    setPlaybackError(null);
    setIsRecovering(false);

    const video = videoRef.current;
    if (!video) return;

    const cleanUrlPath = channel.url.split('?')[0].toLowerCase();
    const isM3U8 = cleanUrlPath.includes(".m3u8");
    const isVideoFile = cleanUrlPath.includes(".mp4") || cleanUrlPath.includes(".m4s");

    if (isM3U8 || isVideoFile) {
      let finalUrl = channel.url;

      // HTTP to HTTPS mixed content mitigation proxy fallback
      if (channel.url.startsWith("http://") && window.location.protocol === "https:") {
        console.warn("Mixed content detected. Routing plain HTTP stream via SSL proxy fallback.");
        finalUrl = `https://cors-anywhere.herokuapp.com/${channel.url}`;
      }

      video.src = finalUrl;
      video.load();
      
      video.play().catch((err) => {
        console.log("Autoplay blocked or stream interaction required:", err);
      });
    }
  }, [channel?.id, channel?.url]);

  // Precise error handling verification
  const handleNativeError = () => {
    const video = videoRef.current;
    if (!channel || !video) return;

    // Ignore temporary stalls if the video has already loaded metadata or has data buffered
    if (video.readyState >= 2 && video.networkState !== HTMLMediaElement.NETWORK_NO_SOURCE) {
      console.log("Ignored temporary video element stutter/stall event because stream is still alive.");
      return;
    }

    // Double check HTML5 video error code asset availability
    if (video.error) {
      console.error("Confirmed fatal native video error code:", video.error.code);
    }
    
    setPlaybackError("Broadcast Signal Lost or Blocked by Cross-Origin Security.");
    setIsRecovering(true);

    console.warn("Native video playback encountered a confirmed error. Attempting self-healing trigger...");
    
    onReportBroken(channel.url).then((response) => {
      if (response.success && response.backupAvailable && response.backups.length > 0) {
        // Automatically route to top backup stream
        onSelectBackup(response.backups[0]);
      } else {
        setIsRecovering(false);
        setPlaybackError("The broadcast is currently offline. No alternative backup paths located.");
      }
    }).catch((err) => {
      console.error("Stream recovery failed:", err);
      setIsRecovering(false);
      setPlaybackError("Failed to verify alternative connection parameters.");
    });
  };

  // Clear errors cleanly if the video successfully starts playing past stutters
  const handleOnPlaying = () => {
    setPlaybackError(null);
    setIsRecovering(false);
  };

  if (!channel) {
    return (
      <div className={`w-full aspect-video border rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-xs relative overflow-hidden transition-all ${
        theme === "light" ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-slate-950 border-slate-800 text-slate-400"
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
          /* Native Engine Video Element */
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            onError={handleNativeError}
            onPlaying={handleOnPlaying} // Clears false alarms once playback resumes
          />
        )}

        {/* WARNING OVERLAY LAYER */}
        {playbackError && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-50 animate-fade-in">
            <div className="relative mb-4 flex items-center justify-center">
              <span className="absolute inline-flex h-12 w-12 rounded-full border border-rose-500/30 animate-ping"></span>
              <div className="relative w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
              Playback Interrupted
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-sans px-2">
              {playbackError}
            </p>

            {isRecovering && (
              <div className="mt-4 flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full shadow-md">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span className="text-[10px] font-bold tracking-wide text-slate-300 font-sans uppercase">
                  Searching index backups...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Channel Summary Info Bar */}
      <div className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-850"
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
            <h3 className={`text-sm font-semibold ${theme === "light" ? "text-slate-800" : "text-slate-100"}`}>{channel.name}</h3>
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