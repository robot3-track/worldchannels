import { useState, useMemo } from "react";
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
  Activity
} from "lucide-react";
import { StreamChannel, CategoryFilter, CountryFilter } from "../types";

interface ChannelListProps {
  streams: StreamChannel[];
  selectedCategory: CategoryFilter;
  onChangeCategory: (category: CategoryFilter) => void;
  selectedChannel: StreamChannel | null;
  onSelectChannel: (channel: StreamChannel) => void;
  theme: "light" | "dark";
}

export default function ChannelList({
  streams,
  selectedCategory,
  onChangeCategory,
  selectedChannel,
  onSelectChannel,
  theme
}: ChannelListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState<CountryFilter | "all">("all");

  const categories: { value: CategoryFilter; label: string; icon: any }[] = [
    { value: "all", label: "All Feeds", icon: Globe },
    { value: "sports", label: "Sports Live", icon: Award },
    { value: "news", label: "World News", icon: Radio },
    { value: "science", label: "Documentary", icon: BookOpen },
    { value: "freetv", label: "Global TV", icon: Tv },
    { value: "country", label: "Local Broadcasters", icon: SlidersHorizontal }
  ];

  const processedStreams = useMemo(() => {
    const filtered = streams.filter((stream) => {
      const matchCategory = selectedCategory === "all" || stream.category === selectedCategory;
      const matchCountry = countryFilter === "all" || stream.country === countryFilter;
      const matchSearch =
        stream.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchCategory && matchCountry && matchSearch;
    });

    return [...filtered].sort((a, b) => {
      const weightA = a.status === "online" ? 0 : a.status === "unstable" ? 1 : 2;
      const weightB = b.status === "online" ? 0 : b.status === "unstable" ? 1 : 2;
      return weightA - weightB;
    });
  }, [streams, selectedCategory, countryFilter, searchTerm]);

  // Dynamic selector metadata counters
  const getCategoryCount = (catValue: CategoryFilter) => {
    return streams.filter(s => catValue === "all" || s.category === catValue).length;
  };

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
    { code: "HK", name: "Hong Kong" }
  ];

  return (
    <div className={`border p-6 flex flex-col h-[650px] relative transition-all duration-300 font-sans ${
      theme === "light"
        ? "bg-[#faf9f6] border-zinc-300/80 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]"
        : "bg-[#0d0e12] border-neutral-800 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]"
    }`}>
      
      {/* Structural Header */}
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex items-end justify-between pb-2 border-b-2 border-dashed border-zinc-300 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-sm ${theme === "light" ? "bg-zinc-900 text-white" : "bg-neutral-800 text-indigo-400"}`}>
              <Filter className="w-3.5 h-3.5" />
            </div>
            <h3 className={`text-xs font-black tracking-tight uppercase ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>
              Live Channel/Broadcast List
            </h3>
          </div>
          <span className={`text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded ${
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
            type="text"
            className={`w-full border-2 text-xs transition-all duration-150 rounded-none pl-9 pr-4 py-2.5 font-medium ${
              theme === "light"
                ? "bg-white border-zinc-900 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-zinc-50"
                : "bg-neutral-950 border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
            }`}
            placeholder="TYPE CHANNEL NAME, TAG, SOURCE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                className={`flex items-center justify-between px-2.5 py-1.5 text-left text-xs border transition-all duration-100 font-medium ${
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
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                  <span className="truncate text-[11px] font-bold uppercase tracking-tight">{cat.label}</span>
                </div>
                <span className={`text-[9px] font-mono px-1 rounded-sm ml-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-neutral-900 text-zinc-500'}`}>
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
          className={`w-full border px-3 py-2 text-xs transition-all font-mono tracking-tight cursor-pointer ${
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
      <div className="flex-1 overflow-y-auto pr-1 space-y-1 no-scrollbar scroll-smooth">
        <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 dark:text-neutral-600 px-1 mb-1 font-mono uppercase tracking-wider">
          <span>STATION MATCHES</span>
          <span>SIG METRICS</span>
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
          processedStreams.slice(0, 100).map((stream) => {
            const isSelected = selectedChannel?.id === stream.id;
            return (
              <button
                key={stream.id}
                onClick={() => onSelectChannel(stream)}
                className={`w-full text-left flex items-center justify-between p-2 border transition-all duration-150 group ${
                  isSelected
                    ? theme === "light"
                      ? "bg-white border-zinc-900 text-zinc-900 translate-x-1"
                      : "bg-neutral-950 border-indigo-500 text-neutral-100 translate-x-1"
                    : theme === "light"
                    ? "bg-white border-zinc-200/80 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-400"
                    : "bg-neutral-950/40 border-neutral-900 text-neutral-400 hover:bg-neutral-950 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  {/* Television Box Frame */}
                  <div className={`w-7 h-7 overflow-hidden border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
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
                    <span className={`text-xs font-bold tracking-tight truncate ${
                      isSelected
                        ? "text-zinc-900 dark:text-indigo-400"
                        : theme === "light"
                        ? "text-zinc-900"
                        : "text-neutral-300"
                    }`}>
                      {stream.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 font-mono font-medium">
                      <span className="uppercase tracking-tight">{stream.category}</span>
                      <span>//</span>
                      <span className="font-bold text-zinc-500 dark:text-neutral-500">{stream.country}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {/* Technical Live Status Bar */}
                  <div className="flex items-center gap-1 font-mono text-[9px] font-bold tracking-tighter">
                    <span className={
                      stream.status === "online" ? "text-emerald-500" : stream.status === "unstable" ? "text-amber-500" : "text-rose-500"
                    }>
                      ●
                    </span>
                    <span className="text-[8px] opacity-40 group-hover:opacity-100 transition-opacity">
                      {stream.status.toUpperCase()}
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
          })
        )}
      </div>
    </div>
  );
}