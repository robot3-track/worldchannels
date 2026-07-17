import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Search, Globe, Compass, Paintbrush, ToggleLeft, ToggleRight } from "lucide-react";
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
  ID: [
    { name: "Jakarta", lat: -6.2088, lon: 106.8456 },
    { name: "Surabaya", lat: -7.2575, lon: 112.7521 },
    { name: "Bandung", lat: -6.9175, lon: 107.6191 },
    { name: "Medan", lat: 3.5952, lon: 98.6722 },
    { name: "Semarang", lat: -6.9667, lon: 110.4167 },
    { name: "Makassar", lat: -5.1477, lon: 119.4327 }
  ],
  CN: [
    { name: "Beijing", lat: 39.9042, lon: 116.4074 },
    { name: "Shanghai", lat: 31.2304, lon: 121.4737 },
    { name: "Guangzhou", lat: 23.1291, lon: 113.2644 },
    { name: "Shenzhen", lat: 22.5431, lon: 114.0579 },
    { name: "Chengdu", lat: 30.5728, lon: 104.0668 },
    { name: "Wuhan", lat: 30.5928, lon: 114.3055 },
    { name: "Xi'an", lat: 34.3416, lon: 108.9398 },
    { name: "Chongqing", lat: 29.5630, lon: 106.5516 }
  ],
  TW: [
    { name: "Taipei", lat: 25.0330, lon: 121.5654 },
    { name: "Kaohsiung", lat: 22.6273, lon: 120.3014 },
    { name: "Taichung", lat: 24.1477, lon: 120.6736 },
    { name: "Tainan", lat: 22.9997, lon: 120.2270 },
    { name: "Hsinchu", lat: 24.8138, lon: 120.9675 }
  ],
  KR: [
    { name: "Seoul", lat: 37.5665, lon: 126.9780 },
    { name: "Busan", lat: 35.1796, lon: 129.0756 },
    { name: "Incheon", lat: 37.4563, lon: 126.7052 },
    { name: "Daegu", lat: 35.8714, lon: 128.6014 },
    { name: "Daejeon", lat: 36.3504, lon: 127.3845 },
    { name: "Gwangju", lat: 35.1595, lon: 126.8526 }
  ],
  ES: [
    { name: "Madrid", lat: 40.4168, lon: -3.7038 },
    { name: "Barcelona", lat: 41.3851, lon: 2.1734 },
    { name: "Valencia", lat: 39.4699, lon: -0.3763 },
    { name: "Seville", lat: 37.3891, lon: -5.9845 },
    { name: "Zaragoza", lat: 41.6488, lon: -0.8891 },
    { name: "Málaga", lat: 36.7213, lon: -4.4214 }
  ],
  RU: [
    { name: "Moscow", lat: 55.7558, lon: 37.6173 },
    { name: "Saint Petersburg", lat: 59.9343, lon: 30.3351 },
    { name: "Novosibirsk", lat: 55.0084, lon: 82.9357 },
    { name: "Yekaterinburg", lat: 56.8389, lon: 60.6057 },
    { name: "Kazan", lat: 55.8304, lon: 49.0661 },
    { name: "Nizhny Novgorod", lat: 56.3269, lon: 44.0059 },
    { name: "Vladivostok", lat: 43.1198, lon: 131.8869 },
    { name: "Sochi", lat: 43.6028, lon: 39.7342 }
  ],
  VN: [
    { name: "Hanoi", lat: 21.0285, lon: 105.8542 },
    { name: "Ho Chi Minh City", lat: 10.8231, lon: 106.6297 },
    { name: "Da Nang", lat: 16.0544, lon: 108.2022 }
  ],
  IT: [
    { name: "Rome", lat: 41.9028, lon: 12.4964 },
    { name: "Milan", lat: 45.4642, lon: 9.1900 },
    { name: "Naples", lat: 40.8518, lon: 14.2681 },
    { name: "Venice", lat: 45.4408, lon: 12.3155 },
    { name: "Florence", lat: 43.7696, lon: 11.2558 }
  ],
  KP: [
    { name: "Pyongyang", lat: 39.0392, lon: 125.7625 },
    { name: "Hamhung", lat: 39.9183, lon: 127.5358 }
  ],
  IN: [
    { name: "New Delhi", lat: 28.6139, lon: 77.2090 },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
    { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
    { name: "Chennai", lat: 13.0827, lon: 80.2707 },
    { name: "Kolkata", lat: 22.5726, lon: 88.3639 }
  ],
  SA: [
    { name: "Riyadh", lat: 24.7136, lon: 46.6753 },
    { name: "Jeddah", lat: 21.4858, lon: 39.1925 },
    { name: "Mecca", lat: 21.3891, lon: 39.8579 },
    { name: "Medina", lat: 24.5247, lon: 39.5692 },
    { name: "Dammam", lat: 26.4207, lon: 50.0888 }
  ],
  TR: [
    { name: "Ankara", lat: 39.9334, lon: 32.8597 },
    { name: "Istanbul", lat: 41.0082, lon: 28.9784 },
    { name: "Izmir", lat: 38.4237, lon: 27.1428 }
  ],
  MX: [
    { name: "Mexico City", lat: 19.4326, lon: -99.1332 },
    { name: "Guadalajara", lat: 20.6597, lon: -103.3496 },
    { name: "Monterrey", lat: 25.6866, lon: -100.3161 }
  ],
  EG: [
    { name: "Cairo", lat: 30.0444, lon: 31.2357 },
    { name: "Alexandria", lat: 31.2001, lon: 29.9187 },
    { name: "Giza", lat: 30.0131, lon: 31.2089 }
  ],
  Global: [
    { name: "Geneva, Switzerland", lat: 46.2044, lon: 6.1432 },
    { name: "Brussels, Belgium", lat: 50.8503, lon: 4.3517 },
    { name: "Vienna, Austria", lat: 48.2082, lon: 16.3738 },
    { name: "Singapore", lat: 1.3521, lon: 103.8198 },
    { name: "Hong Kong", lat: 22.3193, lon: 114.1694 },
    { name: "Cape Town, South Africa", lat: -33.9249, lon: 18.4241 },
    { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708 },
    { name: "Reykjavík, Iceland", lat: 64.1466, lon: -21.9426 }
  ]
};

