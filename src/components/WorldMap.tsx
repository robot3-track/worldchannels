import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Search, Globe, Compass, Paintbrush } from "lucide-react";
import { StreamChannel } from "../types";

// Real-world cities distributed geographically across country boundaries
const countryCities: Record<string, { name: string; lat: number; lon: number }[]> = {
  US: [
    { name: "New York, NY", lat: 40.7128, lon: -74.0060 },
    { name: "Los Angeles, CA", lat: 34.0522, lon: -118.2437 },
    { name: "Chicago, IL", lat: 41.8781, lon: -87.6298 },
    { name: "Houston, TX", lat: 29.7604, lon: -95.3698 },
    { name: "Miami, FL", lat: 25.7617, lon: -80.1918 },
    { name: "Seattle, WA", lat: 47.6062, lon: -122.3321 },
    { name: "Denver, CO", lat: 39.7392, lon: -104.9903 },
    { name: "Atlanta, GA", lat: 33.7490, lon: -84.3880 },
    { name: "San Francisco, CA", lat: 37.7749, lon: -122.4194 },
    { name: "Boston, MA", lat: 42.3601, lon: -71.0589 },
    { name: "Dallas, TX", lat: 32.7767, lon: -96.7970 },
    { name: "Phoenix, AZ", lat: 33.4484, lon: -112.0740 }
  ],
  UK: [
    { name: "London, ENG", lat: 51.5074, lon: -0.1278 },
    { name: "Manchester, ENG", lat: 53.4808, lon: -2.2426 },
    { name: "Birmingham, ENG", lat: 52.4862, lon: -1.8904 },
    { name: "Glasgow, SCT", lat: 55.8642, lon: -4.2518 },
    { name: "Belfast, NIR", lat: 54.5973, lon: -5.9301 },
    { name: "Cardiff, WLS", lat: 51.4816, lon: -3.1791 },
    { name: "Edinburgh, SCT", lat: 55.9533, lon: -3.1883 },
    { name: "Leeds, ENG", lat: 53.8008, lon: -1.5491 },
    { name: "Bristol, ENG", lat: 51.4545, lon: -2.5879 },
    { name: "Newcastle, ENG", lat: 54.9783, lon: -1.6178 }
  ],
  AU: [
    { name: "Sydney, NSW", lat: -33.8688, lon: 151.2093 },
    { name: "Melbourne, VIC", lat: -37.8136, lon: 144.9631 },
    { name: "Brisbane, QLD", lat: -27.4705, lon: 153.0260 },
    { name: "Perth, WA", lat: -31.9505, lon: 115.8605 },
    { name: "Adelaide, SA", lat: -34.9285, lon: 138.6007 },
    { name: "Hobart, TAS", lat: -42.8821, lon: 147.3272 },
    { name: "Darwin, NT", lat: -12.4634, lon: 130.8456 },
    { name: "Canberra, ACT", lat: -35.2809, lon: 149.1300 }
  ],
  CA: [
    { name: "Toronto, ON", lat: 43.6532, lon: -79.3832 },
    { name: "Vancouver, BC", lat: 49.2827, lon: -123.1207 },
    { name: "Montreal, QC", lat: 45.5017, lon: -73.5673 },
    { name: "Calgary, AB", lat: 51.0447, lon: -114.0719 },
    { name: "Ottawa, ON", lat: 45.4215, lon: -75.6972 },
    { name: "Edmonton, AB", lat: 53.5461, lon: -113.4938 },
    { name: "Winnipeg, MB", lat: 49.8951, lon: -97.1384 },
    { name: "Halifax, NS", lat: 44.6488, lon: -63.5752 }
  ],
  FR: [
    { name: "Paris, IDF", lat: 48.8566, lon: 2.3522 },
    { name: "Marseille, PAC", lat: 43.2965, lon: 5.3698 },
    { name: "Lyon, ARA", lat: 45.7640, lon: 4.8357 },
    { name: "Toulouse, OCC", lat: 43.6047, lon: 1.4442 },
    { name: "Nice, PAC", lat: 43.7102, lon: 7.2620 },
    { name: "Nantes, PDL", lat: 47.2184, lon: -1.5536 },
    { name: "Strasbourg, GES", lat: 48.5734, lon: 7.7521 },
    { name: "Bordeaux, NAQ", lat: 44.8378, lon: -0.5792 },
    { name: "Lille, HDF", lat: 50.6292, lon: 3.0573 }
  ],
  DE: [
    { name: "Berlin", lat: 52.5200, lon: 13.4050 },
    { name: "Munich, BY", lat: 48.1351, lon: 11.5820 },
    { name: "Frankfurt, HE", lat: 50.1109, lon: 8.6821 },
    { name: "Hamburg", lat: 53.5511, lon: 9.9937 },
    { name: "Cologne, NW", lat: 50.9375, lon: 6.9603 },
    { name: "Stuttgart, BW", lat: 48.7758, lon: 9.1829 },
    { name: "Düsseldorf, NW", lat: 51.2271, lon: 6.7735 },
    { name: "Leipzig, SN", lat: 51.3397, lon: 12.3731 }
  ],
  BR: [
    { name: "São Paulo, SP", lat: -23.5505, lon: -46.6333 },
    { name: "Rio de Janeiro, RJ", lat: -22.9068, lon: -43.1729 },
    { name: "Brasília, DF", lat: -15.7938, lon: -47.8828 },
    { name: "Salvador, BA", lat: -12.9714, lon: -38.5014 },
    { name: "Fortaleza, CE", lat: -3.7319, lon: -38.5267 },
    { name: "Belo Horizonte, MG", lat: -19.9167, lon: -43.9345 },
    { name: "Manaus, AM", lat: -3.1190, lon: -60.0217 },
    { name: "Porto Alegre, RS", lat: -30.0346, lon: -51.2177 }
  ],
  JP: [
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Osaka", lat: 34.6937, lon: 135.5023 },
    { name: "Kyoto", lat: 35.0116, lon: 135.7681 },
    { name: "Sapporo, HKD", lat: 43.0618, lon: 141.3545 },
    { name: "Fukuoka", lat: 33.5902, lon: 130.4017 },
    { name: "Nagoya, AIC", lat: 35.1815, lon: 136.9066 },
    { name: "Hiroshima", lat: 34.3853, lon: 132.4553 },
    { name: "Sendai, MYG", lat: 38.2682, lon: 140.8694 }
  ],
  Global: [
    { name: "Geneva, Switzerland", lat: 46.2044, lon: 6.1432 },
    { name: "Singapore", lat: 1.3521, lon: 103.8198 },
    { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708 }
  ]
};

