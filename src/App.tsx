import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Tv,
  Info,
  HelpCircle,
  Sun,
  Moon,
  ArrowRight,
  X,
  Trash2,
  PlusCircle
} from "lucide-react";
import { StreamChannel, CategoryFilter, TutorialStep } from "./types";
import WorldMap from "./components/WorldMap";
import VideoPlayer from "./components/VideoPlayer";
import ChannelList from "./components/ChannelList";
import { SubmitStreamModal } from "./components/SubmitStreamModal";

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetClass: "world-map-step",
    title: "Global Interactive Map",
    description: "Select any active coordinate node across the globe to initialize the satellite connection and stream local broadcasts.",
    preferredPlacement: "bottom", 
    overlap: true 
  },
  {
    targetClass: "search-bar-step",
    title: "Directory Search",
    description: "Filter live feeds by station name, network tags, or region. Shortcut: Press [/] anywhere to focus search.",
    preferredPlacement: "left"
  },
  {
    targetClass: "category-filter-step",
    title: "Category Filtering",
    description: "Segment incoming signals by genre, including News, Sports, Documentaries, or General Entertainment.",
    preferredPlacement: "left"
  },
  {
    targetClass: "channel-list-step",
    title: "Station Directory",
    description: "Browse available broadasting feeds. Navigate using standard arrow keys and press Enter to select.",
    preferredPlacement: "left"
  },
  {
    targetClass: "player-step",
    title: "Primary Broadcast Output",
    description: "Main video stream display. Signal fallback controls are located directly below for switching to redundant backup sources.",
    preferredPlacement: "right"
  }
];

const TUTORIAL_STORAGE_KEY = "world_channels_onboarding_completed_v1";

