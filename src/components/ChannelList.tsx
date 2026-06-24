import { useState, useMemo } from "react";
import {
  Search,
  Tv,
  Radio,
  Globe,
  Award,
  BookOpen,
  SlidersHorizontal,
  ChevronRight,
  Filter
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

  // Countries dropdown listing
  const countriesList: { code: CountryFilter | "all"; name: string }[] = [
    { code: "all", name: "All Regions" },
    { code: "US", name: "United States" },
    { code: "UK", name: "United Kingdom" },
    { code: "AU", name: "Australia" },
    { code: "CA", name: "Canada" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "BR", name: "Brazil" },
    { code: "JP", name: "Japan" },
    { code: "TR", name: "Turkey" },
    { code: "ID", name: "Indonesia" },
    { code: "CN", name: "China" },
    { code: "TW", name: "Taiwan" },
    { code: "KR", name: "South Korea" },
    { code: "ES", name: "Spain" },
    { code: "RU", name: "Russia" },
    { code: "LB", name: "Lebanon" },
    { code: "AF", name: "Afghanistan" },
    { code: "VN", name: "Vietnam" },
    { code: "KP", name: "North Korea" },
    { code: "IN", name: "India" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "MX", name: "Mexico" },
    { code: "EG", name: "Egypt" },
    { code: "IT", name: "Italy" },
    { code: "SG", name: "Singapore" },
    { code: "HK", name: "Hong Kong" }
  ];

  return (
    <div className={`border rounded-3xl p-5 flex flex-col h-[650px] shadow-xs relative overflow-hidden transition-all ${
      theme === "light"
        ? "bg-white border-slate-200"
        : "bg-slate-950 border-slate-900"
    }`}>
      {/* Header & Search */}
      <div className="mb-5 flex flex-col gap-4">
        <div className={`flex items-center justify-between pb-3 border-b ${theme === "light" ? "border-slate-100" : "border-slate-900"}`}>
          <div className="flex items-center gap-2">
            <Filter className={`w-4 h-4 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`} />
            <h3 className={`text-sm font-semibold ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>
              Channel Directory
            </h3>
          </div>
          <span className={`text-[11px] font-sans font-medium ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
            {processedStreams.length} available
          </span>
        </div>

        {/* Input search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className={`h-4 w-4 ${theme === "light" ? "text-slate-400" : "text-slate-500"}`} />
          </span>
          <input
            type="text"
            className={`w-full border rounded-2xl pl-9 pr-4 py-2 text-xs transition-all ${
              theme === "light"
                ? "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-450 focus:ring-1 focus:ring-slate-450"
                : "bg-slate-900 border-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
            }`}
            placeholder="Search stream name, tags, source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-4">
        <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-2.5 font-sans ${
          theme === "light" ? "text-slate-500" : "text-slate-400"
        }`}>
          Filter by Type
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => onChangeCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs transition-all border ${
                  isSelected
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : theme === "light"
                    ? "bg-slate-50 border-slate-100 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    : "bg-slate-900/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Region Dropdown */}
      <div className="mb-5">
        <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-2.5 font-sans ${
          theme === "light" ? "text-slate-500" : "text-slate-400"
        }`}>
          Region Selection
        </span>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value as CountryFilter | "all")}
          className={`w-full border rounded-2xl px-3 py-2 text-xs transition-all font-sans cursor-pointer ${
            theme === "light"
              ? "bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:border-slate-400"
              : "bg-slate-900 border-slate-800/80 text-slate-200 focus:outline-none focus:border-slate-700"
          }`}
        >
          {countriesList.map((country) => (
            <option
              key={country.code}
              value={country.code}
              className={theme === "light" ? "bg-white text-slate-800" : "bg-slate-950 text-slate-200"}
            >
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* Channel Rows */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 no-scrollbar scroll-smooth">
        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 px-1 mb-1 font-sans uppercase tracking-wider">
          <span>Broadcast Feeds</span>
          <span>Status</span>
        </div>

        {processedStreams.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl border border-dashed ${
            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-900/10 border-slate-900"
          }`}>
            <Globe className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
            <p className={`text-xs font-semibold ${theme === "light" ? "text-slate-700" : "text-slate-450"}`}>No Channels Found</p>
            <p className={`text-[11px] mt-1 max-w-[200px] mx-auto leading-relaxed ${
              theme === "light" ? "text-slate-500" : "text-slate-550"
            }`}>
              Try adjusting your region filter or search terms.
            </p>
          </div>
        ) : (
          processedStreams.slice(0, 100).map((stream) => {
            const isSelected = selectedChannel?.id === stream.id;
            return (
              <button
                key={stream.id}
                onClick={() => onSelectChannel(stream)}
                className={`w-full text-left flex items-center justify-between p-2 rounded-2xl border transition-all ${
                  isSelected
                    ? theme === "light"
                      ? "bg-slate-50 border-slate-300 text-slate-900 shadow-sm ring-1 ring-slate-300"
                      : "bg-slate-900 border-slate-800 text-slate-100 shadow-md ring-1 ring-slate-800"
                    : theme === "light"
                    ? "bg-white border-transparent text-slate-700 hover:bg-slate-50"
                    : "bg-slate-900/30 border-transparent text-slate-300 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <div className={`w-8 h-8 rounded-xl overflow-hidden border flex items-center justify-center flex-shrink-0 ${
                    theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800/80"
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
                      <Tv className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div className="truncate flex flex-col justify-center">
                    <span className={`text-xs font-medium truncate ${
                      isSelected
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : theme === "light"
                        ? "text-slate-800 font-medium"
                        : "text-slate-200"
                    }`}>
                      {stream.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-sans font-medium">
                      <span className="capitalize">{stream.category}</span>
                      <span>•</span>
                      <span className="uppercase">{stream.country}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      stream.status === "online"
                        ? "bg-emerald-500"
                        : stream.status === "unstable"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${
                    isSelected
                      ? "text-slate-500 translate-x-0.5"
                      : theme === "light"
                      ? "text-slate-300"
                      : "text-slate-600"
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