// Advanced coordinate scatter algorithm to isolate adjacent map telemetry nodes[cite: 1]
const mapStreamsToSpannedCoordinates = (streamsList: StreamChannel[]) => {
  const countryCounts: Record<string, number> = {};
  
  return streamsList.map((stream) => {
    if (stream.lat && stream.lon && (stream.lat !== 0 || stream.lon !== 0)) {
      return {
        ...stream,
        cityName: stream.cityName || "stream hub",
        mappedLat: stream.lat,
        mappedLon: stream.lon
      };
    }

    const code = stream.country || "GLOBAL";
    if (countryCounts[code] === undefined) {
      countryCounts[code] = 0;
    }
    const index = countryCounts[code];
    countryCounts[code] += 1;
    
    const cities = countryCities[code] || countryCities["Global"];
    const cityIndex = index % cities.length;
    const baseCity = cities[cityIndex];
    
    // Slight deterministic spiral offset to handle marker overlapping configurations
    const angle = index * 137.5; 
    const radius = 0.06 * Math.sqrt(index + 1); 
    const latShift = Math.sin(angle * (Math.PI / 180)) * radius;
    const lonShift = Math.cos(angle * (Math.PI / 180)) * radius;
    
    return {
      ...stream,
      cityName: baseCity.name,
      mappedLat: baseCity.lat + latShift,
      mappedLon: baseCity.lon + lonShift
    };
  });
};

