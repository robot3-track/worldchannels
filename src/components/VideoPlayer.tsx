import React, { useEffect, useRef, useState, useMemo } from "react";
import { Tv, AlertTriangle, RefreshCw, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Video, Square, Download, Clock, Star } from "lucide-react";
import { StreamChannel } from "../types";

interface VideoPlayerProps {
  channel: StreamChannel | null;
  onReportBroken: (url: string) => Promise<{ success: boolean; backupAvailable: boolean; backups: StreamChannel[] }>;
  onSelectBackup: (backup: StreamChannel) => void;
  theme: "light" | "dark";
  // Global Save to Deck bookmark properties
  bookmarkedIds: string[];
  onToggleBookmark: (channelId: string) => void;
}

const EMBED_ONLY_DOMAINS = [
  "online.tm", "alpha.tv.online.tm",
  "thebosstv.com", "live.thebosstv.com",
  "tvkaista.net", "live-fi.tvkaista.net", "live-fi", "futbol9865.ultratv13.workers.dev", "ultratv13.workers.dev", "stream1.antenaplay.ro",
  "antenaplay.ro", "stream1.antenaplay", "live-aburayhan1106.telewebion.ir", 
  "edge22.776740.ir.cdn.ir"
];

const YOUTUBE_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

const getPlayerStrategy = (channel: StreamChannel | null) => {
  if (!channel) return { isYoutube: false, isEmbedOnly: false, useNativeVideo: false, cleanUrl: "", isHttpProxy: false };

  const url = channel.url;
  const urlToCheck = url.split('?')[0].toLowerCase();
  
  const match = url.match(YOUTUBE_REGEX);
  const youtubeId = (match && match[2].length === 11) ? match[2] : null;
  if (youtubeId) return { isYoutube: true, isEmbedOnly: false, useNativeVideo: false, cleanUrl: youtubeId, isHttpProxy: false };

  const matchesEmbedOnly = EMBED_ONLY_DOMAINS.some(domain => url.includes(domain));
  if (matchesEmbedOnly) {
    return { isYoutube: false, isEmbedOnly: true, useNativeVideo: false, cleanUrl: url, isHttpProxy: false };
  }

  const isStream = urlToCheck.includes(".m3u8") || url.toLowerCase().includes("m3u8") || 
                   urlToCheck.includes(".mp4") || urlToCheck.includes(".m4s");
                   
  if (isStream) {
    let finalUrl = url;
    let isHttpProxy = false;
    if (url.startsWith("http://") && window.location.protocol === "https:") {
      finalUrl = `https://cors-anywhere.herokuapp.com/${url}`;
      isHttpProxy = true;
    }
    return { isYoutube: false, isEmbedOnly: false, useNativeVideo: true, cleanUrl: finalUrl, isHttpProxy };
  }

  return { isYoutube: false, isEmbedOnly: true, useNativeVideo: false, cleanUrl: url, isHttpProxy: false };
};

