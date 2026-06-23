import { useEffect, useState, useMemo } from "react";
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
  const handleReportBroken = async (url: string) => {
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
  };

  // Switch to recommended backup stream
  const handleSelectBackup = (backupChannel: StreamChannel) => {
    // Inject or update state
    setStreams((prev) => {
      const exists = prev.some((s) => s.id === backupChannel.id);
      if (!exists) {
        return [backupChannel, ...prev];
      }
      return prev.map(s => s.id === backupChannel.id ? { ...s, status: "online" } : s);
    });
    
    setSelectedChannel(backupChannel);
  };

  // Select channel and scroll down smoothly to the Live Player
  const handleSelectChannel = (channel: StreamChannel) => {
    setSelectedChannel(channel);
    setTimeout(() => {
      const playerElement = document.getElementById("live-player-section");
      if (playerElement) {
        playerElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

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

      {/* Main Top Header */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-50 transition-all duration-300 ${
        theme === "light"
          ? "border-slate-200 bg-white/80"
          : "border-slate-900 bg-slate-950/80"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-md opacity-20 animate-pulse" />
              <div className={`w-10 h-10 border rounded-2xl flex items-center justify-center shadow-xs relative ${
                theme === "light" ? "bg-slate-100 border-slate-200" : "bg-slate-900 border-slate-800"
              }`}>
                <Globe className="w-5 h-5 text-emerald-500 animate-spin" style={{ animationDuration: '40s' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-md font-bold tracking-tight ${theme === "light" ? "text-slate-800" : "text-slate-100"}`}>
                  World Channels
                </h1>
                <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  LIVE
                </span>
              </div>
              <p className={`text-[10px] font-medium tracking-wide ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                Global Broadcast Explorer & Player
              </p>
            </div>
          </div>

          {/* Clean Modern Telemetry & Control Suite */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 text-xs">
            {/* Dark / Light Toggle */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                theme === "light"
                  ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
              }`}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Statistics and Refresh Controls */}
            <div className={`flex items-center gap-4 px-4 py-2 rounded-2xl border shadow-xs font-sans ${
              theme === "light"
                ? "bg-slate-100/55 border-slate-200 text-slate-600"
                : "bg-slate-900/60 border-slate-800/80 text-slate-400"
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${theme === "light" ? "bg-slate-400" : "bg-slate-500"}`} />
                <span className="font-medium">Streams: <strong className={theme === "light" ? "text-slate-800 font-semibold" : "text-slate-200 font-semibold"}>{stats.total}</strong></span>
              </div>
              <div className={`h-3.5 w-px ${theme === "light" ? "bg-slate-200" : "bg-slate-850"}`} />
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium">Active: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.online} online</strong></span>
              </div>
              <div className={`h-3.5 w-px ${theme === "light" ? "bg-slate-200" : "bg-slate-850"}`} />
              <button
                onClick={fetchStreams}
                disabled={loading}
                className={`transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 font-medium ${
                  theme === "light" ? "hover:text-emerald-600 text-slate-700" : "hover:text-emerald-400 text-slate-300"
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-6 md:py-8 flex flex-col gap-8 z-10">
        
        {/* Refresh Disclaimer */}
        <div className={`p-3 rounded-xl border flex items-center gap-3 text-[11px] font-medium transition-all ${
          theme === "light" 
            ? "bg-amber-50 border-amber-100 text-amber-700" 
            : "bg-amber-900/10 border-amber-900/30 text-amber-400"
        }`}>
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <p>
            Note: If you don't see many channels on the map, please 
            <button onClick={() => window.location.reload()} className="mx-1 underline hover:no-underline cursor-pointer">refresh the page</button> 
            to re-sync with the global broadcast satellites.
          </p>
        </div>

        {/* Connection Failure Display */}
        {error && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 text-sm text-rose-600 dark:text-rose-300">
            <div className="flex items-center gap-3">
              <CloudLightning className="w-5 h-5 text-rose-500 animate-bounce" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchStreams}
              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 font-semibold"
            >
              Retry Connection
            </button>
          </div>
        )}

        {loading && streams.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-t-2 border-emerald-500 border-r-2 border-transparent animate-spin" />
              <Globe className="w-8 h-8 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className={`text-md font-semibold ${theme === "light" ? "text-slate-700" : "text-slate-200"}`}>Connecting to global streams...</h3>
            <p className={`text-xs mt-1 max-w-xs mx-auto ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
              Fetching active channels, sports feeds, and parsing country playlists. Please wait...
            </p>
          </div>
        ) : (
          <>
            {/* 1. Real-time World Map - CENTER OF ATTENTION & PRIMARY SECTOR */}
            <section className="w-full">
              <WorldMap
                streams={streams}
                selectedCategory={selectedCategory}
                onSelectChannel={handleSelectChannel}
                activeChannel={selectedChannel}
                theme={theme}
              />
            </section>

            {/* 2. Secondary Row: Video Player & Sidebar Channel list */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Side: Advanced Streaming Deck */}
              <div id="live-player-section" className="lg:col-span-8 flex flex-col gap-5 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className={`w-4 h-4 ${theme === "light" ? "text-slate-600" : "text-slate-300"}`} />
                    <h2 className={`text-md font-bold tracking-tight ${theme === "light" ? "text-slate-700" : "text-slate-200"}`}>
                      Live Broadcast Player
                    </h2>
                  </div>
                  {selectedChannel && (
                    <div className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-sans font-semibold ${
                      theme === "light" ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-slate-900 border border-slate-800 text-slate-400"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Live Feed Deck</span>
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

        {/* Feature Explanatory Block */}
        <section className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 border-t pt-8 pb-4 ${
          theme === "light" ? "border-slate-200" : "border-slate-900"
        }`}>
          <div className={`border rounded-2xl p-5 flex gap-4 ${
            theme === "light" ? "bg-white border-slate-200" : "bg-slate-950/20 border-slate-900"
          }`}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === "light" ? "text-slate-700" : "text-slate-200"}`}>
                Automated Self-Healing
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed font-sans ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                We automatically detect when a stream is unavailable. If playback fails, our self-healing player immediately locates and suggests an alternative stable feed.
              </p>
            </div>
          </div>

          <div className={`border rounded-2xl p-5 flex gap-4 ${
            theme === "light" ? "bg-white border-slate-200" : "bg-slate-950/20 border-slate-900"
          }`}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Compass className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === "light" ? "text-slate-700" : "text-slate-200"}`}>
                Interactive Coordinates
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed font-sans ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                Explore channels mapped across the globe. We distribute multiple streams across countries to represent real cities, letting you explore regional broadcasting seamlessly.
              </p>
            </div>
          </div>

          <div className={`border rounded-2xl p-5 flex gap-4 ${
            theme === "light" ? "bg-white border-slate-200" : "bg-slate-950/20 border-slate-900"
          }`}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === "light" ? "text-slate-700" : "text-slate-200"}`}>
                Responsive Architecture
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed font-sans ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                World Channels scales dynamically across all window sizes, providing smooth navigation on widescreen desktop setups as well as touch-friendly tablet and mobile views.
              </p>
            </div>
          </div>
        </section>
        
        {/* Streaming Partners / Who Streams What */}
        <section className={`mt-8 border-t pt-8 pb-10 ${
          theme === "light" ? "border-slate-200" : "border-slate-900"
        }`}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="md:w-1/3">
              <h3 className={`text-sm font-bold tracking-tight mb-2 ${theme === "light" ? "text-slate-900" : "text-slate-100"}`}>
                2026 World Cup Global Broadcasters
              </h3>
              <p className={`text-xs leading-relaxed ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                Stay connected with the tournament through our integrated premium partners. We provide direct access to the most reliable sports feeds globally.
              </p>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
              <div>
                <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${theme === "light" ? "text-slate-400" : "text-slate-500"}`}>
                  World Cup 2026 Partners
                </h4>
                <ul className={`text-[11px] space-y-2 font-medium ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Arena Sport 1 Premium (Balkans)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Fox Sports 1 (United States)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    ColaTV (Premium Asia Feed)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    beIN SPORTS (Global Hub)
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${theme === "light" ? "text-slate-400" : "text-slate-500"}`}>
                  European Leagues
                </h4>
                <ul className={`text-[11px] space-y-2 font-medium ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    Sky Sports PL (Premier League)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    DAZN 1 Germany (Bundesliga)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    RTVE (La Liga Highlights)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    L'Equipe TV (Ligue 1 & More)
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${theme === "light" ? "text-slate-400" : "text-slate-500"}`}>
                  Regional Specialists
                </h4>
                <ul className={`text-[11px] space-y-2 font-medium ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    VTV5 (ASEAN Sports Coverage)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    Bahrain Sports 1 & 2 (ME Finals)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    NHK News (Pacific Highlights)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    KSA Sports (Arab Gulf Cup)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs z-10 relative transition-all ${
        theme === "light"
          ? "border-slate-200 bg-white text-slate-500"
          : "border-slate-900 bg-slate-950/80 text-slate-500"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} World Channels. All rights reserved.</span>
          <div className="flex gap-4 items-center">
            <span className={theme === "light" ? "text-slate-600" : "text-slate-400"}>All channels verified online</span>
            <span className="text-emerald-500 flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure Stream Connection
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
