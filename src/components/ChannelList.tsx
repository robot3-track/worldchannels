import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Tv,
  Radio,
  Globe,
  Award,
  BookOpen,
  SlidersHorizontal,
  ArrowRight,
  Filter,
  Activity,
  Star,
  History
} from "lucide-react";
import { StreamChannel, CategoryFilter, CountryFilter } from "../types";

interface ChannelListProps {
  streams: StreamChannel[];
  selectedCategory: CategoryFilter;
  onChangeCategory: (category: CategoryFilter) => void;
  selectedChannel: StreamChannel | null;
  onSelectChannel: (channel: StreamChannel) => void;
  theme: "light" | "dark";
  // 🌟 Global Save to Deck bookmark states
  bookmarkedIds: string[];
  onToggleBookmark: (channelId: string) => void;
}

export default function ChannelList({
  streams,
  selectedCategory,
  onChangeCategory,
  selectedChannel,
  onSelectChannel,
  theme,
  bookmarkedIds,
  onToggleBookmark
}: ChannelListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState<CountryFilter | "all">("all");
  const [visibleLimit, setVisibleLimit] = useState(100);

  // Keyboard navigation cursor tracker
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const channelListContainerRef = useRef<HTMLDivElement>(null);

  // --- Local Storage State Hooks (We only keep history locally here) ---
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stream_history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Sync History to LocalStorage
  useEffect(() => {
    localStorage.setItem("stream_history", JSON.stringify(history));
  }, [history]);

  // Track History when a channel is selected
  useEffect(() => {
    if (selectedChannel) {
      setHistory((prev) => {
        const filtered = prev.filter((id) => id !== selectedChannel.id);
        return [selectedChannel.id, ...filtered].slice(0, 10);
      });
    }
  }, [selectedChannel]);

  // Reset page pagination bounds back to default when sorting or search criteria alter
  useEffect(() => {
    setVisibleLimit(100);
    setFocusedIndex(-1); // Reset key selection when filter changes
  }, [searchTerm, selectedCategory, countryFilter]);

  // Updated tab categories list to render our new "Favorites" (Saved Deck) second[cite: 2]
  const categories: { value: CategoryFilter; label: string; icon: any }[] = [
    { value: "all", label: "All Feeds", icon: Globe },
    { value: "favorites", label: "Saved Deck", icon: Star }, // 🌟 Placed second directly below "all"
    { value: "world cup", label: "World Cup", icon: Award },
    { value: "general", label: "General TV", icon: Tv },
    { value: "sports", label: "Sports Live", icon: Award },
    { value: "news", label: "World News", icon: Radio },
    { value: "science", label: "Documentary", icon: BookOpen },
    { value: "freetv", label: "Global TV", icon: Tv },
    { value: "country", label: "Local Broadcasters", icon: SlidersHorizontal }
  ];

  const processedStreams = useMemo(() => {
    const filtered = streams.filter((stream) => {
      // Handle the global Category Filter logic here inside search filtering
      const matchCategory =
        selectedCategory === "all" ||
        (selectedCategory === "favorites"
          ? bookmarkedIds.includes(stream.id)
          : stream.category === selectedCategory);
      
      const matchCountry = countryFilter === "all" || stream.country === countryFilter;
      
      const matchSearch =
        stream.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchCategory && matchCountry && matchSearch;
    });

    return [...filtered].sort((a, b) => {
      const aBookmarked = bookmarkedIds.includes(a.id) ? 1 : 0;
      const bBookmarked = bookmarkedIds.includes(b.id) ? 1 : 0;
      if (aBookmarked !== bBookmarked) {
        return bBookmarked - aBookmarked;
      }

      const aHistoryIdx = history.indexOf(a.id);
      const bHistoryIdx = history.indexOf(b.id);
      const aHasHistory = aHistoryIdx !== -1;
      const bHasHistory = bHistoryIdx !== -1;

      if (aHasHistory && bHasHistory) {
        return aHistoryIdx - bHistoryIdx;
      }
      if (aHasHistory !== bHasHistory) {
        return aHasHistory ? -1 : 1;
      }

      const weightA = a.status === "online" ? 0 : a.status === "unstable" ? 1 : 2;
      const weightB = b.status === "online" ? 0 : b.status === "unstable" ? 1 : 2;
      return weightA - weightB;
    });
  }, [streams, selectedCategory, countryFilter, searchTerm, bookmarkedIds, history]);

  const getCategoryCount = (catValue: CategoryFilter) => {
    if (catValue === "all") return streams.length;
    if (catValue === "favorites") return bookmarkedIds.length;
    return streams.filter(s => s.category === catValue).length;
  };

  // --- Keyboard Navigation Global Event Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Focus Search Box on "/" Key
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // 2. Escape to blur and reset keyboard selection focus
      if (e.key === "Escape") {
        searchInputRef.current?.blur();
        setFocusedIndex(-1);
        return;
      }

      // Check contextual state
      const limit = Math.min(processedStreams.length, visibleLimit);

      // 3. Arrow down to navigate lists
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const nextIdx = prev + 1;
          const targetIdx = nextIdx < limit ? nextIdx : prev;
          
          // Smooth scroll container to keep keyboard selection visible
          const activeEl = channelListContainerRef.current?.children[targetIdx + 1] as HTMLElement;
          if (activeEl) {
            activeEl.scrollIntoView({ block: "nearest" });
          }
          return targetIdx;
        });
      }

      // 4. Arrow up to navigate lists
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const nextIdx = prev - 1;
          const targetIdx = nextIdx >= 0 ? nextIdx : prev;

          const activeEl = channelListContainerRef.current?.children[targetIdx + 1] as HTMLElement;
          if (activeEl) {
            activeEl.scrollIntoView({ block: "nearest" });
          }
          return targetIdx;
        });
      }

      // 5. Enter to select currently highlighted channel
      if (e.key === "Enter") {
        const isTyping = document.activeElement === searchInputRef.current;
        
        if (focusedIndex >= 0 && focusedIndex < limit) {
          e.preventDefault();
          onSelectChannel(processedStreams[focusedIndex]);
        } else if (isTyping && processedStreams.length > 0) {
          e.preventDefault();
          onSelectChannel(processedStreams[0]);
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [processedStreams, focusedIndex, visibleLimit, onSelectChannel]);

  const countriesList: { code: CountryFilter | "all"; name: string }[] = [
    { code: "all", name: "All Regions" }, { code: "US", name: "United States" },
    { code: "UK", name: "United Kingdom" }, { code: "AU", name: "Australia" },
    { code: "CA", name: "Canada" }, { code: "FR", name: "France" },
    { code: "DE", name: "Germany" }, { code: "BR", name: "Brazil" },
    { code: "JP", name: "Japan" }, { code: "TR", name: "Turkey" },
    { code: "ID", name: "Indonesia" }, { code: "CN", name: "China" },
    { code: "TW", name: "Taiwan" }, { code: "KR", name: "South Korea" },
    { code: "ES", name: "Spain" }, { code: "RU", name: "Russia" },
    { code: "LB", name: "Lebanon" }, { code: "AF", name: "Afghanistan" },
    { code: "VN", name: "Vietnam" }, { code: "KP", name: "North Korea" },
    { code: "IN", name: "India" }, { code: "SA", name: "Saudi Arabia" },
    { code: "MX", name: "Mexico" }, { code: "EG", name: "Egypt" },
    { code: "IT", name: "Italy" }, { code: "SG", name: "Singapore" },
    { code: "HK", name: "Hong Kong" }, { code: "IR", name: "Iran" }, { code: "BH", name: "Bahrain" },
    { code: "NG", name: "Nigeria" }, { code: "RS", name: "Serbia" }, { code: "UY", name: "Uruguay" },
    { code: "LC", name: "Carribean" }
  ];

  return (
    <div className={`border p-6 flex flex-col h-[650px] relative transition-all duration-300 font-sans ${
      theme === "light"
        ? "bg-[#faf9f6] border-zinc-300/80 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]"
        : "bg-[#0d0e12] border-neutral-800 shadow-[4px_4px_0px_0px_rgba(99,102,241,0.2)]"
    }`}>
      
      {/* Structural Header */}
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex items-end justify-between pb-2 border-b-2 border-dashed border-zinc-300 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-none ${theme === "light" ? "bg-zinc-900 text-white" : "bg-neutral-800 text-indigo-400"}`}>
              <Filter className="w-3.5 h-3.5" />
            </div>
            <h3 className={`text-xs font-black tracking-tight uppercase ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>
              Live Channel/Broadcast List
            </h3>
          </div>
          <span className={`text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded-none ${
            theme === "light" ? "bg-zinc-200 text-zinc-700" : "bg-neutral-900 text-neutral-400"
          }`}>
            REC: {processedStreams.length} FEEDS
          </span>
        </div>

        {/* Tactical Search Box */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className={`h-4 w-4 ${theme === "light" ? "text-zinc-500" : "text-neutral-500"}`} />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            className={`w-full border-2 text-xs transition-all duration-150 rounded-none pl-9 pr-12 py-2.5 font-medium ${
              theme === "light"
                ? "bg-white border-zinc-900 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-zinc-50"
                : "bg-neutral-950 border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
            }`}
            placeholder="TYPE CHANNEL NAME, TAG, SOURCE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Tactical terminal indicator for slash hotkey */}
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold opacity-30 select-none pointer-events-none px-1 border border-current rounded-sm">
            /
          </span>
        </div>
      </div>

      {/* Grid-style Tab Matrix */}
      <div className="mb-5">
        <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 font-mono ${
          theme === "light" ? "text-zinc-500" : "text-neutral-500"
        }`}>
          CATEGORY SELECT
        </span>
        <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => onChangeCategory(cat.value)}
                className={`flex items-center justify-between px-2.5 py-1.5 text-left text-xs border rounded-none transition-all duration-100 font-medium ${
                  isSelected
                    ? theme === "light"
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-indigo-600 border-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
                    : theme === "light"
                    ? "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
                    : "bg-neutral-950 border-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                  <span className="truncate text-[11px] font-bold uppercase tracking-tight">{cat.label}</span>
                </div>
                <span className={`text-[9px] font-mono px-1 rounded-none ml-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-neutral-900 text-zinc-500'}`}>
                  {getCategoryCount(cat.value)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimalist Regional Dropdown */}
      <div className="mb-5">
        <span className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 font-mono ${
          theme === "light" ? "text-zinc-500" : "text-neutral-500"
        }`}>
          REGION FREQUENCY
        </span>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value as CountryFilter | "all")}
          className={`w-full border px-3 py-2 text-xs transition-all rounded-none font-mono tracking-tight cursor-pointer ${
            theme === "light"
              ? "bg-white border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900"
              : "bg-neutral-950 border-neutral-900 text-neutral-300 focus:outline-none focus:border-indigo-500"
          }`}
        >
          {countriesList.map((country) => (
            <option
              key={country.code}
              value={country.code}
              className={theme === "light" ? "bg-white text-zinc-900" : "bg-neutral-950 text-neutral-200"}
            >
              {country.code === "all" ? "GLOBAL BROADCASTS" : `[${country.code}] ${country.name.toUpperCase()}`}
            </option>
          ))}
        </select>
      </div>

      {/* Broadcast Feed Rows */}
      <div 
        ref={channelListContainerRef}
        className="flex-1 overflow-y-auto pr-1 space-y-1 no-scrollbar scroll-smooth"
      >
        <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 dark:text-neutral-600 px-1 mb-1 font-mono uppercase tracking-wider">
          <span>Station matches</span>
          <span>Sig</span>
        </div>

        {processedStreams.length === 0 ? (
          <div className={`text-center py-12 border-2 border-dashed ${
            theme === "light" ? "bg-zinc-100/50 border-zinc-300" : "bg-neutral-950/40 border-neutral-800"
          }`}>
            <Activity className="w-5 h-5 text-zinc-400 mx-auto mb-2 animate-pulse" />
            <p className={`text-xs font-bold font-mono uppercase tracking-wide ${theme === "light" ? "text-zinc-700" : "text-neutral-400"}`}>NO SIGNAL DETECTED</p>
            <p className={`text-[10px] mt-1 max-w-[200px] mx-auto leading-relaxed ${
              theme === "light" ? "text-zinc-400" : "text-neutral-600"
            }`}>
              Check keywords or broaden frequency criteria.
            </p>
          </div>
        ) : (
          <>
            {processedStreams.slice(0, visibleLimit).map((stream, idx) => {
              const isSelected = selectedChannel?.id === stream.id;
              const isFocused = focusedIndex === idx;
              const isBookmarked = bookmarkedIds.includes(stream.id);
              const isRecentlyPlayed = history.includes(stream.id) && !isBookmarked;

              return (
                <button
                  key={`${stream.id}-${idx}`}
                  onClick={() => {
                    onSelectChannel(stream);
                    setFocusedIndex(idx);
                  }}
                  className={`w-full text-left flex items-center justify-between p-2 border rounded-none transition-all duration-150 group relative ${
                    isSelected
                      ? theme === "light"
                        ? "bg-white border-zinc-900 text-zinc-900 translate-x-1"
                        : "bg-neutral-950 border-indigo-500 text-neutral-100 translate-x-1"
                      : isFocused
                      ? theme === "light"
                        ? "bg-zinc-100 border-zinc-500 text-zinc-900 translate-x-0.5"
                        : "bg-neutral-900/60 border-indigo-700 text-neutral-200 translate-x-0.5"
                      : theme === "light"
                      ? "bg-white border-zinc-200/80 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-400"
                      : "bg-neutral-950/40 border-neutral-900 text-neutral-400 hover:bg-neutral-950 hover:border-neutral-700 hover:text-neutral-200"
                  }`}
                >
                  {/* Left edge keyboard cursor block indicator */}
                  {isFocused && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                  )}

                  <div className="flex items-center gap-3 truncate pr-2 pl-1.5">
                    {/* Television Box Frame */}
                    <div className={`w-7 h-7 overflow-hidden border rounded-none flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                      theme === "light" ? "bg-zinc-100 border-zinc-300" : "bg-neutral-900 border-neutral-800"
                    }`}>
                      {stream.logo ? (
                        <img
                          src={stream.logo}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "";
                          }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Tv className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </div>

                    <div className="truncate flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 truncate">
                        {isBookmarked && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                        {isRecentlyPlayed && (
                          <History className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                        )}
                        <span className={`text-xs font-bold tracking-tight truncate ${
                          isSelected
                            ? "text-zinc-900 dark:text-indigo-400"
                            : theme === "light"
                            ? "text-zinc-900"
                            : "text-neutral-300"
                        }`}>
                          {stream.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 font-mono font-medium">
                        <span className="uppercase tracking-tight">{stream.category}</span>
                        <span>//</span>
                        <span className="font-bold text-zinc-500 dark:text-neutral-500">{stream.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {/* Dynamic Bookmark Hover Trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(stream.id);
                      }}
                      className={`p-1 transition-colors ${
                        isBookmarked 
                          ? "text-amber-500 hover:text-amber-600" 
                          : "text-zinc-300 dark:text-neutral-800 hover:text-amber-500 dark:hover:text-amber-500"
                      }`}
                      title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                    >
                      <Star className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-500" : ""}`} />
                    </button>

                    {/* Technical Live Status Bar */}
                    <div className="flex items-center gap-1 font-mono text-[9px] font-bold tracking-tighter">
                      <span className={
                        stream.status === "online" ? "text-emerald-500" : stream.status === "unstable" ? "text-amber-500" : "text-rose-500"
                      }>
                        ●
                      </span>
                      <span className="text-[8px] opacity-40 group-hover:opacity-100 transition-opacity">
                        {(stream.status || "OFFLINE").toUpperCase()}
                      </span>
                    </div>
                    
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ${
                      isSelected
                        ? "text-zinc-900 dark:text-indigo-400"
                        : "text-zinc-300 dark:text-neutral-800"
                    }`} />
                  </div>
                </button>
              );
            })}

            {/* Pagination Control Node Trigger */}
            {processedStreams.length > visibleLimit && (
              <button
                onClick={() => setVisibleLimit((prev) => prev + 100)}
                className={`w-full py-2.5 mt-2 font-mono text-[10px] font-bold uppercase tracking-wider border border-dashed rounded-none transition-all duration-150 text-center
                  ${theme === "light" 
                    ? "bg-zinc-50 border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900" 
                    : "bg-neutral-900/20 border-neutral-800 text-neutral-500 hover:bg-neutral-900/60 hover:text-neutral-200"
                  }`}
              >
                Show More
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}