export default function VideoPlayer({
  channel,
  onReportBroken,
  onSelectBackup,
  theme,
  bookmarkedIds,
  onToggleBookmark
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const failureTimerRef = useRef<any | null>(null);
  const controlsTimeoutRef = useRef<any | null>(null);
  const hlsRef = useRef<any | null>(null);
  
  // Recording Core References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<any | null>(null);
  const countdownIntervalRef = useRef<any | null>(null);

  // Controls state managers
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // States for Loading and Errors
  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // Recording State Managers
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState<number>(30); 
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showRecordPanel, setShowRecordPanel] = useState(false);

  const strategy = useMemo(() => getPlayerStrategy(channel), [channel?.id, channel?.url]);

  // Derived state to check if the currently loaded channel is bookmarked
  const isBookmarked = useMemo(() => {
    return channel ? bookmarkedIds.includes(channel.id) : false;
  }, [channel, bookmarkedIds]);

  const handleMouseMove = () => {
    if (!showControls) setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500); 
    }
  };

  const cleanUpHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const initPlayer = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    cleanUpHls();
    stopRecording(); 

    if (strategy.cleanUrl.includes(".m3u8") || strategy.cleanUrl.includes("m3u8")) {
      try {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const hls = new Hls({
            xhrSetup: (xhr) => {
              if (strategy.isHttpProxy) {
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
              }
            }
          });

          hlsRef.current = hls;
          hls.loadSource(strategy.cleanUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              monitorStreamHealthState("Media streaming engine encountered data synchronization faults.", true);
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = strategy.cleanUrl;
          video.load();
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      } catch (err) {
        console.error("Failed to dynamically allocate HLS streaming engine", err);
      }
    } else {
      video.src = strategy.cleanUrl;
      video.load();
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const startRecording = () => {
    const video = videoRef.current;
    if (!video) return;

    const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
    
    if (!stream) {
      alert("Stream capture is not supported by your current browser configuration.");
      return;
    }

    recordedChunksRef.current = [];
    setDownloadUrl(null);

    let options = { mimeType: "video/webm;codecs=vp9,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm;codecs=vp8,opus" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
    }

    try {
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsRecording(false);
        setTimeLeft(0);
      };

      recorder.start(1000);
      setIsRecording(true);
      setTimeLeft(recordDuration);

      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, recordDuration * 1000);

    } catch (err) {
      console.error("Recording runtime allocation failed:", err);
      alert("Failed to initialize system recorder pipeline.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const handleReloadStream = () => {
    const video = videoRef.current;
    if (!video || !strategy.useNativeVideo) return;

    setIsReloading(true);
    setIsLoading(true); 
    setPlaybackError(null);
    setIsRecovering(false);
    if (failureTimerRef.current) clearTimeout(failureTimerRef.current);

    cleanUpHls();
    stopRecording();
    video.src = "";
    video.load();
    
    setTimeout(() => {
      initPlayer();
      setIsReloading(false);
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
    setDownloadUrl(null);
    if (failureTimerRef.current) clearTimeout(failureTimerRef.current);

    if (strategy.useNativeVideo) {
      initPlayer();
    } else {
      setIsLoading(false);
    }

    return () => {
      cleanUpHls();
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [channel?.id, strategy.cleanUrl, strategy.useNativeVideo]);

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
      stopRecording();

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
      <div className={`w-full aspect-video border rounded-none flex flex-col items-center justify-center p-6 text-center transition-all ${
        theme === "light" 
          ? "bg-[#faf9f6] border-zinc-300/80 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-zinc-500" 
          : "bg-[#0d0e12] border-neutral-800 shadow-[4px_4px_0px_0px_rgba(99,102,241,0.2)] text-neutral-400"
      }`}>
        <Tv className="w-10 h-10 text-zinc-400 mb-4 animate-pulse" />
        <p className="text-xs font-black tracking-tight uppercase font-mono">Broadcast Receiver Idle</p>
        <p className="text-[10px] text-zinc-500 dark:text-neutral-500 mt-1 max-w-xs font-mono">Select a feed channel on the navigation index array.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Video Box Container */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`w-full flex flex-col bg-black relative border rounded-none overflow-hidden transition-all duration-300 group ${
          isFullscreen ? "h-screen w-screen" : "aspect-video"
        } ${
          theme === "light" 
            ? "border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]" 
            : "border-neutral-800 shadow-[4px_4px_0px_0px_rgba(99,102,241,0.2)]"
        }`}
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
              crossOrigin="anonymous" 
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
            <div className="absolute inset-0 bg-[#0d0e12] flex flex-col items-center justify-center p-6 text-center z-40 transition-opacity duration-300">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <h3 className="text-xs font-black tracking-wide uppercase font-mono text-neutral-200">
                Connecting To Live Feed
              </h3>
              <p className="text-[10px] text-neutral-500 mt-2 max-w-xs leading-relaxed font-mono px-4">
                Establishing secure stream link... Please wait.
              </p>
            </div>
          )}

          {playbackError && strategy.useNativeVideo && (
            <div className="absolute inset-0 bg-[#0d0e12]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-50">
              <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
              <h3 className="text-xs font-black tracking-wide uppercase font-mono text-neutral-100">Signal Disrupted</h3>
              <p className="text-[10px] text-neutral-500 font-mono mt-1 max-w-xs">{playbackError}</p>
              
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={handleReloadStream}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold font-mono uppercase border rounded-none transition-all ${
                    theme === "light"
                      ? "bg-white border-zinc-900 text-zinc-900 hover:bg-zinc-50"
                      : "bg-neutral-950 border-neutral-800 text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? "animate-spin" : ""}`} />
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* RECORDING RUNTIME HUD OVERLAY */}
          {isRecording && (
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-rose-600 border border-rose-500 px-3 py-1.5 rounded-none animate-pulse text-white font-mono text-[10px] font-bold uppercase tracking-wider">
              <div className="w-2 h-2 rounded-none bg-white animate-ping" />
              <span>REC {timeLeft}s</span>
            </div>
          )}
        </div>

        {/* CONTROLS OVERLAY FOOTER DECK */}
        {strategy.useNativeVideo && (
          <div className={`w-full p-3 border-t flex items-center justify-between gap-4 select-none transition-all duration-300 ${
            isFullscreen 
              ? `absolute bottom-0 left-0 right-0 bg-[#0d0e12]/95 border-neutral-800 text-white backdrop-blur-sm transform ${
                  showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                }` 
              : theme === "light" 
                ? "bg-white border-zinc-200" 
                : "bg-neutral-950 border-neutral-900"
          } z-40`}>
            <div className="flex items-center gap-1.5">
              <button onClick={togglePlay} className={`p-2 rounded-none border transition-all ${theme === "light" ? "border-zinc-200 hover:border-zinc-400 bg-white" : "border-neutral-900 hover:border-neutral-700 bg-neutral-950"}`}>{isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}</button>
              <button onClick={toggleMute} className={`p-2 rounded-none border transition-all ${theme === "light" ? "border-zinc-200 hover:border-zinc-400 bg-white" : "border-neutral-900 hover:border-neutral-700 bg-neutral-950"}`}>{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
              <button onClick={handleReloadStream} className={`p-2 rounded-none border transition-all ${theme === "light" ? "border-zinc-200 hover:border-zinc-400 bg-white" : "border-neutral-900 hover:border-neutral-700 bg-neutral-950"}`}>{<RefreshCw className="w-4 h-4" />}</button>
              
              {/* DVR SETUP TRIGGER BUTTON */}
              <button 
                onClick={() => setShowRecordPanel(!showRecordPanel)} 
                className={`p-2 rounded-none border transition-all ${
                  showRecordPanel || isRecording 
                    ? "bg-rose-600 border-rose-600 text-white" 
                    : theme === "light" 
                    ? "border-zinc-200 hover:border-zinc-400 bg-white" 
                    : "border-neutral-900 hover:border-neutral-700 bg-neutral-950 text-neutral-400"
                }`}
                title="DVR Recording Setup"
              >
                <Video className="w-4 h-4" />
              </button>

              {/* INTEGRATED Control Bar Bookmark Button */}
              <button
                onClick={() => onToggleBookmark(channel.id)}
                className={`p-2 rounded-none border transition-all ${
                  isBookmarked
                    ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600 hover:border-amber-600"
                    : theme === "light"
                    ? "border-zinc-200 hover:border-zinc-400 bg-white text-zinc-400 hover:text-amber-500"
                    : "border-neutral-900 hover:border-neutral-700 bg-neutral-950 text-neutral-500 hover:text-amber-500"
                }`}
                title={isBookmarked ? "Remove from Deck" : "Save to Deck"}
              >
                <Star className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-[10px] font-black tracking-widest text-zinc-400 dark:text-neutral-500 font-mono uppercase">VOL</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-zinc-200 dark:bg-neutral-800 rounded-none appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <button onClick={toggleFullscreen} className={`p-2 rounded-none border transition-all ${theme === "light" ? "border-zinc-200 hover:border-zinc-400 bg-white" : "border-neutral-900 hover:border-neutral-700 bg-neutral-950"}`}>{isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}</button>
            </div>
          </div>
        )}
      </div>

      {/* EXPANDABLE DVR STREAM RECORDING INTERFACE PANEL */}
      {showRecordPanel && strategy.useNativeVideo && (
        <div className={`border rounded-none p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          theme === "light" 
            ? "bg-[#faf9f6] border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-zinc-700" 
            : "bg-[#0d0e12] border-neutral-800 shadow-[4px_4px_0px_0px_rgba(99,102,241,0.2)] text-neutral-300"
        }`}>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-zinc-400 dark:text-neutral-500" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-500 dark:text-neutral-400">DVR Stream Capture</h4>
              <p className="text-[10px] text-zinc-400 dark:text-neutral-600 font-mono mt-0.5">Record a snippet directly onto your local file system storage context.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isRecording ? (
              <>
                <select 
                  value={recordDuration} 
                  onChange={(e) => { setRecordDuration(Number(e.target.value)); setDownloadUrl(null); }}
                  className={`text-[10px] font-bold font-mono uppercase p-2 rounded-none border focus:outline-none cursor-pointer ${
                    theme === "light" ? "bg-white border-zinc-200 text-zinc-800" : "bg-neutral-950 border-neutral-900 text-neutral-100"
                  }`}
                >
                  <option value={10}>10 Seconds</option>
                  <option value={30}>30 Seconds</option>
                  <option value={60}>1 Minute</option>
                  <option value={180}>3 Minutes</option>
                  <option value={300}>5 Minutes</option>
                </select>
                <button
                  onClick={startRecording}
                  disabled={!isPlaying}
                  className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-wider px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-400 text-white rounded-none transition-all shadow-none"
                >
                  <Video className="w-3.5 h-3.5" />
                  Capture Sequence
                </button>
              </>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-wider px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white rounded-none transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
                Halt Recording ({timeLeft}s left)
              </button>
            )}

            {downloadUrl && !isRecording && (
              <a
                href={downloadUrl}
                download={`${channel.name.replace(/\s+/g, "_")}_Recording.webm`}
                className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-wider px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-none transition-all animate-bounce"
              >
                <Download className="w-3.5 h-3.5" />
                Download Video File
              </a>
            )}
          </div>
        </div>
      )}

      {/* METADATA BROADCAST STAT CARD */}
      <div className={`border rounded-none p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        theme === "light" 
          ? "bg-[#faf9f6] border-zinc-300/80 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]" 
          : "bg-[#0d0e12] border-neutral-800 shadow-[4px_4px_0px_0px_rgba(99,102,241,0.2)]"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-none border flex items-center justify-center flex-shrink-0 shadow-none ${
            theme === "light" ? "bg-white border-zinc-200" : "bg-neutral-950 border-neutral-900"
          }`}>
            {channel.logo ? (
              <img src={channel.logo} alt={channel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Tv className="w-5 h-5 text-zinc-400" />
            )}
          </div>
          <div>
            <h3 className={`text-xs font-black font-mono uppercase ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>{channel.name}</h3>
            <p className="text-[10px] font-medium font-mono text-zinc-400 dark:text-neutral-500 mt-0.5 uppercase tracking-wide">
              {channel.category} <span className="text-zinc-300 dark:text-neutral-800">//</span> {channel.country}
            </p>
          </div>
        </div>

        {/* STAT CARD TOGGLE INTERFACE */}
        <button
          onClick={() => onToggleBookmark(channel.id)}
          className={`flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-wider px-4 py-2.5 border rounded-none transition-all ${
            isBookmarked
              ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
              : theme === "light"
              ? "bg-white border-zinc-900 text-zinc-900 hover:bg-zinc-50"
              : "bg-neutral-950 border-neutral-800 text-neutral-200 hover:border-neutral-700"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
          {isBookmarked ? "Remove from Deck" : "Save to Deck"}
        </button>
      </div>
    </div>
  );
}