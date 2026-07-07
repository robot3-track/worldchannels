import React, { useEffect, useRef, useState, useMemo } from "react";
import { Tv, AlertTriangle, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { StreamChannel } from "../types";

interface VideoPlayerProps {
  channel: StreamChannel | null;
  onReportBroken: (url: string) => Promise<{ success: boolean; backupAvailable: boolean; backups: StreamChannel[] }>;
  onSelectBackup: (backup: StreamChannel) => void;
  theme: "light" | "dark";
}

const EMBED_ONLY_DOMAINS = [
  "online.tm", "alpha.tv.online.tm",
  "thebosstv.com", "live.thebosstv.com",
  "tvkaista.net", "live-fi.tvkaista.net", "live-fi"
];

const YOUTUBE_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

const getPlayerStrategy = (channel: StreamChannel | null) => {
  if (!channel) return { isYoutube: false, isEmbedOnly: false, useNativeVideo: false, cleanUrl: "" };

  const url = channel.url;
  const urlToCheck = url.split('?')[0].toLowerCase();
  
  // 1. YouTube Identification
  const match = url.match(YOUTUBE_REGEX);
  const youtubeId = (match && match[2].length === 11) ? match[2] : null;
  if (youtubeId) return { isYoutube: true, isEmbedOnly: false, useNativeVideo: false, cleanUrl: youtubeId };

  // 2. Embed Domain Verification
  const matchesEmbedOnly = EMBED_ONLY_DOMAINS.some(domain => url.includes(domain));
  if (matchesEmbedOnly) {
    return { isYoutube: false, isEmbedOnly: true, useNativeVideo: false, cleanUrl: url };
  }

  // 3. Native Stream Check (.m3u8, .mp4, .m4s)
  const isStream = urlToCheck.includes(".m3u8") || url.toLowerCase().includes("m3u8") || 
                   urlToCheck.includes(".mp4") || urlToCheck.includes(".m4s");
                   
  if (isStream) {
    let finalUrl = url;
    // Upgrade insecure HTTP to HTTPS securely if running on HTTPS to prevent Mixed Content
    if (url.startsWith("http://") && window.location.protocol === "https:") {
      finalUrl = url.replace("http://", "https://");
    }
    return { isYoutube: false, isEmbedOnly: false, useNativeVideo: true, cleanUrl: finalUrl };
  }

  return { isYoutube: false, isEmbedOnly: true, useNativeVideo: false, cleanUrl: url };
};

export default function VideoPlayer({
  channel,
  onReportBroken,
  onSelectBackup,
  theme
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const failureTimerRef = useRef<any | null>(null);
  const controlsTimeoutRef = useRef<any | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const strategy = useMemo(() => getPlayerStrategy(channel), [channel?.id, channel?.url]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500); 
    }
  };

  const handleReloadStream = () => {
    const video = videoRef.current;
    if (!video || !strategy.useNativeVideo) return;

    setIsReloading(true);
    setIsLoading(true); 
    setPlaybackError(null);
    setIsRecovering(false);
    if (failureTimerRef.current) clearTimeout(failureTimerRef.current);

    const currentSrc = video.src;
    video.src = "";
    video.load();
    
    setTimeout(() => {
      video.src = currentSrc;
      video.load();
      video.play()
        .then(() => {
          setIsPlaying(true);
          setIsReloading(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setIsReloading(false);
        });
    }, 50);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuteState = !isMuted;
    videoRef.current.muted = newMuteState;
    setIsMuted(newMuteState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVol = parseFloat(e.target.value);
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Fullscreen request blocked:", err));
    } else {
      document.exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          setShowControls(true);
        })
        .catch((err) => console.error("Exit fullscreen error:", err));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFS = !!document.fullscreenElement;
      setIsFullscreen(activeFS);
      if (!activeFS) {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!channel) return;

    setPlaybackError(null);
    setIsRecovering(false);
    if (failureTimerRef.current) clearTimeout(failureTimerRef.current);

    if (strategy.useNativeVideo) {
      setIsLoading(true); 
      const video = videoRef.current;
      if (video) {
        video.src = strategy.cleanUrl;
        video.load();
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      setIsLoading(false);
    }
  }, [channel?.id, strategy.cleanUrl, strategy.useNativeVideo]);

  useEffect(() => {
    return () => {
      if (failureTimerRef.current) clearTimeout(failureTimerRef.current);
    };
  }, []);

  const monitorStreamHealthState = (errorMessage: string, criticalLevel = false) => {
    if (failureTimerRef.current) clearTimeout(failureTimerRef.current);

    const safetyBufferWindow = criticalLevel ? 6000 : 15000;

    failureTimerRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video || !channel) return;

      if (video.readyState >= 2 && !video.paused && video.networkState !== HTMLMediaElement.NETWORK_NO_SOURCE) {
        return; 
      }

      setIsLoading(false);
      setPlaybackError(errorMessage);
      setIsRecovering(true);

      onReportBroken(channel.url).then((response) => {
        if (response.success && response.backupAvailable && response.backups.length > 0) {
          onSelectBackup(response.backups[0]);
        } else {
          setIsRecovering(false);
          setPlaybackError("The transmission is currently down. No online secondary routes found.");
        }
      }).catch(() => {
        setIsRecovering(false);
        setPlaybackError("Broadcast connection timeout.");
      });
    }, safetyBufferWindow);
  };

  const resetHealthTrackers = () => {
    if (failureTimerRef.current) clearTimeout(failureTimerRef.current);
    setPlaybackError(null);
    setIsRecovering(false);
    setIsLoading(false); 
    setIsPlaying(true);
  };

  if (!channel) {
    return (
      <div className={`w-full aspect-video border rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all ${
        theme === "light" ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-slate-950 border-slate-800 text-slate-400"
      }`}>
        <Tv className="w-10 h-10 text-slate-400 mb-4 animate-pulse" />
        <p className="text-sm font-semibold">Broadcast Feed Receiver Idle</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">Select a feed channel on the navigation index array.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`w-full flex flex-col bg-black relative shadow-lg border overflow-hidden transition-all duration-300 group ${
          isFullscreen ? "h-screen w-screen" : "aspect-video"
        } ${theme === "light" ? "border-slate-200" : "border-slate-850"}`}
        style={{ cursor: showControls ? "default" : "none" }}
      >
        
        <div className="flex-1 w-full h-full relative overflow-hidden">
          {strategy.isYoutube ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${strategy.cleanUrl}?autoplay=1&mute=1&modestbranding=1&rel=0`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : strategy.useNativeVideo ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              muted={isMuted}
              onPlaying={resetHealthTrackers}
              onCanPlay={() => setIsLoading(false)} 
              onWaiting={() => monitorStreamHealthState("Network connection buffering...")}
              onStalled={() => monitorStreamHealthState("Data feed lagging...")}
              onError={() => monitorStreamHealthState("Broadcast feed completely lost.", true)}
            />
          ) : (
            <iframe 
              src={strategy.cleanUrl} 
              className="w-full h-full border-0 bg-black" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowFullScreen 
            />
          )}

          {isLoading && !playbackError && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-40 transition-opacity duration-300">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
              <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
                Connecting To Live Feed
              </h3>
              <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed font-sans px-4">
                Establishing secure stream link... Please wait, some international channels may take up to 15 seconds to safely sync data.
              </p>
            </div>
          )}

          {playbackError && strategy.useNativeVideo && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-50">
              <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
              <h3 className="text-sm font-semibold text-slate-100">Signal Disrupted</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">{playbackError}</p>
              
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={handleReloadStream}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? "animate-spin" : ""}`} />
                  Retry Connection
                </button>
              </div>

              {isRecovering && (
                <div className="mt-4 flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span className="text-[10px] font-bold text-slate-300 font-sans uppercase">Switching CDN Paths...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {strategy.useNativeVideo && (
          <div className={`w-full p-3 border-t flex items-center justify-between gap-4 select-none transition-all duration-300 ${
            isFullscreen 
              ? `absolute bottom-0 left-0 right-0 bg-slate-950/90 border-slate-800 text-white backdrop-blur-sm transform ${
                  showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                }` 
              : theme === "light" 
                ? "bg-white border-slate-200" 
                : "bg-slate-900 border-slate-800"
          } z-40`}>
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className={`p-2 rounded-lg transition-all border ${
                  theme === "light" && !isFullscreen
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" 
                    : "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300"
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              
              <button
                onClick={toggleMute}
                className={`p-2 rounded-lg transition-all border ${
                  theme === "light" && !isFullscreen
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" 
                    : "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300"
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleReloadStream}
                title="Reload Stream Buffer"
                className={`p-2 rounded-lg transition-all border ${
                  theme === "light" && !isFullscreen
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" 
                    : "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300"
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isReloading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 font-sans uppercase">VOL</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div>
              <button
                onClick={toggleFullscreen}
                className={`p-2 rounded-lg transition-all border ${
                  theme === "light" && !isFullscreen
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" 
                    : "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300"
                }`}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

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