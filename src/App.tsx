import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Tv,
  Info,
  HelpCircle,
  Sun,
  Moon,
  ArrowRight,
  X
} from "lucide-react";
import { StreamChannel, CategoryFilter } from "./types";
import WorldMap from "./components/WorldMap";
import VideoPlayer from "./components/VideoPlayer";
import ChannelList from "./components/ChannelList";

interface TutorialStep {
  targetClass: string;
  title: string;
  description: string;
  preferredPlacement?: "top" | "bottom" | "left" | "right";
  overlap?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetClass: "world-map-step",
    title: "Global Map Tracker",
    description: "Click any glowing coordinate node on this map to immediately bind a satellite connection and load that region's local broadcast.",
    preferredPlacement: "bottom", 
    overlap: true 
  },
  {
    targetClass: "search-bar-step",
    title: "Instant Search",
    description: "Type here to quickly filter channels by name, tags, or countries. Pro tip: Press the [/] key anywhere on your keyboard to instantly jump here.",
    preferredPlacement: "left"
  },
  {
    targetClass: "category-filter-step",
    title: "Filter by Category",
    description: "Easily narrow down feeds. Toggle between Sports, News, Documentaries, or general Free TV to clean up your channel options.",
    preferredPlacement: "left"
  },
  {
    targetClass: "channel-list-step",
    title: "Channel Registry",
    description: "Scroll and select available channels here. Use your Up/Down arrow keys on your keyboard to navigate quickly, and press Enter to select.",
    preferredPlacement: "left"
  },
  {
    targetClass: "player-step",
    title: "Live Video Feed",
    description: "Your main monitoring screen. If a stream fails, use the console tools directly beneath this screen to automatically fetch a working backup channel.",
    preferredPlacement: "right"
  }
];

const TUTORIAL_STORAGE_KEY = "deck_tutorial_completed_v8_final";

