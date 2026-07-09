import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import {
  Globe,
  Radio,
  Tv,
  Compass,
  Award,
  BookOpen,
  Activity,
  Heart,
  RefreshCw,
  Info,
  SlidersHorizontal,
  CloudLightning,
  Sparkles,
  Zap,
  CheckCircle,
  HelpCircle,
  Wifi,
  Sun,
  Moon
} from "lucide-react";
import { StreamChannel, CategoryFilter } from "./types";
import WorldMap from "./components/WorldMap";
import VideoPlayer from "./components/VideoPlayer";
import ChannelList from "./components/ChannelList";

export default function App() {
  const [streams, setStreams] = useState<StreamChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedChannel, setSelectedChannel] = useState<StreamChannel | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    categoriesCount: { sports: 0, news: 0, science: 0, freetv: 0, country: 0 }
  });

  // Fetch streams from backend on mount
  const fetchStreams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/streams");
      const data = await res.json();
      
      if (data.success && data.streams) {
        setStreams(data.streams);
        
        // Auto-select first sports stream as a starter channel if none selected
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

  // Calculate real-time active statistics
  useEffect(() => {
    if (streams.length === 0) return;

    const online = streams.filter(s => s.status === "online").length;
    const catCount = { sports: 0, news: 0, science: 0, freetv: 0, country: 0 };
    
    streams.forEach(s => {
      if (s.category in catCount) {
        catCount[s.category]++;
      }
    });

    setStats({
      total: streams.length,
      online,
      categoriesCount: catCount
    });
  }, [streams]);

  // Handle reporting broken link & fetching backup hot-swap
  const handleReportBroken = useCallback(async (url: string) => {
    try {
      const res = await fetch("/api/report-broken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      // Update our local state to reflect offline status immediately
      setStreams((prev) =>
        prev.map((s) => (s.url === url ? { ...s, status: "offline" } : s))
      );

      // Also mark the currently selected channel as offline
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

  // Switch to recommended backup stream
  const handleSelectBackup = useCallback((backupChannel: StreamChannel) => {
    // Inject or update state
    setStreams((prev) => {
      const exists = prev.some((s) => s.id === backupChannel.id);
      if (!exists) {
        return [backupChannel, ...prev];
      }
      return prev.map(s => s.id === backupChannel.id ? { ...s, status: "online" } : s);
    });
    
    setSelectedChannel(backupChannel);
  }, []);

  // Select channel and scroll down smoothly to the Live Player
  const handleSelectChannel = useCallback((channel: StreamChannel) => {
    setSelectedChannel(channel);
    setTimeout(() => {
      const playerElement = document.getElementById("live-player-section");
      if (playerElement) {
        playerElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }, []);

  // Periodic background check: constantly sync status of ALL streams with the server
  // Adaptive polling: poll faster when stream catalog is still growing (initial bootstrap)
  useEffect(() => {
    let pollInterval = 10000;
    let lastCount = streams.length;
    
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

          // Optimize poll interval based on stability
          if (newCount >= 1000) {
            pollInterval = 60000; // Catalog is full, check once a minute
          } else if (newCount > lastCount) {
            pollInterval = 10000; // Still growing
          } else {
            pollInterval = 30000;
          }
          lastCount = newCount;
        }
      } catch (err) {
        console.error("Error background-syncing streams:", err);
      }
      
      // Schedule next poll
      setTimeout(syncAllStreams, pollInterval);
    };

    const initialTimeout = setTimeout(syncAllStreams, 2000);
    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-300 selection:bg-emerald-500/20 selection:text-emerald-500 ${
      theme === "light"
        ? "bg-slate-50 text-slate-800"
        : "bg-[#020617] text-slate-100"
    }`}>
      {/* Premium ambient gradient background */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
        theme === "light"
          ? "bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.02)_0%,transparent_50%)]"
          : "bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.03)_0%,transparent_50%)]"
      }`} />

      {/* Header / Top Navigation Bar */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-50 transition-all duration-300 font-sans ${
        theme === "light"
          ? "border-zinc-300/80 bg-[#faf9f6]/90"
          : "border-neutral-900 bg-[#0d0e12]/90"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand / Hardware Plate */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-none blur-md opacity-10 animate-pulse" />
              <div className={`w-9 h-9 border flex items-center justify-center relative rounded-none ${
                theme === "light" ? "bg-white border-zinc-300" : "bg-neutral-950 border-neutral-800"
              }`}>
                <Globe className={`w-4 h-4 text-indigo-500 ${loading ? 'animate-spin' : ''}`} style={!loading ? { animation: 'none' } : undefined} />
                <span className="absolute top-0 left-0 text-[6px] font-mono text-zinc-400 p-0.5 leading-none">SYS</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-sm font-black uppercase tracking-tight ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>
                  World Channels
                </h1>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 border border-emerald-500/20">
                  Live
                </span>
              </div>
              <p className={`text-[10px] font-mono uppercase tracking-wider ${theme === "light" ? "text-zinc-500" : "text-neutral-500"}`}>
                Global Channel Explorer
              </p>
            </div>
          </div>

          {/* Telemetry Control Rack */}
          <div className="flex items-center gap-2 text-xs font-mono">
            
            {/* System Mode Switch (Theme Toggle) */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`px-2.5 py-2 border text-[10px] font-bold uppercase transition-all active:scale-98 cursor-pointer flex items-center gap-2 ${
                theme === "light"
                  ? "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-400"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
              }`}
              title={theme === "light" ? "Switch to Dark Operations" : "Switch to Light Operations"}
            >
              {theme === "light" ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>SWITCH TO DARK MODE</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>SWITCH TO LIGHT MODE</span>
                </>
              )}
            </button>

            {/* Signal Metrics Block */}
            <div className={`flex items-center gap-3 px-3 py-2 border tracking-tight text-[11px] ${
              theme === "light"
                ? "bg-white border-zinc-300 text-zinc-600"
                : "bg-neutral-950 border-neutral-800 text-neutral-400"
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="font-bold">FEEDS: <span className={theme === "light" ? "text-zinc-900" : "text-neutral-100"}>{stats.total}</span></span>
              </div>
              
              <div className={`h-3 w-px ${theme === "light" ? "bg-zinc-200" : "bg-neutral-800"}`} />
              
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="font-bold">LIVE: <span className="text-emerald-600 dark:text-emerald-400">{stats.online}</span></span>
              </div>
              
              <div className={`h-3 w-px ${theme === "light" ? "bg-zinc-200" : "bg-neutral-800"}`} />
              
              {/* Tactical Action Triggers */}
              <button
                onClick={fetchStreams}
                disabled={loading}
                className={`transition-colors flex items-center gap-1 font-bold cursor-pointer disabled:opacity-40 ${
                  theme === "light" ? "hover:text-zinc-900 text-zinc-500" : "hover:text-neutral-200 text-neutral-500"
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
                <span className="uppercase text-[10px] tracking-wide">Sync</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container - Primary Operations Grid */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-6 md:py-8 flex flex-col gap-6 z-10 font-sans">
        
        {/* Hardware Status & Telemetry Sync Warning */}
        <div className={`p-3 border text-[11px] font-mono tracking-tight transition-all duration-150 ${
          theme === "light" 
            ? "bg-amber-500/10 border-amber-500/30 text-amber-900" 
            : "bg-amber-950/20 border-amber-900/40 text-amber-400"
        }`}>
          <div className="flex items-center gap-2.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
            <p className="uppercase font-medium">
              Notification: Map rendering relies on broadcast satellite coordinates. If channels are missing, 
              <button onClick={() => window.location.reload()} className="mx-1 underline hover:text-amber-600 font-bold cursor-pointer">REFRESH</button> 
              to reload broadcast data.
            </p>
          </div>
        </div>

        {/* Connection Failure Display */}
        {error && (
          <div className="bg-rose-500/5 border-2 border-rose-500/30 p-4 flex items-center justify-between gap-4 text-xs font-mono text-rose-600 dark:text-rose-400">
            <div className="flex items-center gap-3">
              <CloudLightning className="w-4 h-4 text-rose-500" />
              <span className="font-bold uppercase">[LINK_FAILURE]: {error}</span>
            </div>
            <button
              onClick={fetchStreams}
              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 px-3 py-2 text-[10px] font-bold uppercase transition-all active:scale-98"
            >
              Retry Connection
            </button>
          </div>
        )}

        {loading && streams.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center py-28 text-center font-mono">
            <div className="relative mb-6">
              <div className="w-12 h-12 border-2 border-indigo-500 border-r-transparent animate-spin" />
              <Globe className="w-5 h-5 text-indigo-500 absolute inset-0 m-auto" />
            </div>
            <h3 className={`text-xs font-black uppercase tracking-wider ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>
              Loading World Channels..
            </h3>
            <p className={`text-[11px] mt-1.5 max-w-xs mx-auto uppercase tracking-wide leading-relaxed ${theme === "light" ? "text-zinc-500" : "text-neutral-500"}`}>
              Opening packages, establishing satellite links, and syncing channel telemetry. Please wait while the system boots up.
            </p>
          </div>
        ) : (
          <>
            {/* 1. Real-time World Map - MAIN SCAN DECK */}
            <section className="w-full">
              <WorldMap
                streams={streams}
                selectedCategory={selectedCategory}
                onSelectChannel={handleSelectChannel}
                activeChannel={selectedChannel}
                theme={theme}
              />
            </section>

            {/* 2. Secondary Operations Row: Video Player & Selector Panel */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Side: Advanced Streaming Deck */}
              <div id="live-player-section" className="lg:col-span-8 flex flex-col gap-4 scroll-mt-24">
                <div className="flex items-end justify-between pb-1.5 border-b border-zinc-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Tv className={`w-3.5 h-3.5 ${theme === "light" ? "text-zinc-800" : "text-neutral-400"}`} />
                    <h2 className={`text-xs font-black uppercase tracking-tight ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>
                      Broadcast Monitoring Monitor
                    </h2>
                  </div>
                  {selectedChannel && (
                    <div className={`text-[9px] font-mono font-bold px-2 py-0.5 border flex items-center gap-1.5 ${
                      theme === "light" ? "bg-white border-zinc-300 text-zinc-700" : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    }`}>
                      <span className="w-1 h-1 bg-emerald-500 animate-pulse" />
                      <span className="uppercase tracking-wider">DECK_ENGAGED</span>
                    </div>
                  )}
                </div>

                <VideoPlayer
                  channel={selectedChannel}
                  onReportBroken={handleReportBroken}
                  onSelectBackup={handleSelectBackup}
                  theme={theme}
                />
              </div>

              {/* Right Side: Channel Database Sidebar */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <ChannelList
                  streams={streams}
                  selectedCategory={selectedCategory}
                  onChangeCategory={(cat) => setSelectedCategory(cat)}
                  selectedChannel={selectedChannel}
                  onSelectChannel={handleSelectChannel}
                  theme={theme}
                />
              </div>
            </section>
          </>
        )}

        {/* Feature Explanatory Block - System Diagnostic Overview */}
        <section className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t pt-6 pb-4 font-mono ${
          theme === "light" ? "border-zinc-300/80" : "border-neutral-900"
        }`}>
          
          <div className={`border p-5 flex flex-col gap-3 transition-all ${
            theme === "light" ? "bg-white border-zinc-200" : "bg-neutral-950/40 border-neutral-900"
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-6 h-6 border flex items-center justify-center ${theme === "light" ? "bg-zinc-100 border-zinc-300" : "bg-neutral-900 border-neutral-800"}`}>
                <Zap className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <h4 className={`text-[11px] font-black uppercase tracking-wider ${theme === "light" ? "text-zinc-900" : "text-neutral-200"}`}>
                01 - Autonomous Link Detection
              </h4>
            </div>
            <p className={`text-[11px] font-sans leading-relaxed font-medium ${theme === "light" ? "text-zinc-600" : "text-neutral-400"}`}>
              Autonomous detection trackers track connection failures. If upstream stream links collapse, fallback nodes route instantly to isolate backup feeds without dropping monitoring sessions.
            </p>
          </div>

          <div className={`border p-5 flex flex-col gap-3 transition-all ${
            theme === "light" ? "bg-white border-zinc-200" : "bg-neutral-950/40 border-neutral-900"
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-6 h-6 border flex items-center justify-center ${theme === "light" ? "bg-zinc-100 border-zinc-300" : "bg-neutral-900 border-neutral-800"}`}>
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <h4 className={`text-[11px] font-black uppercase tracking-wider ${theme === "light" ? "text-zinc-900" : "text-neutral-200"}`}>
                02 - Geographic Distribution Algorithms
              </h4>
            </div>
            <p className={`text-[11px] font-sans leading-relaxed font-medium ${theme === "light" ? "text-zinc-600" : "text-neutral-400"}`}>
              Geographical distribution algorithms map channel registries onto accurate world coordinates. Stream clusters are dynamically grouped across country regions for seamless telemetry tracking.
            </p>
          </div>

          <div className={`border p-5 flex flex-col gap-3 transition-all ${
            theme === "light" ? "bg-white border-zinc-200" : "bg-neutral-950/40 border-neutral-900"
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-6 h-6 border flex items-center justify-center ${theme === "light" ? "bg-zinc-100 border-zinc-300" : "bg-neutral-900 border-neutral-800"}`}>
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <h4 className={`text-[11px] font-black uppercase tracking-wider ${theme === "light" ? "text-zinc-900" : "text-neutral-200"}`}>
                03 - Matrix Scaling
              </h4>
            </div>
            <p className={`text-[11px] font-sans leading-relaxed font-medium ${theme === "light" ? "text-zinc-600" : "text-neutral-400"}`}>
              The tracking interface operates on modular breakgrids. Bounding parameters update fluidly, sustaining high-density dashboard layouts across theater projection layouts down to compact devices.
            </p>
          </div>
        </section>
        
        {/* Streaming Partners / Network Relay Routing Matrix */}
        <section className={`mt-8 border-t pt-6 pb-8 font-mono ${
          theme === "light" ? "border-zinc-300/80" : "border-neutral-900"
        }`}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="md:w-1/3">
              <h3 className={`text-xs font-black uppercase tracking-tight mb-2 ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>
                Featured: World Cup 2026 Broadcast Partners
              </h3>
              <p className={`text-[11px] font-sans leading-relaxed font-medium ${theme === "light" ? "text-zinc-500" : "text-neutral-400"}`}>
                Operational connections verified across tournament relays. Satellite streams link dynamically to upstream edge routes to handle priority sports delivery matrices.
              </p>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-[11px]">
              <div>
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 pb-1 border-b ${
                  theme === "light" ? "text-zinc-400 border-zinc-200" : "text-neutral-600 border-neutral-900"
                }`}>
                  Providers
                </h4>
                <ul className={`space-y-1.5 font-semibold ${theme === "light" ? "text-zinc-700" : "text-neutral-300"}`}>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>Antena Sports (Italy)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>Somoy TV (Bangladesh)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>CazeTV (Brazil)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>CT Sport (Czech)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>ColaTV (Premium Asia Feed)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>beIN SPORTS (France)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>Turkmenistan Sports (Turkmenistan)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>Setanta Sports (Georgia)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>TSN Sports (Canada)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>MTV3 (Finland)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>YLE2 TV (Finland)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>MonoMax TV (Thailand)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[9px] font-bold">●</span>
                    <span>DSports 2 HD (Argentina)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 pb-1 border-b ${
                  theme === "light" ? "text-zinc-400 border-zinc-200" : "text-neutral-600 border-neutral-900"
                }`}>
                  European League Providers
                </h4>
                <ul className={`space-y-1.5 font-semibold ${theme === "light" ? "text-zinc-700" : "text-neutral-300"}`}>
                  <li className="flex items-center gap-1.5">
                    <span className="text-indigo-500 text-[9px] font-bold">●</span>
                    <span>Sky Sports PL (Premier League)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-indigo-500 text-[9px] font-bold">●</span>
                    <span>DAZN 1 Germany (Bundesliga)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-indigo-500 text-[9px] font-bold">●</span>
                    <span>RTVE (La Liga Highlights)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-indigo-500 text-[9px] font-bold">●</span>
                    <span>L'Equipe TV (Ligue 1 & More)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 pb-1 border-b ${
                  theme === "light" ? "text-zinc-400 border-zinc-200" : "text-neutral-600 border-neutral-900"
                }`}>
                  Regional Sport Providers
                </h4>
                <ul className={`space-y-1.5 font-semibold ${theme === "light" ? "text-zinc-700" : "text-neutral-300"}`}>
                  <li className="flex items-center gap-1.5">
                    <span className="text-amber-500 text-[9px] font-bold">●</span>
                    <span>VTV5 (ASEAN Sports Coverage)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-amber-500 text-[9px] font-bold">●</span>
                    <span>Bahrain Sports 1 & 2 (ME Finals)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-amber-500 text-[9px] font-bold">●</span>
                    <span>NHK News (Pacific Highlights)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-amber-500 text-[9px] font-bold">●</span>
                    <span>KSA Sports (Arab Gulf Cup)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-xs z-10 relative transition-all font-mono tracking-tight ${
        theme === "light"
          ? "border-zinc-300/80 bg-[#faf9f6] text-zinc-600"
          : "border-neutral-900 bg-[#0d0e12] text-neutral-500"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left: Metadata Track */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
            <span className={`font-bold ${theme === "light" ? "text-zinc-900" : "text-neutral-300"}`}>
              World Channels
            </span>
            <span className="opacity-30 hidden sm:inline">|</span>
            <span>&copy; {new Date().getFullYear()}</span>
            <span>By Yohan Chang [MHS 2029]. We ensure that all channels are legitimate and legal. Any channels conflicting with copyright are taken down.</span>
          </div>

          {/* Right: Technical Diagnostic Metrics */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 text-[11px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className={theme === "light" ? "text-zinc-400" : "text-neutral-600"}>Current Signal:</span>
              <span className={theme === "light" ? "text-zinc-800" : "text-neutral-300"}>Live</span>
            </div>
            
            <div className={`px-2 py-0.5 border flex items-center gap-2 ${
              theme === "light" 
                ? "bg-white border-zinc-300 text-emerald-700" 
                : "bg-neutral-950 border-neutral-800 text-emerald-400"
            }`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold">Secure Browser</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}