// Map customization styles config - Satellite has an overlayUrl property assigned[cite: 1]
const mapStyles = [
  { 
    id: "satellite", 
    label: "Satellite View", 
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    overlayUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_And_Places/MapServer/tile/{z}/{y}/{x}" // Transparent hybrid overlay layer
  },
  { id: "light", label: "Classic Light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" },
  { id: "dark", label: "Midnight Dark", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" },
  { id: "retro", label: "Retro Voyager", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" }
];

interface WorldMapProps {
  streams: StreamChannel[];
  selectedCategory: string;
  onSelectChannel: (channel: StreamChannel) => void;
  activeChannel: StreamChannel | null;
  theme: "light" | "dark";
}

export default function WorldMap({
  streams,
  selectedCategory,
  onSelectChannel,
  activeChannel,
  theme
}: WorldMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Set satellite view as default initial state[cite: 1]
  const [currentMapStyle, setCurrentMapStyle] = useState("satellite");
  const [is3DMode, setIs3DMode] = useState(false); // Toggle to switch viewports
  
  // Dynamic rotation values for 3D Globe Mode
  const [rotation, setRotation] = useState({ x: -10, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationStartRef = useRef({ x: 0, y: 0 });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayerRef = useRef<L.TileLayer | null>(null); // Reference hook tracking boundaries overlay layer
  const isInitialRenderRef = useRef(true);

  // Parse telemetry streams to generate coordinates[cite: 1]
  const processedStreams = useMemo(() => {
    return mapStreamsToSpannedCoordinates(streams);
  }, [streams]);

  // Handle active registry search sorting flags[cite: 1]
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

  // Handle auto-focus rotation when active node switches in 3D Mode
  useEffect(() => {
    if (is3DMode && activeChannel) {
      const matched = processedStreams.find((s) => s.id === activeChannel.id);
      if (matched) {
        // Map 2D latitude/longitude direct grid positions smoothly to projection center values
        setRotation({
          x: -matched.mappedLat,
          y: -matched.mappedLon
        });
      }
    }
  }, [activeChannel, is3DMode, processedStreams]);

  // Initialize leaf matrix map onto DOM container hook[cite: 1]
  useEffect(() => {
    if (is3DMode) return; // Skip 2D initialization when 3D projection runs
    if (!mapContainerRef.current || mapRef.current) return;

    const bounds = L.latLngBounds(L.latLng(-65, -180), L.latLng(85, 180));

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 8,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false
    });

    // Select default satellite style initially[cite: 1]
    const targetStyle = mapStyles.find(style => style.id === currentMapStyle) || mapStyles[0];

    const tileLayer = L.tileLayer(targetStyle.url, {
      subdomains: "abcd",
      maxZoom: 20,
      noWrap: true,
      bounds: bounds
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Load overlay layer (Borders/Places labels) if it is supplied on the initial style
    if (targetStyle.overlayUrl) {
      const overlayLayer = L.tileLayer(targetStyle.overlayUrl, {
        subdomains: "abcd",
        maxZoom: 20,
        noWrap: true,
        bounds: bounds
      }).addTo(map);
      overlayLayerRef.current = overlayLayer;
    }

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Dynamic marker aggregated clusters[cite: 1]
    const markerGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false, 
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 45,
      disableClusteringAtZoom: 14, 
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-8 h-8 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-900 font-sans text-xs font-bold border ${theme === 'light' ? 'border-zinc-900 text-white' : 'border-indigo-400 text-indigo-100'} rounded-none cursor-pointer"><span>${count}</span></div>`,
          className: 'custom-cluster-icon',
          iconSize: [32, 32]
        });
      }
    }).addTo(map);

    // Render multi-stream cluster selection arrays inside popup panel overlays[cite: 1]
    markerGroup.on('clusterclick', (a: any) => {
      const markers = a.layer.getAllChildMarkers();
      const clusterLatLng = a.latlng;

      let listHtml = `
        <div class="flex flex-col gap-1 max-h-[240px] overflow-y-auto pr-1 no-scrollbar min-w-[220px] font-sans text-xs p-2 rounded-none border-2 ${
          theme === "light" ? "bg-white text-zinc-900 border-zinc-900" : "bg-neutral-950 text-neutral-200 border-neutral-800"
        }">
          <div class="text-[10px] font-bold uppercase tracking-wider mb-2 px-1 flex justify-between border-b-2 ${
            theme === "light" ? "border-zinc-900 text-zinc-500" : "border-neutral-800 text-neutral-500"
          } pb-1.5 font-mono">
            <span>CHANNELS AT POSITION</span>
            <span class="font-bold">TOTAL: ${markers.length}</span>
          </div>
      `;

      markers.forEach((marker: any) => {
        const stream = marker.options.streamData;
        if (!stream) return;

        const statusDot = stream.status === "online" ? "bg-emerald-500" : stream.status === "unstable" ? "bg-amber-500" : "bg-rose-500";
        
        listHtml += `
          <div class="channel-popup-item flex items-center justify-between p-2 cursor-pointer transition-all border-2 rounded-none font-mono ${
            theme === "light" 
              ? "bg-white border-zinc-900 hover:bg-zinc-50" 
              : "bg-neutral-900 border-neutral-800 hover:bg-neutral-950 hover:border-neutral-700"
          } mb-1" data-id="${stream.id}">
            <div class="flex items-center gap-2 truncate">
              <div class="w-2.5 h-2.5 rounded-none ${statusDot} flex-shrink-0"></div>
              <div class="flex flex-col truncate">
                <span class="text-xs font-bold truncate leading-none mb-1 uppercase">${stream.name}</span>
                <span class="text-[9px] text-zinc-500 dark:text-neutral-500 tracking-wider uppercase leading-none">SYS: ${stream.category}</span>
              </div>
            </div>
            <div class="flex-shrink-0 ml-2 text-indigo-500 font-black text-[10px] uppercase">
              WATCH
            </div>
          </div>
        `;
      });

      listHtml += `</div>`;

      const popup = L.popup({
        closeButton: false,
        className: 'custom-cluster-popup brutalist-popup',
        offset: L.point(0, -10),
        maxWidth: 260
      })
        .setLatLng(clusterLatLng)
        .setContent(listHtml)
        .openOn(map);

      // Bind node relay intercept handlers across popup list structures[cite: 1]
      setTimeout(() => {
        const container = popup.getElement();
        if (!container) return;
        
        const items = container.querySelectorAll('.channel-popup-item');
        items.forEach(item => {
          item.addEventListener('click', () => {
            const id = (item as HTMLElement).dataset.id;
            const targetStream = markers.find((m: any) => m.options.streamData?.id === id)?.options.streamData;
            if (targetStream) {
              onSelectChannel(targetStream);
              map.closePopup();
            }
          });
        });
      }, 100);
    });
    
    markerGroupRef.current = markerGroup;
    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [theme, is3DMode]);

  // Update dynamic map tiles and toggle overlay boundary logic when style custom choices pivot[cite: 1]
  useEffect(() => {
    const map = mapRef.current;
    if (!map || is3DMode) return;

    const selectedStyle = mapStyles.find(style => style.id === currentMapStyle) || mapStyles[0];
    
    // 1. Update primary layer configuration
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(selectedStyle.url);
    }

    // 2. Safely wipe out outdated overlay structures
    if (overlayLayerRef.current) {
      map.removeLayer(overlayLayerRef.current);
      overlayLayerRef.current = null;
    }

    // 3. Inject reference text/border layers if included in properties object
    if (selectedStyle.overlayUrl) {
      const bounds = L.latLngBounds(L.latLng(-65, -180), L.latLng(85, 180));
      const overlayLayer = L.tileLayer(selectedStyle.overlayUrl, {
        subdomains: "abcd",
        maxZoom: 20,
        noWrap: true,
        bounds: bounds
      }).addTo(map);
      
      overlayLayerRef.current = overlayLayer;
      
      // Ensure overlay text sits directly below UI markers instead of overlapping them
      if (markerGroupRef.current) {
        markerGroupRef.current.bringToFront();
      }
    }
  }, [currentMapStyle, is3DMode]);

  // Update dynamic markers when selection or data changes[cite: 1]
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup || is3DMode) return;

    // Clear old layers[cite: 1]
    markerGroup.clearLayers();

    // Map each stream to an interactive Leaflet marker[cite: 1]
    filteredStreams.forEach((stream) => {
      const lat = stream.mappedLat;
      const lon = stream.mappedLon;
      const cityName = stream.cityName;
      const isActive = activeChannel && activeChannel.id === stream.id;

      // Ensure all classes are statically recognizable by Tailwind compiler[cite: 1]
      let pingColorClass = "bg-emerald-400/40";
      let pulseRingClass = "bg-emerald-400/20";
      let pulseBorderClass = "border-emerald-400/30";
      let activeDotColorClass = "bg-emerald-500";

      if (stream.status === "unstable") {
        pingColorClass = "bg-amber-400/40";
        pulseRingClass = "bg-amber-400/20";
        pulseBorderClass = "border-amber-400/30";
        activeDotColorClass = "bg-amber-500";
      } else if (stream.status === "offline") {
        pingColorClass = "bg-rose-400/40";
        pulseRingClass = "bg-rose-400/20";
        pulseBorderClass = "border-rose-400/30";
        activeDotColorClass = "bg-rose-500";
      }

      // HTML template for pulsing map nodes - Hard flat brutalist squares[cite: 1]
      const markerHtml = isActive
        ? `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-9 w-9 rounded-none ${pingColorClass} animate-ping"></span>
          <span class="absolute inline-flex h-6 w-6 rounded-none ${pulseRingClass} border-2 ${pulseBorderClass}"></span>
          <span class="relative inline-flex rounded-none h-3.5 w-3.5 ${activeDotColorClass} border-2 ${theme === "light" ? "border-zinc-900" : "border-neutral-950"} shadow-sm"></span>
        </div>
        `
        : `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-4 w-4 rounded-none ${stream.status === 'unstable' ? 'bg-amber-500/20' : stream.status === 'offline' ? 'bg-rose-500/20' : 'bg-emerald-500/20'} animate-pulse"></span>
          <span class="relative inline-flex rounded-none h-2.5 w-2.5 ${stream.status === 'unstable' ? 'bg-amber-500' : stream.status === 'offline' ? 'bg-rose-500' : 'bg-emerald-500'} border-2 ${theme === "light" ? "border-zinc-900" : "border-neutral-950"}"></span>
        </div>
        `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-map-marker-wrapper",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Tailored minimal modern popup structure[cite: 1]
      const popupContent = `
        <div class="p-3 font-mono text-[11px] rounded-none border-2 ${
          theme === "light" 
            ? "text-zinc-900 bg-white border-zinc-900" 
            : "text-neutral-200 bg-neutral-950 border-neutral-850"
        } min-w-[220px]">
          <div class="flex items-center gap-2 border-b-2 pb-1.5 uppercase ${theme === "light" ? "border-zinc-900" : "border-neutral-850"}">
            <span class="w-2.5 h-2.5 rounded-none ${stream.status === 'unstable' ? 'bg-amber-500 animate-pulse' : stream.status === 'offline' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}"></span>
            <span class="font-bold truncate">${stream.name}</span>
          </div>
          <div class="mt-2 flex justify-between items-center font-bold text-[10px] ${theme === "light" ? "text-zinc-500" : "text-neutral-400"}">
            <span class="uppercase">${cityName}</span>
            <span class="text-[9px] font-black px-1.5 py-0.5 border-2 ${
              theme === "light" ? "bg-zinc-50 text-zinc-900 border-zinc-900" : "bg-neutral-900 text-neutral-300 border-neutral-800"
            }">${stream.country}</span>
          </div>
          <div class="text-[9px] font-bold mt-1.5 uppercase ${theme === "light" ? "text-zinc-400" : "text-neutral-500"}">
            SYS REGISTRY: ${stream.category}
          </div>
          <div class="mt-2.5 pt-2 border-t-2 text-[9px] font-bold flex items-center gap-1.5 uppercase ${
            stream.status === 'offline' ? 'text-rose-600' : stream.status === 'unstable' ? 'text-amber-500' : 'text-emerald-500'
          } ${theme === "light" ? "border-zinc-900" : "border-neutral-850"}">
            <span>//</span>
            <span>${stream.status === 'offline' ? 'LINK FAIL' : stream.status === 'unstable' ? 'SIGNAL UNSTABLE' : 'LAUNCH BROADCAST'}</span>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lon], { 
        icon: customIcon,
        streamData: stream 
      } as any);
      
      marker.bindPopup(popupContent, {
        className: "custom-leaflet-popup brutalist-popup",
        closeButton: false,
        offset: [0, -6]
      });

      marker.on("click", () => {
        onSelectChannel(stream);
      });

      marker.addTo(markerGroup);
    });
  }, [filteredStreams, activeChannel, theme, is3DMode]);

  // Dynamic camera fly-to effect on selection[cite: 1]
  useEffect(() => {
    const map = mapRef.current;
    if (!activeChannel || !map || is3DMode) return;

    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    const matched = processedStreams.find((s) => s.id === activeChannel.id);
    if (matched) {
      map.flyTo([matched.mappedLat, matched.mappedLon], 5, {
        duration: 1.6,
        easeLinearity: 0.2
      });
    }
  }, [activeChannel, processedStreams, is3DMode]);

  // --- 3D ORTHOGRAPHIC PROJECTION MATHEMATICS FOR SPHERICAL CALCULATIONS ---
  // Calculates coordinates and tests whether a stream is positioned on the visible side of the 3D globe hemisphere
  const globePoints = useMemo(() => {
    const radius = 140; // Pixels
    const center = 180; // Relative layout grid coordinates
    
    // Rotate relative longitude (Y) and latitude (X)
    const lambda0 = (rotation.y * Math.PI) / 180;
    const phi0 = (rotation.x * Math.PI) / 180;

    return filteredStreams.map((stream) => {
      const phi = (stream.mappedLat * Math.PI) / 180;
      const lambda = (stream.mappedLon * Math.PI) / 180;

      // Calculate angular distance across current hemisphere projection
      const cosC = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0);
      const isVisible = cosC > 0; // If angle <= 0, node resides on back portion of globe

      // Orthographic cartographic mapping coordinates
      const x = radius * Math.cos(phi) * Math.sin(lambda - lambda0) + center;
      const y = -radius * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0)) + center;

      return {
        ...stream,
        projX: x,
        projY: y,
        visible: isVisible
      };
    });
  }, [filteredStreams, rotation]);

  // Drag handles to rotate the 3D Globe Mode
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    rotationStartRef.current = { ...rotation };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Apply scaling factor to rotation delta speed
    setRotation({
      x: Math.max(-90, Math.min(90, rotationStartRef.current.x + deltaY * 0.4)),
      y: rotationStartRef.current.y - deltaX * 0.4
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={`relative w-full border-2 p-4 md:p-5 overflow-hidden flex flex-col gap-4 font-mono transition-all rounded-none ${
      theme === "light"
        ? "bg-[#faf9f6] border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]"
        : "bg-[#0d0e12] border-neutral-800 shadow-[4px_4px_0px_0px_rgba(99,102,241,0.1)]"
    }`}>
      {/* Dynamic Header[cite: 1] */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500 animate-spin-slow" />
            <h2 className={`text-sm font-black uppercase tracking-tight ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>
              Telemetry World Map {is3DMode ? "(3D GLOBE SPHERE)" : "(2D MULTI-GRID)"}
            </h2>
          </div>
          <p className={`text-[11px] font-sans mt-1 leading-relaxed font-medium ${theme === "light" ? "text-zinc-500" : "text-neutral-400"}`}>
            A raw global monitoring framework cataloging and rendering active streams to coordinates. Drag, rotate, and interact with live nodes.
          </p>
        </div>

        {/* Dynamic Controls Side-by-Side[cite: 1] */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* 3D / 2D Mode Switch Toggle */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`flex items-center gap-2 border-2 px-2.5 py-1.5 rounded-none font-bold uppercase transition-all text-xs hover:border-indigo-500 ${
              theme === "light"
                ? "bg-white border-zinc-900 text-zinc-800"
                : "bg-neutral-950 border-neutral-800 text-neutral-300"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px]">3D Globe:</span>
            {is3DMode ? (
              <ToggleRight className="w-5 h-5 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-zinc-400" />
            )}
          </button>
          
          {/* Custom Map Color Switcher - Fixed Light/Dark Theme dropdown config (Only applicable in 2D Map mode)[cite: 1] */}
          {!is3DMode && (
            <div className={`flex items-center gap-2 border-2 px-2.5 py-1.5 rounded-none font-bold uppercase transition-all text-xs ${
              theme === "light"
                ? "bg-white border-zinc-900 text-zinc-800"
                : "bg-neutral-950 border-neutral-800 text-neutral-300"
            }`}>
              <Paintbrush className="w-3.5 h-3.5 text-indigo-500" />
              <select
                value={currentMapStyle}
                onChange={(e) => setCurrentMapStyle(e.target.value)}
                className={`bg-transparent text-[11px] font-bold uppercase outline-none cursor-pointer pr-1 ${
                  theme === "light" ? "text-zinc-900" : "text-neutral-200"
                }`}
              >
                {mapStyles.map((style) => (
                  <option 
                    key={style.id} 
                    value={style.id} 
                    className={theme === "light" ? "bg-white text-zinc-900" : "bg-neutral-950 text-neutral-100"}
                  >
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box[cite: 1] */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className={`h-3.5 w-3.5 ${theme === "light" ? "text-zinc-500" : "text-neutral-600"}`} />
            </span>
            <input
              type="text"
              className={`w-full border-2 pl-9 pr-12 py-1.5 text-xs transition-all rounded-none uppercase font-bold tracking-tight ${
                theme === "light"
                  ? "bg-white border-zinc-900 text-zinc-900 placeholder-zinc-400 focus:outline-none"
                  : "bg-neutral-950 border-neutral-800 text-neutral-200 placeholder-neutral-700 focus:outline-none"
              }`}
              placeholder="Query node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-bold text-zinc-500 dark:text-neutral-400 hover:text-indigo-500 transition-colors cursor-pointer uppercase"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Map Viewport Area */}
      <div className={`relative w-full h-[400px] md:h-[480px] overflow-hidden border-2 z-0 p-1 rounded-none ${
        theme === "light" 
          ? "bg-white border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]" 
          : "bg-[#0d0e12] border-neutral-800 shadow-[2px_2px_0px_0px_rgba(99,102,241,0.05)]"
      }`}>
        
        {/* 2D View Container (Hidden when 3D Mode is True) */}
        <div 
          ref={mapContainerRef} 
          className={`w-full h-full ${is3DMode ? "hidden" : "block"}`} 
          id="world-map-leaflet" 
        />

        {/* 3D Orthographic Vector Globe Container */}
        {is3DMode && (
          <div 
            className="w-full h-full flex items-center justify-center relative select-none overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            <div className="absolute top-4 left-4 z-10 p-2 border-2 bg-neutral-950/95 border-neutral-800 text-[9px] uppercase font-bold text-indigo-400">
              Drag Globe to Rotate <br/>
              <span className="text-neutral-500">LAT: {(-rotation.x).toFixed(1)}° | LON: {(-rotation.y).toFixed(1)}°</span>
            </div>

            {/* Spheroid Render Interface */}
            <svg 
              viewBox="0 0 360 360" 
              className="w-[340px] h-[340px] md:w-[400px] md:h-[400px] drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]"
            >
              {/* Globe Outer Atmosphere Grid */}
              <circle 
                cx="180" 
                cy="180" 
                r="140" 
                fill={theme === "light" ? "#f4f4f5" : "#020205"} 
                stroke={theme === "light" ? "#18181b" : "#4f46e5"} 
                strokeWidth="3.5"
              />

              {/* Wireframe longitude and latitude parallel guide rings */}
              <path 
                d="M 40 180 A 140 140 0 0 0 320 180 Z" 
                fill="none" 
                stroke={theme === "light" ? "#e4e4e7" : "#1f1f2e"} 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
              />
              <path 
                d="M 180 40 A 140 140 0 0 0 180 320 Z" 
                fill="none" 
                stroke={theme === "light" ? "#e4e4e7" : "#1f1f2e"} 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
              />

              {/* Render dynamic markers mapped onto orthographic 3D calculations */}
              {globePoints.map((stream) => {
                if (!stream.visible) return null;

                const isActive = activeChannel && activeChannel.id === stream.id;
                let activeColor = "fill-emerald-500 stroke-emerald-200";
                let shadowColor = "rgba(16,185,129,0.3)";

                if (stream.status === "unstable") {
                  activeColor = "fill-amber-500 stroke-amber-200";
                  shadowColor = "rgba(245,158,11,0.3)";
                } else if (stream.status === "offline") {
                  activeColor = "fill-rose-500 stroke-rose-200";
                  shadowColor = "rgba(239,68,68,0.3)";
                }

                return (
                  <g 
                    key={stream.id} 
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectChannel(stream);
                    }}
                  >
                    {/* Pulsing indicator aura */}
                    <circle 
                      cx={stream.projX} 
                      cy={stream.projY} 
                      r={isActive ? 12 : 6} 
                      fill={shadowColor}
                      className={isActive ? "animate-pulse" : ""}
                    />

                    {/* Hard square brutalist nodes */}
                    <rect 
                      x={stream.projX - (isActive ? 4.5 : 3)} 
                      y={stream.projY - (isActive ? 4.5 : 3)} 
                      width={isActive ? 9 : 6} 
                      height={isActive ? 9 : 6} 
                      className={`${activeColor} transition-all duration-300 stroke-1`}
                    />

                    {/* Tooltip Hover Tag inside SVG */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <rect 
                        x={stream.projX + 10} 
                        y={stream.projY - 18} 
                        width="110" 
                        height="26" 
                        fill={theme === "light" ? "#ffffff" : "#0a0a0f"} 
                        stroke={theme === "light" ? "#18181b" : "#312e81"} 
                        strokeWidth="1.5"
                      />
                      <text 
                        x={stream.projX + 16} 
                        y={stream.projY - 6} 
                        fontSize="8" 
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill={theme === "light" ? "#18181b" : "#f4f4f5"}
                      >
                        {stream.name.length > 18 ? `${stream.name.slice(0, 15)}...` : stream.name}
                      </text>
                      <text 
                        x={stream.projX + 16} 
                        y={stream.projY + 3} 
                        fontSize="6" 
                        fontFamily="monospace"
                        fill="#6366f1"
                      >
                        {stream.cityName} ({stream.country})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Legend and Scale Terminal Footer[cite: 1] */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] font-bold border-t-2 pt-3.5 uppercase ${
        theme === "light" ? "text-zinc-600 border-zinc-900" : "text-neutral-500 border-neutral-800"
      }`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-none bg-emerald-500 relative flex"><span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75" /></span>
            Active links
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-none bg-amber-500" />
            Unstable node
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-none bg-rose-500" />
            Terminal offline
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 font-bold">
          <Compass className={`w-3.5 h-3.5 ${theme === "light" ? "text-zinc-500" : "text-neutral-500"}`} />
          <span>{is3DMode ? "ORTHOGRAPHIC 3D GLOBE SPHERE" : "EQUIRECTANGULAR HYBRID SATELLITE"}</span>
        </div>
      </div>
    </div>
  );
}