export default function App() {
  const [streams, setStreams] = useState<StreamChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  
  // Tutorial States
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

  // Intelligent 4-directional alignment system with viewport collision protection
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

      // Strict Containment
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

  // Scroll logic
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

  // Window resize listeners
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

  // Load streams on startup
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
        throw new Error("Invalid API response format");
      }
    } catch (err: any) {
      console.error("Error fetching streams:", err);
      setError("Failed to boot up stream satellite router. Reconnecting...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  // CRITICAL FIX: Trigger tutorial ONLY after app completes loading and streams are present
  useEffect(() => {
    if (!loading && streams.length > 0) {
      const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!completed) {
        const timer = setTimeout(() => {
          setRunTutorial(true);
        }, 800); // Small delay post-load to let UI transitions finish rendering
        return () => clearTimeout(timer);
      }
    }
  }, [loading, streams]);

  // Stats
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
      console.error("Failed reporting broken link:", err);
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
    setTimeout(() => {
      const playerElement = document.getElementById("live-player-section");
      if (playerElement) {
        playerElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }, []);

  // Background Sync
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
        console.error("Error background-syncing streams:", err);
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
        ? "ring-4 ring-indigo-600 ring-offset-4 ring-offset-[#faf9f6] z-40 relative scale-[1.002] transition-all duration-300 shadow-xl"
        : "ring-4 ring-indigo-500 ring-offset-4 ring-offset-[#0d0e12] z-40 relative scale-[1.002] transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.3)]";
    }
    return "opacity-30 transition-all duration-300 pointer-events-none";
  };

  // 1. FULL LOADING SYSTEM (Replaces partial flashes of UI with an explicit status deck)
  if (loading && streams.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-mono ${
        theme === "light" ? "bg-[#faf9f6] text-zinc-900" : "bg-[#0d0e12] text-neutral-100"
      }`}>
        <div className="flex flex-col items-center max-w-sm w-full px-6 text-center">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-indigo-500 border-r-transparent animate-spin rounded-full" />
            <Globe className="w-6 h-6 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
          </div>

          <div className="space-y-2 w-full">
            <h1 className="text-sm font-black uppercase tracking-widest text-indigo-500">
              INITIALIZING DECK COUPLING
            </h1>
            
            {/* Contextual Status Subtitle */}
            <p className={`text-[10px] tracking-wide uppercase leading-relaxed ${
              theme === "light" ? "text-zinc-500" : "text-neutral-400"
            }`}>
              Binding virtual receiver satellite nodes, parsing global broadcast manifest, and compiling geographical registry.
            </p>
          </div>

          <div className={`mt-8 w-full border border-dashed p-3 text-[9px] uppercase ${
            theme === "light" ? "bg-zinc-100 border-zinc-300 text-zinc-500" : "bg-neutral-900/50 border-neutral-800 text-neutral-500"
          }`}>
            <span className="block animate-pulse">STATUS: ESTABLISHING CONNECTIVITY...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-300 selection:bg-emerald-500/20 selection:text-emerald-500 ${
      theme === "light" ? "bg-[#faf9f6] text-zinc-900" : "bg-[#0d0e12] text-neutral-100"
    }`}>
      
      {/* Header */}
      <header className={`border-b-2 sticky top-0 z-50 transition-all duration-300 font-sans ${
        theme === "light" ? "border-zinc-900 bg-[#faf9f6]" : "border-neutral-800 bg-[#0d0e12]"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 border-2 flex items-center justify-center relative rounded-none ${
              theme === "light" ? "bg-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]" : "bg-neutral-950 border-neutral-850 shadow-[2px_2px_0px_0px_rgba(99,102,241,0.5)]"
            }`}>
              <Globe className={`w-4 h-4 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="absolute top-0 left-0 text-[6px] font-mono text-zinc-400 dark:text-neutral-500 p-0.5">SYS</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black uppercase tracking-tight">World Channels</h1>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 border border-emerald-500/20">Live</span>
              </div>
              <p className={`text-[10px] font-mono uppercase tracking-wider ${theme === "light" ? "text-zinc-500" : "text-neutral-500"}`}>
                Global Channel Explorer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={handleRestartTutorial}
              className={`px-2.5 py-2 border-2 text-[10px] font-bold uppercase transition-all active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 rounded-none ${
                theme === "light"
                  ? "bg-white border-zinc-900 text-zinc-800 hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 shadow-[2px_2px_0px_0px_rgba(99,102,241,0.2)]"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Show Guide</span>
            </button>

            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`px-2.5 py-2 border-2 text-[10px] font-bold uppercase transition-all active:translate-y-0.5 cursor-pointer flex items-center gap-2 rounded-none ${
                theme === "light"
                  ? "bg-white border-zinc-900 text-zinc-800 hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 shadow-[2px_2px_0px_0px_rgba(99,102,241,0.2)]"
              }`}
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>{theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}</span>
            </button>

            <div className={`hidden md:flex items-center gap-3 px-3 py-2 border-2 text-[11px] rounded-none ${
              theme === "light" ? "bg-white border-zinc-900 text-zinc-600 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]" : "bg-neutral-950 border-neutral-800 text-neutral-400 shadow-[2px_2px_0px_0px_rgba(99,102,241,0.2)]"
            }`}>
              <span>FEEDS: <b className={theme === "light" ? "text-zinc-900" : "text-neutral-100"}>{stats.total}</b></span>
              <div className={`h-3 w-px ${theme === "light" ? "bg-zinc-200" : "bg-neutral-800"}`} />
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5 rounded-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-none h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span>LIVE: <b className="text-emerald-600 dark:text-emerald-400">{stats.online}</b></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-6 md:py-8 flex flex-col gap-6 z-10 font-sans">
        
        <div className={`p-3 border-2 text-[11px] font-mono tracking-tight rounded-none ${
          theme === "light" ? "bg-amber-100 border-zinc-900 text-amber-950" : "bg-[#1c140d] border-neutral-800 text-amber-400"
        }`}>
          <div className="flex items-center gap-2.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
            <p className="uppercase">
              Map locations depend on broadcast satellite coordinates. If feeds miss, 
              <button onClick={() => window.location.reload()} className="mx-1 underline font-bold cursor-pointer">REFRESH SYSTEM</button>.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/5 border-2 border-rose-500/30 p-4 flex items-center justify-between gap-4 text-xs font-mono text-rose-600 dark:text-rose-400 rounded-none">
            <span className="font-bold">[LINK_FAILURE]: {error}</span>
            <button onClick={fetchStreams} className="bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/30 px-3 py-1.5 uppercase font-bold text-[10px] rounded-none">Retry</button>
          </div>
        )}

        <>
          {/* World Map */}
          <section className={`w-full world-map-step ${getSpotlightClass("world-map-step")}`}>
            <WorldMap
              streams={streams}
              selectedCategory={selectedCategory}
              onSelectChannel={handleSelectChannel}
              activeChannel={selectedChannel}
              theme={theme}
            />
          </section>

          {/* Video Player & Registry */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Live Player */}
            <div id="live-player-section" className={`lg:col-span-8 flex flex-col gap-4 scroll-mt-24 player-step ${getSpotlightClass("player-step")}`}>
              <div className="flex items-end justify-between pb-1.5 border-b-2 border-zinc-900 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Tv className={`w-3.5 h-3.5 ${theme === "light" ? "text-zinc-800" : "text-neutral-400"}`} />
                  <h2 className="text-xs font-black uppercase">Live Broadcast Monitor</h2>
                </div>
              </div>

              <VideoPlayer
                channel={selectedChannel}
                onReportBroken={handleReportBroken}
                onSelectBackup={handleSelectBackup}
                theme={theme}
              />
            </div>

            {/* Sidebar Channels */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className={`search-bar-step category-filter-step channel-list-step ${getSpotlightClass(currentStep === 1 ? "search-bar-step" : currentStep === 2 ? "category-filter-step" : "channel-list-step")}`}>
                <ChannelList
                  streams={streams}
                  selectedCategory={selectedCategory}
                  onChangeCategory={(cat) => setSelectedCategory(cat)}
                  selectedChannel={selectedChannel}
                  onSelectChannel={handleSelectChannel}
                  theme={theme}
                />
              </div>
            </div>
          </section>
        </>
      </main>

      {/* FLOATING CONTEXTUAL POPUP */}
      <AnimatePresence>
        {runTutorial && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
            <div className="fixed inset-0 pointer-events-auto bg-black/45 backdrop-blur-[1px] z-40" onClick={handleSkipTutorial} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute",
                top: `${tooltipCoords.top}px`,
                left: `${tooltipCoords.left}px`,
              }}
              className={`w-[320px] pointer-events-auto border-2 p-5 shadow-2xl z-50 rounded-lg font-sans transition-all duration-150 ${
                theme === "light"
                  ? "bg-white border-zinc-950 text-zinc-900 shadow-[4px_4px_12px_rgba(0,0,0,0.15)]"
                  : "bg-[#111218] border-indigo-500 text-neutral-100 shadow-[0_4px_20px_rgba(99,102,241,0.25)]"
              }`}
            >
              {/* Dynamic Arrow */}
              {!(TUTORIAL_STEPS[currentStep].overlap) && (
                <div
                  style={{
                    left: tooltipCoords.placement === "top" || tooltipCoords.placement === "bottom" ? `${tooltipCoords.arrowLeft}px` : undefined,
                    top: tooltipCoords.placement === "left" || tooltipCoords.placement === "right" ? `${tooltipCoords.arrowTop}px` : undefined,
                    transform: (tooltipCoords.placement === "left" || tooltipCoords.placement === "right") ? "translateY(-50%) rotate(45deg)" : "translateX(-50%) rotate(45deg)",
                  }}
                  className={`absolute w-3.5 h-3.5 transition-all duration-300 ${
                    tooltipCoords.placement === "bottom" ? "-top-[8px] border-t-2 border-l-2" :
                    tooltipCoords.placement === "top" ? "-bottom-[8px] border-b-2 border-r-2" :
                    tooltipCoords.placement === "right" ? "-left-[8px] border-b-2 border-l-2" :
                    "-right-[8px] border-t-2 border-r-2"
                  } ${
                    theme === "light"
                      ? "bg-white border-zinc-950"
                      : "bg-[#111218] border-indigo-500"
                  }`}
                />
              )}

              {/* Close Button */}
              <button 
                onClick={handleSkipTutorial}
                className="absolute top-3 right-3 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Dismiss Guide"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-500 dark:text-indigo-400 uppercase">
                  Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                </span>
              </div>

              <h4 className="text-sm font-bold tracking-tight mb-1 text-zinc-900 dark:text-white uppercase">
                {TUTORIAL_STEPS[currentStep].title}
              </h4>
              
              <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-neutral-400 mb-4 font-normal">
                {TUTORIAL_STEPS[currentStep].description}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-neutral-800">
                <button
                  onClick={handleSkipTutorial}
                  className="text-[11px] font-mono text-zinc-400 hover:text-rose-500 transition-colors uppercase font-semibold cursor-pointer"
                >
                  Skip
                </button>
                
                <button
                  onClick={handleNextTutorial}
                  className={`px-3 py-1.5 text-[11px] font-sans font-bold tracking-wide flex items-center gap-1 transition-all active:translate-y-0.5 rounded-md cursor-pointer ${
                    theme === "light"
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "bg-indigo-600 text-white hover:bg-indigo-500"
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