export default function App() {
  const [streams, setStreams] = useState<StreamChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("world_channels_favorites_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentChannelIds, setRecentChannelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("world_channels_recents_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [runTutorial, setRunTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipCoords, setTooltipCoords] = useState({ 
    top: 0, 
    left: 0, 
    arrowLeft: 0, 
    arrowTop: 0,
    placement: "bottom" as "top" | "bottom" | "left" | "right" 
  });

  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    categoriesCount: { sports: 0, news: 0, science: 0, freetv: 0, country: 0 }
  });

  useEffect(() => {
    localStorage.setItem("world_channels_favorites_v1", JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  useEffect(() => {
    localStorage.setItem("world_channels_recents_v1", JSON.stringify(recentChannelIds));
  }, [recentChannelIds]);

  const handleToggleBookmark = useCallback((channelId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  }, []);

  const handleClearAllBookmarks = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all bookmarked stations?")) {
      setBookmarkedIds([]);
    }
  }, []);

  const updateTooltipPosition = useCallback(() => {
    if (!runTutorial) return;

    const activeStep = TUTORIAL_STEPS[currentStep];
    const targetElement = document.querySelector(`.${activeStep.targetClass}`);
    
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      
      if (rect.width === 0 || rect.height === 0) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      const popoverWidth = 320;
      const popoverHeight = 180; 
      const padding = 16;
      
      let placement = activeStep.preferredPlacement || "bottom";
      const gapOffset = activeStep.overlap ? -80 : 12;

      if (placement === "left" && rect.left < popoverWidth + padding) {
        placement = "right"; 
      } else if (placement === "right" && window.innerWidth - rect.right < popoverWidth + padding) {
        placement = "left";
      }

      let top = 0;
      let left = 0;
      let arrowLeft = 0;
      let arrowTop = 0;

      switch (placement) {
        case "left":
          left = rect.left + scrollLeft - popoverWidth - gapOffset;
          top = rect.top + scrollTop + (rect.height / 2) - (popoverHeight / 2);
          arrowTop = popoverHeight / 2;
          break;

        case "right":
          left = rect.right + scrollLeft + gapOffset;
          top = rect.top + scrollTop + (rect.height / 2) - (popoverHeight / 2);
          arrowTop = popoverHeight / 2;
          break;

        case "top":
          left = rect.left + scrollLeft + (rect.width / 2) - (popoverWidth / 2);
          top = rect.top + scrollTop - popoverHeight - gapOffset;
          arrowLeft = popoverWidth / 2;
          break;

        case "bottom":
        default:
          left = rect.left + scrollLeft + (rect.width / 2) - (popoverWidth / 2);
          top = rect.bottom + scrollTop + gapOffset;
          arrowLeft = popoverWidth / 2;
          break;
      }

      const minLeft = scrollLeft + padding;
      const maxLeft = scrollLeft + window.innerWidth - popoverWidth - padding;
      if (left < minLeft) {
        left = minLeft;
      } else if (left > maxLeft) {
        left = maxLeft;
      }

      const minTop = scrollTop + padding;
      const maxTop = scrollTop + window.innerHeight - popoverHeight - padding;
      if (top < minTop) {
        const delta = minTop - top;
        top = minTop;
        arrowTop = Math.max(16, arrowTop - delta);
      } else if (top > maxTop) {
        const delta = top - maxTop;
        top = maxTop;
        arrowTop = Math.min(popoverHeight - 16, arrowTop + delta);
      }

      setTooltipCoords({ top, left, arrowLeft, arrowTop, placement });
    }
  }, [runTutorial, currentStep]);

  useEffect(() => {
    if (!runTutorial) return;

    const activeStep = TUTORIAL_STEPS[currentStep];
    const targetElement = document.querySelector(`.${activeStep.targetClass}`);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      const intervals = [100, 250, 450, 700];
      const timers = intervals.map(delay => setTimeout(updateTooltipPosition, delay));

      return () => timers.forEach(clearTimeout);
    }
  }, [currentStep, runTutorial, updateTooltipPosition]);

  useEffect(() => {
    if (!runTutorial) return;

    window.addEventListener("resize", updateTooltipPosition);
    window.addEventListener("scroll", updateTooltipPosition);

    const observer = new ResizeObserver(() => {
      updateTooltipPosition();
    });
    
    const activeStep = TUTORIAL_STEPS[currentStep];
    const targetElement = document.querySelector(`.${activeStep.targetClass}`);
    if (targetElement) {
      observer.observe(targetElement);
    }

    return () => {
      window.removeEventListener("resize", updateTooltipPosition);
      window.removeEventListener("scroll", updateTooltipPosition);
      observer.disconnect();
    };
  }, [runTutorial, currentStep, updateTooltipPosition]);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/streams");
      const data = await res.json();
      
      if (data.success && data.streams) {
        setStreams(data.streams);
        const sportsFeeds = data.streams.filter((s: StreamChannel) => s.category === "sports");
        if (sportsFeeds.length > 0) {
          setSelectedChannel(sportsFeeds[0]);
        } else if (data.streams.length > 0) {
          setSelectedChannel(data.streams[0]);
        }
      } else {
        throw new Error("Invalid response standard");
      }
    } catch (err: any) {
      console.error("Broadcast acquisition error:", err);
      setError("Unable to initialize broadcast signal network. Attempting re-connection...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  useEffect(() => {
    if (!loading && streams.length > 0) {
      const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!completed) {
        const timer = setTimeout(() => {
          setRunTutorial(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, streams]);

  useEffect(() => {
    if (streams.length === 0) return;

    const online = streams.filter(s => s.status === "online").length;
    const catCount = { sports: 0, news: 0, science: 0, freetv: 0, country: 0 };
    
    streams.forEach(s => {
      if (s.category in catCount) {
        catCount[s.category as keyof typeof catCount]++;
      }
    });

    setStats({
      total: streams.length,
      online,
      categoriesCount: catCount
    });
  }, [streams]);

  const handleReportBroken = useCallback(async (url: string) => {
    try {
      const res = await fetch("/api/report-broken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      setStreams((prev) =>
        prev.map((s) => (s.url === url ? { ...s, status: "offline" } : s))
      );

      setSelectedChannel((prev) => {
        if (prev && prev.url === url) {
          return { ...prev, status: "offline" };
        }
        return prev;
      });

      return {
        success: data.success || false,
        backupAvailable: data.backupAvailable || false,
        backups: data.backups || []
      };
    } catch (err) {
      console.error("Signal incident logging error:", err);
      return { success: false, backupAvailable: false, backups: [] };
    }
  }, []);

  const handleSelectBackup = useCallback((backupChannel: StreamChannel) => {
    setStreams((prev) => {
      const exists = prev.some((s) => s.id === backupChannel.id);
      if (!exists) {
        return [backupChannel, ...prev];
      }
      return prev.map(s => s.id === backupChannel.id ? { ...s, status: "online" } : s);
    });
    
    setSelectedChannel(backupChannel);
  }, []);

  const handleSelectChannel = useCallback((channel: StreamChannel) => {
    setSelectedChannel(channel);
    
    setRecentChannelIds((prev) => {
      const filtered = prev.filter((id) => id !== channel.id);
      return [channel.id, ...filtered].slice(0, 4);
    });

    setTimeout(() => {
      const playerElement = document.getElementById("live-player-section");
      if (playerElement) {
        playerElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }, []);

  useEffect(() => {
    let pollInterval = 10000;
    let lastCount = streams.length;
    let timeoutId: NodeJS.Timeout;
    
    const syncAllStreams = async () => {
      try {
        const res = await fetch("/api/streams");
        const data = await res.json();
        if (data.success && data.streams) {
          const newCount = data.streams.length;
          setStreams(data.streams);

          setSelectedChannel((current) => {
            if (!current) return null;
            const updated = data.streams.find((s: StreamChannel) => s.id === current.id);
            if (updated && updated.status !== current.status) {
              return { ...current, status: updated.status };
            }
            return current;
          });

          if (newCount >= 1000) {
            pollInterval = 60000;
          } else if (newCount > lastCount) {
            pollInterval = 10000;
          } else {
            pollInterval = 30000;
          }
          lastCount = newCount;
        }
      } catch (err) {
        console.error("Background network synchronization error:", err);
      }
      timeoutId = setTimeout(syncAllStreams, pollInterval);
    };

    const initialTimeout = setTimeout(syncAllStreams, 2000);
    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(timeoutId);
    };
  }, [streams.length]);

  const handleNextTutorial = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSkipTutorial();
    }
  };

  const handleSkipTutorial = () => {
    setRunTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  const handleRestartTutorial = () => {
    setCurrentStep(0);
    setRunTutorial(true);
  };

  const getSpotlightClass = (stepClass: string) => {
    if (!runTutorial) return "";
    const activeStep = TUTORIAL_STEPS[currentStep];
    if (activeStep.targetClass === stepClass) {
      return theme === "light"
        ? "ring-2 ring-blue-600 ring-offset-2 ring-offset-slate-50 z-40 relative transition-all duration-300 shadow-md"
        : "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 z-40 relative transition-all duration-300 shadow-lg shadow-blue-500/10";
    }
    return "opacity-40 transition-all duration-300 pointer-events-none";
  };

  const filteredStreams = streams.filter((stream) => {
    if (selectedCategory === "favorites") {
      return bookmarkedIds.includes(stream.id);
    }
    return true;
  });

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-200 selection:bg-blue-500/20 selection:text-blue-500 ${
      theme === "light" ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-100"
    }`}>
      
      {/* Broadcast Header */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors duration-200 ${
        theme === "light" 
          ? "border-slate-200 bg-white/90" 
          : "border-slate-800/80 bg-slate-950/90"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              theme === "light" ? "bg-slate-100 border border-slate-200" : "bg-slate-900 border border-slate-800"
            }`}>
              <Globe className={`w-5 h-5 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight uppercase">World Channels</h1>
                <span className="text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">
                  NETWORK LIVE
                </span>
              </div>
              <p className={`text-xs ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                Global Television Network & Feed Directory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {bookmarkedIds.length > 0 && (
              <button
                onClick={handleClearAllBookmarks}
                className="px-3 py-1.5 border rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Bookmarks ({bookmarkedIds.length})</span>
              </button>
            )}

            <button
              onClick={handleRestartTutorial}
              className={`px-3 py-1.5 border rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                theme === "light"
                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Platform Tour</span>
            </button>

            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`px-3 py-1.5 border rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                theme === "light"
                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5 text-slate-700" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{theme === "light" ? "Dark Theme" : "Light Theme"}</span>
            </button>

            <div className={`hidden md:flex items-center gap-3 px-3 py-1.5 border rounded-md text-xs font-mono ${
              theme === "light" ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-900 border-slate-800 text-slate-400"
            }`}>
              <span>Feeds: <b className={theme === "light" ? "text-slate-900" : "text-slate-100"}>{stats.total}</b></span>
              <div className={`h-3 w-px ${theme === "light" ? "bg-slate-300" : "bg-slate-800"}`} />
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Active: <b className="text-emerald-500">{stats.online}</b></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 z-10">
        
        <div className={`p-3 border rounded-lg text-xs tracking-tight ${
          theme === "light" ? "bg-blue-50/50 border-blue-200/60 text-blue-950" : "bg-blue-950/30 border-blue-900/50 text-blue-200"
        }`}>
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-500" />
            <p>
              Geographic coordinates represent signal origin points. If a stream becomes unresponsive, 
              <button onClick={() => window.location.reload()} className="mx-1 font-semibold underline cursor-pointer">re-initialize connection</button>.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg flex items-center justify-between gap-4 text-xs font-mono text-rose-500">
            <span className="font-medium">Connection Alert: {error}</span>
            <button onClick={fetchStreams} className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 px-3 py-1.5 font-medium rounded transition-colors">
              Reconnect
            </button>
          </div>
        )}

        <>
          {/* Map Display */}
          <section className={`w-full world-map-step ${getSpotlightClass("world-map-step")}`}>
            <WorldMap
              streams={filteredStreams}
              selectedCategory={selectedCategory}
              onSelectChannel={handleSelectChannel}
              activeChannel={selectedChannel}
              theme={theme}
            />
          </section>

          {/* Primary Viewport & Controls */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Player Main Area */}
            <div id="live-player-section" className={`lg:col-span-8 flex flex-col gap-4 scroll-mt-24 player-step ${getSpotlightClass("player-step")}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Tv className={`w-4 h-4 ${theme === "light" ? "text-slate-700" : "text-slate-300"}`} />
                  <h2 className="text-xs font-bold uppercase tracking-wider">Live Broadcast Feed</h2>
                </div>
              </div>

              <VideoPlayer
                channel={selectedChannel}
                onReportBroken={handleReportBroken}
                onSelectBackup={handleSelectBackup}
                theme={theme}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
              />

              {/* History Bar */}
              {recentChannelIds.length > 0 && (
                <div className={`p-2.5 border rounded-lg text-xs flex items-center gap-3 overflow-x-auto ${
                  theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"
                }`}>
                  <span className="text-slate-500 uppercase font-semibold text-[11px] tracking-wider flex-shrink-0">
                    Recent Stations:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {recentChannelIds
                      .map((id) => streams.find((s) => s.id === id))
                      .filter((channel): channel is StreamChannel => !!channel)
                      .map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => handleSelectChannel(channel)}
                          className={`px-2.5 py-1 border text-xs font-medium rounded transition-all hover:border-blue-500 truncate max-w-[150px] cursor-pointer ${
                            selectedChannel?.id === channel.id
                              ? "bg-blue-500/10 border-blue-500 text-blue-500"
                              : theme === "light"
                              ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {channel.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Directory */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className={`search-bar-step category-filter-step channel-list-step ${getSpotlightClass(currentStep === 1 ? "search-bar-step" : currentStep === 2 ? "category-filter-step" : "channel-list-step")}`}>
                <ChannelList
                  streams={streams}
                  selectedCategory={selectedCategory}
                  onChangeCategory={(cat) => setSelectedCategory(cat)}
                  selectedChannel={selectedChannel}
                  onSelectChannel={handleSelectChannel}
                  theme={theme}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                />
              </div>
            </div>
          </section>
        </>
      </main>

      {/* Broadcaster Footer */}
      <footer className={`mt-auto border-t py-6 px-6 ${
        theme === "light" ? "border-slate-200 bg-white text-slate-600" : "border-slate-800 bg-slate-950 text-slate-400"
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="tracking-wide">
            WORLD CHANNELS BROADCAST NETWORK &copy; {new Date().getFullYear()} &bull; GLOBAL LIVE DISTRIBUTION
          </p>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className={`px-3 py-1.5 border rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              theme === "light"
                ? "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-400"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Feed Direct</span>
          </button>
        </div>
      </footer>

      <SubmitStreamModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        theme={theme}
      />

      {/* Network Loader Screen */}
      {loading && streams.length === 0 && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-200 ${
          theme === "light" ? "bg-slate-50/90 text-slate-900" : "bg-slate-950/90 text-slate-100"
        }`}>
          <div className="flex flex-col items-center max-w-sm w-full px-6 text-center">
            
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-12 h-12 border rounded-xl flex items-center justify-center ${
                theme === "light" ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
              }`}>
                <Globe className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight uppercase">World Channels</h1>
                </div>
                <p className={`text-xs ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                  Global Live Broadcaster Network
                </p>
              </div>
            </div>

            <div className="space-y-2 w-full">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                Initializing Broadcast Network
              </h2>
              <p className={`text-xs ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                Connecting to primary satellite feeds and retrieving global distribution lists.
              </p>
            </div>

            <div className={`mt-8 w-full border rounded-md p-3 text-xs font-mono ${
              theme === "light" ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-900/50 border-slate-800 text-slate-400"
            }`}>
              <span className="block animate-pulse">Establishing broadcast handshake...</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Guide Overlay */}
      <AnimatePresence>
        {runTutorial && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
            <div className="fixed inset-0 pointer-events-auto bg-slate-950/50 backdrop-blur-[2px] z-40" onClick={handleSkipTutorial} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: `${tooltipCoords.top}px`,
                left: `${tooltipCoords.left}px`,
              }}
              className={`w-[320px] pointer-events-auto border p-5 shadow-xl z-50 rounded-lg transition-all duration-150 ${
                theme === "light"
                  ? "bg-white border-slate-200 text-slate-900"
                  : "bg-slate-900 border-slate-800 text-slate-100"
              }`}
            >
              {!(TUTORIAL_STEPS[currentStep].overlap) && (
                <div
                  style={{
                    left: tooltipCoords.placement === "top" || tooltipCoords.placement === "bottom" ? `${tooltipCoords.arrowLeft}px` : undefined,
                    top: tooltipCoords.placement === "left" || tooltipCoords.placement === "right" ? `${tooltipCoords.arrowTop}px` : undefined,
                    transform: (tooltipCoords.placement === "left" || tooltipCoords.placement === "right") ? "translateY(-50%) rotate(45deg)" : "translateX(-50%) rotate(45deg)",
                  }}
                  className={`absolute w-3 h-3 transition-all duration-300 ${
                    tooltipCoords.placement === "bottom" ? "-top-[7px] border-t border-l" :
                    tooltipCoords.placement === "top" ? "-bottom-[7px] border-b border-r" :
                    tooltipCoords.placement === "right" ? "-left-[7px] border-b border-l" :
                    "-right-[7px] border-t border-r"
                  } ${
                    theme === "light"
                      ? "bg-white border-slate-200"
                      : "bg-slate-900 border-slate-800"
                  }`}
                />
              )}

              <button 
                onClick={handleSkipTutorial}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Close Guide"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-medium tracking-wider text-blue-500 uppercase">
                  Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                </span>
              </div>

              <h4 className="text-sm font-semibold tracking-tight mb-1 text-slate-900 dark:text-white">
                {TUTORIAL_STEPS[currentStep].title}
              </h4>
              
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mb-4 font-normal">
                {TUTORIAL_STEPS[currentStep].description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleSkipTutorial}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase font-medium cursor-pointer"
                >
                  Dismiss
                </button>
                
                <button
                  onClick={handleNextTutorial}
                  className={`px-3 py-1.5 text-xs font-semibold tracking-wide flex items-center gap-1 transition-all rounded-md cursor-pointer ${
                    theme === "light"
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  <span>{currentStep === TUTORIAL_STEPS.length - 1 ? "Finish" : "Next"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}