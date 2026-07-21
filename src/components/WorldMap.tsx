import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import maplibregl from "maplibre-gl";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import "maplibre-gl/dist/maplibre-gl.css";
import { Globe, Compass, Paintbrush, MousePointer, Info } from "lucide-react";
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

const mapStyles = [
  { 
    id: "satellite", 
    label: "Satellite View", 
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    overlayUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_And_Places/MapServer/tile/{z}/{y}/{x}"
  },
  { id: "light", label: "Classic Light", url: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" },
  { id: "dark", label: "Midnight Dark", url: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" },
  { id: "retro", label: "Retro Voyager", url: "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" }
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
  const [currentMapStyle, setCurrentMapStyle] = useState("satellite");
  
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");
  const [currentZoom3d, setCurrentZoom3d] = useState(3.5);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  
  const maplibreRef = useRef<maplibregl.Map | null>(null);
  const maplibreMarkersRef = useRef<{ marker: maplibregl.Marker; lat: number; lon: number }[]>([]);

  const isInitialRenderRef = useRef(true);

  const processedStreams = useMemo(() => {
    return mapStreamsToSpannedCoordinates(streams);
  }, [streams]);

  const filteredStreams = useMemo(() => {
    return processedStreams.filter((s: StreamChannel & { cityName?: string; mappedLat: number; mappedLon: number }) => {
      const matchCat = selectedCategory === "all" || s.category === selectedCategory;
      const matchSearch = searchQuery
        ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.cityName && s.cityName.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchCat && matchSearch;
    });
  }, [processedStreams, selectedCategory, searchQuery]);

  // FIX: Corrected zoom tiers to reflect the 2.8 minZoom map bounds properly.
  const zoomTier = useMemo(() => {
    if (currentZoom3d < 4.5) return 0; // Zoomed out (Continent view)
    if (currentZoom3d < 6.5) return 1; // Mid zoom (Region view)
    return 2;                         // Zoomed in (City view)
  }, [currentZoom3d]);

  const buildClusterDropdownHtml = (clusterData: typeof filteredStreams) => {
    let listHtml = `
      <div class="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto pr-1 no-scrollbar min-w-[240px] font-mono text-xs p-2.5 shadow-2xl rounded-none border-2 border-indigo-600 bg-zinc-950 text-neutral-100">
        <div class="text-[10px] font-black uppercase tracking-wider mb-2 px-1 flex justify-between border-b-2 border-indigo-500 pb-2 text-indigo-400 bg-zinc-900/50 p-1">
          <span>CHANNELS AT POSITION</span>
          <span class="font-bold">TOTAL: ${clusterData.length}</span>
        </div>
    `;

    clusterData.forEach((stream) => {
      const statusDot = stream.status === "online" ? "bg-emerald-500" : stream.status === "unstable" ? "bg-amber-500" : "bg-rose-500";
      listHtml += `
        <div class="channel-popup-item flex items-center justify-between p-2 cursor-pointer transition-all border border-zinc-700 bg-zinc-900 hover:bg-indigo-950 hover:border-indigo-500 mb-1" data-id="${stream.id}">
          <div class="flex items-center gap-2 truncate">
            <div class="w-2.5 h-2.5 rounded-none ${statusDot} flex-shrink-0 shadow-[0_0_4px_rgba(0,0,0,0.5)]"></div>
            <div class="flex flex-col truncate">
              <span class="text-xs font-bold truncate text-white uppercase">${stream.name}</span>
              <span class="text-[9px] text-zinc-400 tracking-wider uppercase leading-none mt-0.5">SYS: ${stream.category}</span>
            </div>
          </div>
          <div class="flex-shrink-0 ml-3 text-indigo-400 font-black text-[10px] uppercase tracking-wide bg-zinc-950/80 px-1.5 py-0.5 border border-zinc-800">
            WATCH
          </div>
        </div>
      `;
    });

    listHtml += `</div>`;
    return listHtml;
  };

  const wipeMapInstances = () => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerGroupRef.current = null;
    }
    if (maplibreRef.current) {
      maplibreMarkersRef.current.forEach(m => m.marker.remove());
      maplibreMarkersRef.current = [];
      maplibreRef.current.remove();
      maplibreRef.current = null;
    }
  };

  const update3DMarkersOcclusion = (mapInstance: maplibregl.Map) => {
    if (!mapInstance) return;
    try {
      const mapAny = mapInstance as any;
      const camera = typeof mapAny.getFreeCameraOptions === "function" 
        ? mapAny.getFreeCameraOptions() 
        : null;

      if (!camera || !camera.position) return;

      const camPos = camera.position;

      maplibreMarkersRef.current.forEach(({ marker, lat, lon }) => {
        const element = marker.getElement();
        if (!element) return;

        // Remove transition so it toggles instantly without fading overhead
        element.style.transition = "none";

        const phi = ((90 - lat) * Math.PI) / 180;
        const theta = ((lon + 180) * Math.PI) / 180;

        const markerX = Math.sin(phi) * Math.cos(theta);
        const markerY = Math.sin(phi) * Math.sin(theta);
        const markerZ = Math.cos(phi);

        const lengthCam = Math.sqrt(camPos.x * camPos.x + camPos.y * camPos.y + camPos.z * camPos.z);
        if (lengthCam === 0) return;
        
        const camX = camPos.x / lengthCam;
        const camY = camPos.y / lengthCam;
        const camZ = camPos.z / lengthCam;

        const dot = camX * markerX + camY * markerY + camZ * markerZ;

        // Strictly show if on the front hemisphere, completely hide otherwise
        if (dot > 0) {
          element.style.opacity = "1";
          element.style.pointerEvents = "auto";
          element.style.display = "block";
        } else {
          element.style.opacity = "0";
          element.style.pointerEvents = "none";
          element.style.display = "none"; // Completely hidden to optimize DOM paint performance
        }
      });
    } catch (e) {
      // Fallback silently if camera options aren't fully initialized yet
    }
  };
  
  useEffect(() => {
    if (!mapContainerRef.current) return;
    wipeMapInstances();

    const selectedStyle = mapStyles.find(style => style.id === currentMapStyle) || mapStyles[0];

    if (viewMode === "2d") {
      const bounds = L.latLngBounds(L.latLng(-65, -180), L.latLng(85, 180));
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 3,
        minZoom: 2.8,
        maxZoom: 8,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer(selectedStyle.url, {
        subdomains: "abcd", maxZoom: 20, noWrap: true, bounds: bounds
      }).addTo(map);

      if (selectedStyle.overlayUrl) {
        L.tileLayer(selectedStyle.overlayUrl, {
          subdomains: "abcd", maxZoom: 20, noWrap: true, bounds: bounds
        }).addTo(map);
      }

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const markerGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false, 
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 55,
        disableClusteringAtZoom: 14, 
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="flex items-center justify-center w-8 h-8 bg-indigo-600 font-sans text-xs font-bold border border-zinc-900 text-white rounded-none cursor-pointer"><span>${count}</span></div>`,
            className: 'custom-cluster-icon',
            iconSize: [32, 32]
          });
        }
      }).addTo(map);

      markerGroup.on('clusterclick', (a: any) => {
        const childMarkers = a.layer.getAllChildMarkers();
        const clusterStreams = childMarkers.map((m: any) => m.options.streamData).filter(Boolean);
        
        const popup = L.popup({
          closeButton: false, className: 'custom-cluster-popup brutalist-popup', offset: L.point(0, -10), maxWidth: 260
        })
          .setLatLng(a.latlng)
          .setContent(buildClusterDropdownHtml(clusterStreams))
          .openOn(map);

        setTimeout(() => {
          popup.getElement()?.querySelectorAll('.channel-popup-item').forEach(item => {
            item.addEventListener('click', () => {
              const targetStream = clusterStreams.find((s: typeof clusterStreams[0]) => s.id === (item as HTMLElement).dataset.id);
              if (targetStream) { onSelectChannel(targetStream); map.closePopup(); }
            });
          });
        }, 80);
      });

      markerGroupRef.current = markerGroup;
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);

    } else {
      const layersConfig: any[] = [{ id: "base-raster", type: "raster", source: "raster-tiles" }];
      if (selectedStyle.overlayUrl) {
        layersConfig.push({ id: "overlay-raster", type: "raster", source: "overlay-tiles" });
      }

      const maplibre = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "raster-tiles": { type: "raster", tiles: [selectedStyle.url], tileSize: 256 },
            ...(selectedStyle.overlayUrl && { "overlay-tiles": { type: "raster", tiles: [selectedStyle.overlayUrl], tileSize: 256 } })
          },
          layers: layersConfig
        },
        center: [20, 35],
        zoom: currentZoom3d,
        minZoom: 2.8,
        maxZoom: 12,
        attributionControl: false
      });

      maplibre.on("style.load", () => {
        maplibre.setProjection({ type: "globe" });
        
        const mapAny = maplibre as any;
        if (typeof mapAny.setFog === 'function') {
          mapAny.setFog({
            "range": [-1, 2],
            "color": "#0d0e12",
            "high-color": "#0d0e12",
            "space-color": "#0d0e12"
          });
        }
      });

      maplibre.on("zoomend", () => {
        setCurrentZoom3d(maplibre.getZoom());
      });

      maplibre.on("move", () => update3DMarkersOcclusion(maplibre));
      maplibre.on("rotate", () => update3DMarkersOcclusion(maplibre));
      maplibre.on("pitchend", () => update3DMarkersOcclusion(maplibre));
      maplibre.on("zoomend", () => update3DMarkersOcclusion(maplibre));
      maplibre.on("render", () => update3DMarkersOcclusion(maplibre));

      maplibreRef.current = maplibre;
    }

    return () => wipeMapInstances();
  }, [viewMode, currentMapStyle]);

  useEffect(() => {
    if (viewMode === "2d" && mapRef.current && markerGroupRef.current) {
      const markerGroup = markerGroupRef.current;
      markerGroup.clearLayers();

      filteredStreams.forEach((stream) => {
        const isActive = activeChannel && activeChannel.id === stream.id;
        let pingColorClass = stream.status === "unstable" ? "bg-amber-400/40" : stream.status === "offline" ? "bg-rose-400/40" : "bg-emerald-400/40";
        let activeDotColorClass = stream.status === "unstable" ? "bg-amber-500" : stream.status === "offline" ? "bg-rose-500" : "bg-emerald-500";

        const markerHtml = isActive
          ? `<div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-9 w-9 rounded-none ${pingColorClass} animate-ping"></span>
              <span class="relative inline-flex rounded-none h-3.5 w-3.5 ${activeDotColorClass} border-2 ${theme === "light" ? "border-zinc-900" : "border-neutral-950"} shadow-sm"></span>
             </div>`
          : `<div class="relative flex items-center justify-center">
              <span class="relative inline-flex rounded-none h-2.5 w-2.5 ${activeDotColorClass} border-2 ${theme === "light" ? "border-zinc-900" : "border-neutral-950"}"></span>
             </div>`;

        const popupContent = buildClusterDropdownHtml([stream]);

        const marker = L.marker([stream.mappedLat, stream.mappedLon], {
          icon: L.divIcon({ html: markerHtml, className: "custom-map-marker-wrapper", iconSize: [24, 24] }),
          streamData: stream
        } as any).bindPopup(popupContent, { className: "custom-leaflet-popup brutalist-popup", closeButton: false, offset: [0, -6] });

        marker.on("click", () => onSelectChannel(stream));
        marker.addTo(markerGroup);
      });

    } else if (viewMode === "3d" && maplibreRef.current) {
      maplibreMarkersRef.current.forEach(m => m.marker.remove());
      maplibreMarkersRef.current = [];

      // FIX: Reversed values and scaled them up. Larger bin size = fewer markers to render when zoomed out.
      const clusteringPrecision = zoomTier === 0 ? 6.0 : zoomTier === 1 ? 2.5 : 0.5;
      
      const coordinateBins: Record<string, typeof filteredStreams> = {};
      filteredStreams.forEach((s) => {
        const latBin = Math.round(s.mappedLat / clusteringPrecision) * clusteringPrecision;
        const lonBin = Math.round(s.mappedLon / clusteringPrecision) * clusteringPrecision;
        const key = `${latBin.toFixed(2)}_${lonBin.toFixed(2)}`;
        
        if (!coordinateBins[key]) coordinateBins[key] = [];
        coordinateBins[key].push(s);
      });

      Object.values(coordinateBins).forEach((cluster) => {
        const rootNode = cluster[0];
        const el = document.createElement("div");
        el.className = "maplibre-custom-marker-node flex items-center justify-center origin-center";

        if (cluster.length > 1) {
          el.innerHTML = `<div class="flex items-center justify-center w-8 h-8 bg-indigo-600 font-sans text-xs font-bold border border-zinc-900 text-white rounded-none cursor-pointer shadow-lg"><span>${cluster.length}</span></div>`;
        } else {
          const isActive = activeChannel && activeChannel.id === rootNode.id;
          const statusColor = rootNode.status === 'unstable' ? 'bg-amber-500' : rootNode.status === 'offline' ? 'bg-rose-500' : 'bg-emerald-500';
          el.innerHTML = isActive 
            ? `<div class="relative flex items-center justify-center w-6 h-6">
                <span class="absolute inline-flex h-6 w-6 rounded-none ${statusColor}/40 animate-ping"></span>
                <span class="relative inline-flex rounded-none h-3 w-3 ${statusColor} border-2 border-zinc-900 cursor-pointer shadow-md"></span>
               </div>`
            : `<span class="relative inline-flex rounded-none h-2.5 w-2.5 ${statusColor} border-2 border-zinc-900 cursor-pointer shadow-sm"></span>`;
        }

        const maplibrePopup = new maplibregl.Popup({ closeButton: false, offset: 12, className: "brutalist-3d-popup" })
          .setHTML(buildClusterDropdownHtml(cluster));

        const marker3d = new maplibregl.Marker({ element: el })
          .setLngLat([rootNode.mappedLon, rootNode.mappedLat])
          .setPopup(maplibrePopup)
          .addTo(maplibreRef.current!);

        maplibrePopup.on("open", () => {
          maplibrePopup.getElement()?.querySelectorAll(".channel-popup-item").forEach((item) => {
            item.addEventListener("click", () => {
              const match = cluster.find((s) => s.id === (item as HTMLElement).dataset.id);
              if (match) { onSelectChannel(match); maplibrePopup.remove(); }
            });
          });
        });

        maplibreMarkersRef.current.push({ marker: marker3d, lat: rootNode.mappedLat, lon: rootNode.mappedLon });
      });

      update3DMarkersOcclusion(maplibreRef.current);
    }
  }, [filteredStreams, activeChannel, viewMode, theme, zoomTier]);

  useEffect(() => {
    if (!activeChannel) return;
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    const matched = processedStreams.find((s) => s.id === activeChannel.id);
    if (!matched) return;

    if (viewMode === "2d" && mapRef.current) {
      mapRef.current.flyTo([matched.mappedLat, matched.mappedLon], 5, { duration: 1.2 });
    } else if (viewMode === "3d" && maplibreRef.current) {
      maplibreRef.current.flyTo({ center: [matched.mappedLon, matched.mappedLat], zoom: 4.5, duration: 1200 });
    }
  }, [activeChannel, processedStreams]);

  return (
    <div className={`relative w-full border-2 p-4 md:p-5 overflow-hidden flex flex-col gap-4 font-mono transition-all rounded-none ${
      theme === "light" ? "bg-[#faf9f6] border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]" : "bg-[#0d0e12] border-neutral-800"
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            <h2 className={`text-sm font-black uppercase tracking-tight ${theme === "light" ? "text-zinc-900" : "text-neutral-100"}`}>
              Telemetry World Map
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-2 border-2 px-2.5 py-1.5 rounded-none font-bold uppercase transition-all text-xs ${
            theme === "light" ? "bg-white border-zinc-900 text-zinc-800" : "bg-neutral-950 border-neutral-800 text-neutral-300"
          }`}>
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as "2d" | "3d")}
              className={`bg-transparent text-[11px] font-bold uppercase outline-none cursor-pointer pr-1 ${theme === "light" ? "text-zinc-900" : "text-neutral-200"}`}
            >
              <option value="2d">2D Matrix</option>
              <option value="3d">3D Sphere Globe</option>
            </select>
          </div>

          <div className={`flex items-center gap-2 border-2 px-2.5 py-1.5 rounded-none font-bold uppercase transition-all text-xs ${
            theme === "light" ? "bg-white border-zinc-900 text-zinc-800" : "bg-neutral-950 border-neutral-800 text-neutral-300"
          }`}>
            <Paintbrush className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={currentMapStyle}
              onChange={(e) => setCurrentMapStyle(e.target.value)}
              className={`bg-transparent text-[11px] font-bold uppercase outline-none cursor-pointer pr-1 ${theme === "light" ? "text-zinc-900" : "text-neutral-200"}`}
            >
              {mapStyles.map((style) => (
                <option key={style.id} value={style.id}>{style.label}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className={`w-full border-2 pl-4 pr-12 py-1.5 text-xs transition-all rounded-none uppercase font-bold tracking-tight ${
                theme === "light" ? "bg-white border-zinc-900 text-zinc-900" : "bg-neutral-950 border-neutral-800 text-neutral-200"
              }`}
              placeholder="Query node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="relative w-full h-[400px] md:h-[480px] overflow-hidden border-2 z-0 p-1 rounded-none">
        <div ref={mapContainerRef} className="w-full h-full text-zinc-900 relative" style={{ background: "#0d0e12" }} />

        <div className={`absolute bottom-4 left-4 z-[1000] border-2 p-3.5 text-[10px] hidden sm:flex flex-col gap-3 rounded-none max-w-[240px] shadow-xl font-mono tracking-tight ${
          theme === "light" ? "bg-white border-zinc-900 text-zinc-900" : "bg-zinc-950/95 border-neutral-800 text-neutral-200"
        }`}>
          <div className="flex items-center gap-1.5 font-black uppercase text-xs border-b pb-1.5 border-neutral-700/50">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Map Interface Legend</span>
          </div>

          <div className="flex flex-col gap-1.5 border-b pb-2 border-neutral-700/30">
            <div className="font-bold uppercase tracking-wider text-[9px] text-indigo-400">Controls</div>
            <div className="flex items-start gap-2">
              <MousePointer className="w-3 h-3 mt-0.5 text-zinc-400 flex-shrink-0" />
              <div>
                <span className="font-bold uppercase">Left Click + Drag:</span>{" "}
                {viewMode === "3d" ? "Rotate sphere globe" : "Pan matrix space"}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-400 font-bold text-xs leading-none">±</span>
              <div>
                <span className="font-bold uppercase">Scroll / Wheel:</span> Zoom viewpoint smoothly (limited floor)
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="font-bold uppercase tracking-wider text-[9px] text-indigo-400">Node Classes</div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-none inline-block border border-zinc-900"></span>
                <span className="uppercase font-bold text-[9px]">Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-none inline-block border border-zinc-900"></span>
                <span className="uppercase font-bold text-[9px]">Unstable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-rose-500 rounded-none inline-block border border-zinc-900"></span>
                <span className="uppercase font-bold text-[9px]">Offline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 bg-indigo-600 inline-flex items-center justify-center text-[8px] font-black border border-zinc-900 text-white rounded-none">#</span>
                <span className="uppercase font-bold text-[9px]">Cluster</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}