const mapStreamsToSpannedCoordinates = (streamsList: StreamChannel[]) => {
  const countryCounts: Record<string, number> = {};
  return streamsList.map((stream) => {
    if (stream.lat && stream.lon && (stream.lat !== 0 || stream.lon !== 0)) {
      return { ...stream, cityName: stream.cityName || "stream hub", mappedLat: stream.lat, mappedLon: stream.lon };
    }
    const code = stream.country || "GLOBAL";
    if (countryCounts[code] === undefined) countryCounts[code] = 0;
    const index = countryCounts[code];
    countryCounts[code] += 1;
    
    const cities = countryCities[code] || countryCities["Global"];
    const baseCity = cities[index % cities.length];
    return { ...stream, cityName: baseCity.name, mappedLat: baseCity.lat, mappedLon: baseCity.lon };
  });
};

const mapStyles = [
  { 
    id: "satellite", 
    label: "Satellite View", 
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    overlayUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_And_Places/MapServer/tile/{z}/{y}/{x}"
  },
  { id: "light", label: "Classic Light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" },
  { id: "dark", label: "Midnight Dark", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" }
];

interface WorldMapProps {
  streams: StreamChannel[];
  selectedCategory: string;
  onSelectChannel: (channel: StreamChannel) => void;
  activeChannel: StreamChannel | null;
  theme: "light" | "dark";
}

export default function WorldMap({ streams, selectedCategory, onSelectChannel, activeChannel, theme }: WorldMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMapStyle, setCurrentMapStyle] = useState("satellite");
  const [projectionMode, setProjectionMode] = useState<"2D" | "3D">("2D");
  const [activeGlobePopup, setActiveGlobePopup] = useState<{ lat: number; lon: number; channels: any[]; name: string } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayerRef = useRef<L.TileLayer | null>(null);

  const processedStreams = useMemo(() => mapStreamsToSpannedCoordinates(streams), [streams]);

  const filteredStreams = useMemo(() => {
    return processedStreams.filter((s) => {
      const matchCat = selectedCategory === "all" || s.category === selectedCategory;
      const matchSearch = searchQuery
        ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.cityName && s.cityName.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchCat && matchSearch;
    });
  }, [processedStreams, selectedCategory, searchQuery]);

  // Grouped streams matching exact positions for smart drop-down stacking in 3D Mode
  const groupedStreamsByLocation = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredStreams.forEach(stream => {
      const key = `${stream.mappedLat.toFixed(2)}_${stream.mappedLon.toFixed(2)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(stream);
    });
    return Object.values(groups);
  }, [filteredStreams]);

  // Leaflet initialization and coordination engine
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const targetStyle = mapStyles.find(style => style.id === currentMapStyle) || mapStyles[0];
    
    // Config toggles switching between Equirectangular 2D and Orthographic 3D Globe models
    const map = L.map(mapContainerRef.current, {
      center: activeChannel ? [activeChannel.lat || 20, activeChannel.lon || 0] : [20, 0],
      zoom: projectionMode === "3D" ? 3 : 2,
      minZoom: projectionMode === "3D" ? 2 : 2,
      maxZoom: projectionMode === "3D" ? 6 : 8,
      crs: projectionMode === "3D" ? L.CRS.EPSG3857 : L.CRS.EPSG3857, 
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: projectionMode === "2D"
    });

    // Emulate 3D Globe mask geometry if selected to preserve brutalist boundaries over maps
    if (projectionMode === "3D") {
      mapContainerRef.current.classList.add("brutalist-globe-clip");
    } else {
      mapContainerRef.current.classList.remove("brutalist-globe-clip");
    }

    const tileLayer = L.tileLayer(targetStyle.url, { subdomains: "abcd", noWrap: projectionMode === "3D" }).addTo(map);
    tileLayerRef.current = tileLayer;

    if (targetStyle.overlayUrl) {
      overlayLayerRef.current = L.tileLayer(targetStyle.overlayUrl, { subdomains: "abcd", noWrap: projectionMode === "3D" }).addTo(map);
    }

    L.control.zoom({ position: "bottomright" }).addTo(map);

    if (projectionMode === "2D") {
      const markerGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 45,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="flex items-center justify-center w-8 h-8 bg-indigo-600 font-sans text-xs font-bold border ${theme === 'light' ? 'border-zinc-900 text-white' : 'border-indigo-400 text-indigo-100'} rounded-none"><span>${count}</span></div>`,
            className: 'custom-cluster-icon',
            iconSize: [32, 32]
          });
        }
      }).addTo(map);

      markerGroup.on('clusterclick', (a: any) => {
        const markers = a.layer.getAllChildMarkers();
        let listHtml = `<div class="flex flex-col gap-1 max-h-[240px] overflow-y-auto min-w-[220px] font-mono text-xs p-2 rounded-none border-2 ${theme === "light" ? "bg-white border-zinc-900" : "bg-neutral-950 border-neutral-800 text-white"}">`;
        markers.forEach((m: any) => {
          const s = m.options.streamData;
          listHtml += `<div class="p-2 border mb-1 cursor-pointer hover:bg-indigo-900 hover:text-white" onclick="window.dispatchEvent(new CustomEvent('select-map-chan', {detail: '${s.id}'}))">// ${s.name.toUpperCase()}</div>`;
        });
        listHtml += `</div>`;
        L.popup({ closeButton: false }).setLatLng(a.latlng).setContent(listHtml).openOn(map);
      });

      filteredStreams.forEach((stream) => {
        const markerHtml = `<div class="relative flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-none h-3 w-3 bg-emerald-500 border border-black"></span></div>`;
        const marker = L.marker([stream.mappedLat, stream.mappedLon], { 
          icon: L.divIcon({ html: markerHtml, className: "custom-marker", iconSize: [12, 12] }),
          streamData: stream 
        } as any);
        marker.on("click", () => onSelectChannel(stream));
        marker.addTo(markerGroup);
      });
      markerGroupRef.current = markerGroup;
    } else {
      // 3D Stacking Layer System Initialization
      groupedStreamsByLocation.forEach((group) => {
        const topStream = group[0];
        const isCluster = group.length > 1;
        const markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            ${isCluster ? `<div class="absolute -top-3 -right-3 bg-indigo-600 text-white font-mono font-black text-[9px] px-1 border border-black">${group.length}</div>` : ""}
            <span class="animate-pulse absolute h-4 w-4 bg-emerald-500/40"></span>
            <span class="h-3 w-3 bg-emerald-500 border-2 ${theme === 'light' ? 'border-zinc-900' : 'border-white'}"></span>
          </div>`;

        const marker = L.marker([topStream.mappedLat, topStream.mappedLon], {
          icon: L.divIcon({ html: markerHtml, className: "globe-node-stack", iconSize: [16, 16] })
        }).addTo(map);

        marker.on("click", () => {
          setActiveGlobePopup({
            lat: topStream.mappedLat,
            lon: topStream.mappedLon,
            name: topStream.cityName,
            channels: group
          });
        });
      });
    }

    mapRef.current = map;
    return () => { if (mapRef.current) mapRef.current.remove(); };
  }, [projectionMode, filteredStreams, currentMapStyle, theme]);

  // Smart Zoom flyTo Tracking system integration
  useEffect(() => {
    if (!activeChannel || !mapRef.current) return;
    const targetZoom = projectionMode === "3D" ? 5 : 6;
    mapRef.current.flyTo([activeChannel.lat || 20, activeChannel.lon || 0], targetZoom, {
      duration: 1.8,
      easeLinearity: 0.2
    });
  }, [activeChannel, projectionMode]);

  // Hook layout dispatch responses
  useEffect(() => {
    const handleSelect = (e: Event) => {
      const id = (e as CustomEvent).detail;
      const found = processedStreams.find(s => s.id === id);
      if (found) onSelectChannel(found);
    };
    window.addEventListener('select-map-chan', handleSelect);
    return () => window.removeEventListener('select-map-chan', handleSelect);
  }, [processedStreams]);

  return (
    <div className={`relative w-full border-2 p-5 flex flex-col gap-4 font-mono transition-all rounded-none ${
      theme === "light" ? "bg-[#faf9f6] border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]" : "bg-[#0d0e12] border-neutral-800"
    }`}>
      <style>{`
        .brutalist-globe-clip {
          border-radius: 50% !important;
          overflow: hidden !important;
          border: 4px solid #18181b !important;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.8) !important;
          background: #000 !important;
          transform: scale(0.95);
          transition: transform 0.5s ease;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            <h2 className={`text-sm font-black uppercase ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>
              Telemetry Spatial Framework ({projectionMode})
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Projection Engine Switcher */}
          <div className="flex border-2 border-zinc-950 font-black text-xs">
            <button onClick={() => setProjectionMode("2D")} className={`px-3 py-1 uppercase ${projectionMode === "2D" ? "bg-indigo-600 text-white" : "bg-transparent"}`}>2D Flat</button>
            <button onClick={() => setProjectionMode("3D")} className={`px-3 py-1 uppercase ${projectionMode === "3D" ? "bg-indigo-600 text-white" : "bg-transparent"}`}>3D Globe</button>
          </div>

          <div className={`flex items-center gap-2 border-2 px-2 py-1 text-xs uppercase font-bold ${theme === "light" ? "bg-white border-zinc-900" : "bg-neutral-950 border-neutral-800 text-white"}`}>
            <Paintbrush className="w-3.5 h-3.5 text-indigo-500" />
            <select value={currentMapStyle} onChange={(e) => setCurrentMapStyle(e.target.value)} className="bg-transparent outline-none cursor-pointer uppercase">
              {mapStyles.map((style) => (
                <option key={style.id} value={style.id} className="text-black">{style.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <input type="text" className="border-2 px-3 pl-8 py-1 text-xs uppercase font-bold" placeholder="Query node..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Primary Map Viewport Container */}
      <div className="relative w-full h-[450px] bg-neutral-950 border-2 border-zinc-900 flex items-center justify-center overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" id="world-map-leaflet" />

        {/* 3D Smart Channel Drop-down Menu Stacking Popover Container */}
        {projectionMode === "3D" && activeGlobePopup && (
          <div className={`absolute bottom-4 left-4 z-[1000] p-3 border-2 max-w-[280px] font-mono text-xs ${
            theme === "light" ? "bg-white border-zinc-900 text-zinc-900" : "bg-neutral-950 border-neutral-800 text-white"
          }`}>
            <div className="flex justify-between items-center border-b pb-1.5 mb-2 font-black">
              <span className="uppercase">{activeGlobePopup.name}</span>
              <button onClick={() => setActiveGlobePopup(null)} className="text-red-500">HTML[X]</button>
            </div>
            <div className="max-h-[150px] overflow-y-auto flex flex-col gap-1 pr-1">
              {activeGlobePopup.channels.map((chan) => (
                <div 
                  key={chan.id} 
                  onClick={() => { onSelectChannel(chan); }}
                  className="p-2 border border-zinc-800 cursor-pointer uppercase font-bold text-[10px] hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  📡 {chan.name} ({chan.category})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] font-bold border-t-2 pt-3 uppercase text-neutral-500">
        <div className="flex gap-4">
          <span>🟢 Connected Broadcast nodes</span>
          <span>🔵 Array stacks bundled</span>
        </div>
        <div className="flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" />
          <span>PROJECTION MODE: Community Engine Matrix</span>
        </div>
      </div>
    </div>
  );
}