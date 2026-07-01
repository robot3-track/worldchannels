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
  // Using generic window.setTimeout layout type instead of Node namespace
  const failureTimerRef = useRef<any | null>(null);
  
  // Player state trackers
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Helper function to extract a clean YouTube Video ID from any structure
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Channel initialization logic
  useEffect(() => {
    if (!channel) return;

    // Reset error flags instantly on channel swap
    setPlaybackError(null);
    setIsRecovering(false);
    if (failureTimerRef.current) clearTimeout(failureTimerRef.current);

    const video = videoRef.current;
    if (!video) return;

    const urlToCheck = channel.url.split('?')[0].toLowerCase();
    const isM3U8 = urlToCheck.includes(".m3u8") || channel.url.toLowerCase().includes("m3u8");
    const isVideoFile = urlToCheck.includes(".mp4") || urlToCheck.includes(".m4s");

    if (isM3U8 || isVideoFile) {
      let finalUrl = channel.url;

      // Handle Mixed Content Blockers safely via SSL proxy
      if (channel.url.startsWith("http://") && window.location.protocol === "https:") {
        console.warn("Mixed Content protection applied. Intercepting plain HTTP route.");
        finalUrl = `https://cors-anywhere.herokuapp.com/${channel.url}`;
      }

      video.src = finalUrl;
      video.load();
      video.play().catch((err) => {
        console.log("Autoplay context initialization deferred:", err);
      });
    }
  }, [channel?.id, channel?.url]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (failureTimerRef.current) clearTimeout(failureTimerRef.current);
    };
  }, []);

  // Graceful failure tracking engine
  const triggerStreamAnalysis = (errorMessage: string) => {
    // Clear any existing tracking loops before spinning up a new check
    if (failureTimerRef.current) clearTimeout(failureTimerRef.current);

    // Give the engine a safe window to buffer or re-fetch chunk segments
    failureTimerRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video || !channel) return;

      // If the player cleared up and successfully buffered data, skip the error layout
      if (video.readyState >= 2 && !video.paused) {
        console.log("Stream validation verified: Playback recovered smoothly.");
        return;
      }

      setPlaybackError(errorMessage);
      setIsRecovering(true);

      onReportBroken(channel.url).then((response) => {
        if (response.success && response.backupAvailable && response.backups.length > 0) {
          onSelectBackup(response.backups[0]);
        } else {
          setIsRecovering(false);
          setPlaybackError("This feed is currently offline. No backup paths responded.");
        }
      }).catch((err) => {
        console.error("Self-healing script error:", err);
        setIsRecovering(false);
        setPlaybackError("Broadcast offline. Connection validation timeout.");
      });
    }, 4500); // 4.5 second buffer safety padding window
  };

  // Clear pending validation triggers if frames play smoothly
  const clearValidationChecks = () => {
    if (failureTimerRef.current) {
      clearTimeout(failureTimerRef.current);
    }
    setPlaybackError(null);
    setIsRecovering(false);
  };

  if (!channel) {
    return (
      <div className={`w-full aspect-video border rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all ${
        theme === "light" ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-slate-950 border-slate-800 text-slate-400"
      }`}>
        <Tv className="w-10 h-10 text-slate-400 mb-4 animate-pulse" />
        <p className="text-sm font-semibold">Broadcast Feed Receiver Idle</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">Select a channel to tune in.</p>
      </div>
    );
  }

  // Parse current configuration properties
  const youtubeId = getYouTubeId(channel.url);
  const urlToCheck = channel.url.split('?')[0].toLowerCase();
  const isM3U8 = urlToCheck.includes(".m3u8") || channel.url.toLowerCase().includes("m3u8");
  const isVideoFile = urlToCheck.includes(".mp4") || urlToCheck.includes(".m4s");

  return (
    <div className="flex flex-col gap-4">
      {/* Viewport Frame */}
      <div className={`w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-lg border ${
        theme === "light" ? "border-slate-200" : "border-slate-850"
      }`}>
        
        {youtubeId ? (
          /* YouTube Render Layout Engine */
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isM3U8 || isVideoFile ? (
          /* Native Stream Delivery Frame Engine */
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            onPlaying={clearValidationChecks}
            onWaiting={() => triggerStreamAnalysis("Stream is buffering or stuttering...")}
            onError={() => triggerStreamAnalysis("Broadcast Signal Lost or Blocked by Security Policies.")}
          />
        ) : (
          /* Generic Standard Website Fallback Frame */
          <iframe
            src={channel.url}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}

        {/* TIME DEBOUNCED WARNING OVERLAY */}
        {playbackError && !youtubeId && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-50 animate-fade-in">
            <div className="relative mb-4 flex items-center justify-center">
              <span className="absolute inline-flex h-12 w-12 rounded-full border border-rose-500/30 animate-ping" />
              <div className="relative w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Playback Interrupted</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">{playbackError}</p>
            {isRecovering && (
              <div className="mt-4 flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full shadow-md">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span className="text-[10px] font-bold text-slate-300 font-sans uppercase">Searching Index Backups...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata Interface Footer */}
      <div className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-850"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-lg border flex items-center justify-center flex-shrink-0 shadow-sm ${
            theme === "light" ? "bg-white border-slate-200" : "bg-slate-950 border-slate-800"
          }`}>
            {channel.logo ? (
              <img src={channel.logo} alt={channel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Tv className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${theme === "light" ? "text-slate-800" : "text-slate-100"}`}>{channel.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{channel.category} • {channel.country}</p>
          </div>
        </div>
      </div>
    </div>
  );
}