import React, { useEffect, useRef, useState, ChangeEvent, MouseEvent } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  AlertTriangle,
  RefreshCw,
  Tv,
  CheckCircle,
  Zap,
  Sparkles
} from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [healingStatus, setHealingStatus] = useState<"idle" | "healing" | "healed" | "failed">("idle");
  const [backupsFound, setBackupsFound] = useState<StreamChannel[]>([]);
  const [checkingLatency, setCheckingLatency] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [levels, setLevels] = useState<{ id: number; name: string }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is auto
  const [showSettings, setShowSettings] = useState(false);

  // Handle controls visibility timeout
  useEffect(() => {
    if (!showControls || !isPlaying) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, [showControls, isPlaying]);

  // Latest refs pattern to prevent stale closures in asynchronous event handlers
  const channelRef = useRef(channel);
  const healingStatusRef = useRef(healingStatus);
  const onReportBrokenRef = useRef(onReportBroken);
  const backupsFoundRef = useRef(backupsFound);

  useEffect(() => {
    channelRef.current = channel;
    healingStatusRef.current = healingStatus;
    onReportBrokenRef.current = onReportBroken;
    backupsFoundRef.current = backupsFound;
  });

  // Initialize and load stream
  useEffect(() => {
    if (!channel) return;

    // Reset states
    setStreamError(null);
    setHealingStatus("idle");
    setBackupsFound([]);
    setLatencyMs(null);
    setIsPlaying(false);
    setCountdownSec(null);

    const video = videoRef.current;
    if (!video) return;

    // Destroy existing Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Determine if it's a website or an m3u8 stream
    const isWebsite = channel.url.startsWith("http") && 
                      !channel.url.includes(".m3u8") && 
                      !channel.url.includes(".mp4") && 
                      !channel.url.includes(".m4s");

    setLevels([]);
    setCurrentLevel(-1);
    setShowSettings(false);

    if (isWebsite) {
      setIsPlaying(true); // Treat website as playing
      return;
    }

    // Measure connection latency to stream source
    measureStreamLatency(channel.url);

    // Initialize Hls.js if supported
    if (Hls.isSupported() && (channel.url.endsWith(".m3u8") || !video.canPlayType("application/vnd.apple.mpegurl"))) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        manifestLoadingTimeOut: 8000,
        levelLoadingTimeOut: 8000,
        fragLoadingTimeOut: 12000,
      });

      hlsRef.current = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const availableLevels = data.levels.map((level, index) => ({
          id: index,
          name: level.height ? `${level.height}p` : `Level ${index}`
        }));
        setLevels(availableLevels);
        
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Playback blocked by browser autoplay policy, keep paused but ready
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentLevel(hls.autoLevelEnabled ? -1 : data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.warn("Fatal HLS error encountered:", data.type);
          handleStreamFailure();
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setStreamError("Unable to decode live stream connection.");
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native support (Safari / iOS)
      video.src = channel.url;
      video.addEventListener("canplay", () => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      });

      video.addEventListener("error", () => {
        handleStreamFailure();
      });
    } else {
      // Standard MP4 or fallbacks
      video.src = channel.url;
      video.addEventListener("error", () => {
        handleStreamFailure();
      });
    }

    // Sync play/pause state from video element events
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
        setDuration(video.duration);
      } else if (hlsRef.current && hlsRef.current.liveSyncPosition) {
        setDuration(hlsRef.current.liveSyncPosition);
      }
    };

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
        setDuration(video.duration);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.id, channel?.url]);

  // Handle player error or load failure
  const handleStreamFailure = async () => {
    const currentChannel = channelRef.current;
    if (!currentChannel || healingStatusRef.current === "healing" || healingStatusRef.current === "healed") return;
    
    setStreamError("Stream carrier signal lost.");
    setHealingStatus("healing");
    healingStatusRef.current = "healing";

    try {
      // Call automated self-healing
      const response = await onReportBrokenRef.current(currentChannel.url);
      
      if (response.success && response.backupAvailable && response.backups.length > 0) {
        setBackupsFound(response.backups);
        backupsFoundRef.current = response.backups;
        setHealingStatus("healed");
        healingStatusRef.current = "healed";
        setCountdownSec(5); // Start counting down from 5 seconds
      } else {
        setHealingStatus("failed");
        healingStatusRef.current = "failed";
      }
    } catch (err) {
      console.error("Stream recovery failed:", err);
      setHealingStatus("failed");
      healingStatusRef.current = "failed";
    }
  };

  // Manage the countdown timer for auto-switching to backup
  useEffect(() => {
    if (countdownSec === null) return;
    if (countdownSec <= 0) {
      if (backupsFound.length > 0) {
        const topBackup = backupsFound[0];
        onSelectBackup(topBackup);
      }
      setCountdownSec(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdownSec((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownSec, backupsFound, onSelectBackup]);

  // Measure stream ping latency
  const measureStreamLatency = async (url: string) => {
    setCheckingLatency(true);
    const start = Date.now();
    try {
      await fetch(`/api/check-stream?url=${encodeURIComponent(url)}`);
      setLatencyMs(Date.now() - start);
    } catch (e) {
      // Silence
    } finally {
      setCheckingLatency(false);
    }
  };

  // Playback Control Handlers
  const togglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowControls(true);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.currentTime = val;
    }
    setCurrentTime(val);
  };

  const reloadToLive = () => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current && hlsRef.current.liveSyncPosition) {
      video.currentTime = hlsRef.current.liveSyncPosition;
    } else if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
      video.currentTime = video.duration;
    }
    
    video.play().catch(() => {});
    setShowControls(true);
  };

  const handleContainerClick = () => {
    setShowControls(true);
    if (showSettings) setShowSettings(false);
  };

  const handleLevelChange = (levelId: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
      setCurrentLevel(levelId);
    }
    setShowSettings(false);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      setIsMuted(val === 0);
    }
    setVolume(val);
  };

  const toggleFullscreen = () => {
    setShowSettings(false);
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      const requestFullscreen = 
        container.requestFullscreen || 
        (container as any).webkitRequestFullscreen || 
        (container as any).mozRequestFullScreen || 
        (container as any).msRequestFullscreen;

      if (requestFullscreen) {
        requestFullscreen.call(container).then(() => {
          setIsFullscreen(true);
        }).catch((err: any) => {
          console.error("Fullscreen request failed:", err);
          // Fallback to video fullscreen for iOS
          if (video && (video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          }
        });
      } else if (video && (video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      }
    } else {
      const exitFullscreen = 
        document.exitFullscreen || 
        (document as any).webkitExitFullscreen || 
        (document as any).mozCancelFullScreen || 
        (document as any).msExitFullscreen;
      
      if (exitFullscreen) {
        exitFullscreen.call(document);
      }
      setIsFullscreen(false);
    }
  };

  // Keep fullscreen state synced when user hits ESC
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

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

  return (
    <div className="flex flex-col gap-4">
      {/* Container holding video and controls */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseMove}
        className={`w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-lg border group ${
          theme === "light" ? "border-slate-200" : "border-slate-850"
        }`}
      >
        {/* Video Element or Iframe */}
        {channel.url.startsWith("http") && !channel.url.includes(".m3u8") && !channel.url.includes(".mp4") && !channel.url.includes(".m4s") ? (
          <iframe
            src={channel.url}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
            onClick={(e) => togglePlay(e)}
          />
        )}

        {/* Scanlines / Dark Control Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status indicator pill top left */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800/50 flex items-center gap-1.5 shadow-md">
            <span className={`w-2 h-2 rounded-full ${channel.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-[10px] font-sans text-slate-200 font-semibold uppercase tracking-wider">
              {channel.country === "Global" ? "GLOBAL FEED" : `${channel.country} Broadcast`}
            </span>
          </div>

          {latencyMs !== null && (
            <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800/50 flex items-center gap-1.5 shadow-md">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">{latencyMs}ms ping</span>
            </div>
          )}
        </div>

        {/* Top-Right: Dynamic Stream Health Controller */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => {
              measureStreamLatency(channel.url);
              reloadToLive();
            }}
            disabled={checkingLatency}
            className="bg-slate-950/85 hover:bg-slate-900 border border-slate-800/50 rounded-full p-2 text-slate-300 hover:text-slate-100 transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Reload to live & Ping check"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingLatency ? "animate-spin text-emerald-500" : ""}`} />
          </button>
          
          <button
            onClick={handleStreamFailure}
            className="bg-slate-950/85 hover:bg-slate-900 border border-slate-800/50 rounded-full p-2 text-rose-400 hover:text-rose-300 transition-all shadow-md active:scale-95"
            title="Report stream outage (Force recovery)"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* RECOVERING / SIGNAL LOST SIMPLE AND BEAUTIFUL OVERLAY */}
        {streamError && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            {/* Spinning/pulsing minimalistic status circle */}
            <div className="relative mb-6 flex items-center justify-center">
              <span className="absolute inline-flex h-16 w-16 rounded-full border border-rose-500/20 animate-ping"></span>
              <span className="absolute inline-flex h-12 w-12 rounded-full border border-rose-500/40 animate-pulse"></span>
              <div className="relative w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            <h3 className="text-md font-semibold text-slate-100 tracking-tight">
              Signal Lost
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed font-sans">
              The broadcast is offline or experiencing connection issues. We are automatically looking for an alternative stream...
            </p>

            {/* Seamless, beautiful, clean loader */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[bounce_0.6s_infinite_100ms]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[bounce_0.6s_infinite_200ms]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[bounce_0.6s_infinite_300ms]" />
              </div>
              <span className="text-[10px] font-semibold tracking-wide text-slate-500 font-sans uppercase">
                {healingStatus === "healing" ? "Tuning index..." : healingStatus === "healed" ? "Redirecting..." : "Offline"}
              </span>
            </div>

            {/* If alternate channel is acquired, show an elegant notification */}
            {healingStatus === "healed" && backupsFound.length > 0 && (
              <div className="mt-5 max-w-sm w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-center shadow-lg animate-fade-in">
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Alternate Signal Located!</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Switching to: <span className="font-bold text-slate-100">{backupsFound[0].name}</span>
                </p>
                {countdownSec !== null && (
                  <p className="text-[10px] text-emerald-500 font-mono mt-1 font-bold">
                    Initializing buffer in {countdownSec} seconds...
                  </p>
                )}
              </div>
            )}

            {healingStatus === "failed" && (
              <div className="mt-5 text-xs text-rose-500 font-semibold font-sans">
                No alternative feeds found. Please select another channel.
              </div>
            )}
          </div>
        )}

        {/* Custom Controller Overlay - shows on hover or focus, or if showControls is true */}
        <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-4 flex flex-col gap-3 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}>
          
          {/* Progress / Stream Duration Line (Interactive Live Seeker) */}
          <div className="flex items-center gap-3">
            <div className="flex-grow flex items-center relative group/seek">
              <input
                type="range"
                min="0"
                max={duration || currentTime || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
              />
            </div>
            <button 
              onClick={reloadToLive}
              className="flex items-center gap-1.5 bg-slate-900/50 hover:bg-slate-800 px-2 py-1 rounded-md transition-colors group/live"
            >
              <div className="relative flex items-center justify-center">
                <span className={`w-1.5 h-1.5 rounded-full ${Math.abs(currentTime - duration) < 8 || duration === 0 ? "bg-emerald-500" : "bg-slate-500"}`} />
                {(Math.abs(currentTime - duration) < 8 || duration === 0) && (
                  <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
              <span className={`text-[10px] font-sans font-bold tracking-wider uppercase ${Math.abs(currentTime - duration) < 8 || duration === 0 ? "text-emerald-400" : "text-slate-400 group-hover/live:text-slate-200"}`}>
                {Math.abs(currentTime - duration) < 8 || duration === 0 ? "LIVE" : "GO LIVE"}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Play/Pause & Volume */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg p-2 transition-colors active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-slate-200" />
                ) : (
                  <Play className="w-4 h-4 fill-slate-200" />
                )}
              </button>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-12 sm:w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Displaying name inside controller bar */}
            <div className="hidden md:flex flex-col text-right truncate max-w-md">
              <span className="text-xs text-slate-100 font-semibold truncate">{channel.name}</span>
              <span className="text-[9px] text-slate-500 truncate font-mono">{channel.url}</span>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2 relative">
              {/* Quality / Modes Selector */}
              {levels.length > 0 && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettings(!showSettings);
                    }}
                    className={`bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-2.5 py-2 flex items-center gap-1.5 transition-all active:scale-95 ${
                      showSettings ? "text-emerald-400 border-emerald-500/50" : "text-slate-300"
                    }`}
                  >
                    <span className="text-[10px] font-bold font-mono tracking-tighter">
                      {currentLevel === -1 ? "AUTO" : levels.find(l => l.id === currentLevel)?.name || "MODE"}
                    </span>
                  </button>

                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-3 w-32 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
                      <div className="p-2 border-b border-slate-900 bg-slate-900/50">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Video Modes</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1">
                        <button
                          onClick={() => handleLevelChange(-1)}
                          className={`w-full text-left px-3 py-2 text-[11px] font-medium transition-colors ${
                            currentLevel === -1 ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                          }`}
                        >
                          Auto Quality
                        </button>
                        {levels.map((level) => (
                          <button
                            key={level.id}
                            onClick={() => handleLevelChange(level.id)}
                            className={`w-full text-left px-3 py-2 text-[11px] font-medium transition-colors ${
                              currentLevel === level.id ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                            }`}
                          >
                            {level.name} Mode
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg p-2 transition-colors active:scale-95"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Information row about stream */}
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

        {/* Actions bar */}
        <div className="flex items-center gap-2">
          {healingStatus === "healed" && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-sans font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Alternate connection established!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
