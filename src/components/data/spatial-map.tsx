"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Map, { Source, Layer, NavigationControl, FullscreenControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  Maximize2, 
  Minimize2, 
  Layers, 
  Palette, 
  Info, 
  Map as MapIcon, 
  MousePointer2,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import maplibregl from 'maplibre-gl';
import { cogProtocol } from '@geomatico/maplibre-cog-protocol';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";

interface SpatialMapPreviewProps {
  asset?: any;
  presignedUrl?: string | null;
  fullHeight?: boolean;
}

const MAP_STYLES = [
  { id: "dark", label: "Dark Matter", url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
  { id: "light", label: "Positron", url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
  { id: "voyager", label: "Voyager", url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" },
];

// Register COG protocol globally
if (typeof window !== 'undefined') {
    try {
        maplibregl.addProtocol('cog', cogProtocol);
    } catch (e) {
        // Handle potential double registration in HMR
        console.warn("MapLibre COG protocol already registered or failed:", e);
    }
}

export const SpatialMapPreview = memo(function SpatialMapPreview({ asset, presignedUrl, fullHeight }: SpatialMapPreviewProps) {
    const [geoJson, setGeoJson] = useState<any>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [mapStyle, setMapStyle] = useState(MAP_STYLES[0].url);
    const [featureColor, setFeatureColor] = useState("#3b82f6");
    const [opacity, setOpacity] = useState(0.8);
    const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, longitude: number, latitude: number } | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [tileUrlTemplate, setTileUrlTemplate] = useState<string | null>(null);
    const [tileJsonUrl, setTileJsonUrl] = useState<string | null>(null);
    const [viewState, setViewState] = useState({
        longitude: 0,
        latitude: 0,
        zoom: 1.5
    });

    useEffect(() => {
        if (presignedUrl && asset?.asset_type === "VECTOR") {
            fetch(presignedUrl)
                .then(res => res.json())
                .then(data => {
                    setGeoJson(data);
                    // Reset selected index when new data arrives
                    setSelectedIndex(-1);
                })
                .catch(err => console.error("Failed to fetch asset for map:", err));
        } else if (asset?.asset_type === "RASTER") {
            // Clear vector data
            setGeoJson(null);
            // Fetch the unified URL endpoint
            apiClient.get(`v1/assets/${asset.id}/url`)
                .then(res => {
                    if (res.data.url_template) {
                        setTileUrlTemplate(res.data.url_template);
                        setTileJsonUrl(res.data.tilejson_url);
                        
                        // Use TileJSON for better metadata (includes min/max zoom)
                        const infoUrl = res.data.tilejson_url || res.data.url_template;
                        
                        fetch(infoUrl)
                            .then(r => r.json())
                            .then(info => {
                                let lon = 0, lat = 0, zoom = 8;
                                
                                if (info.center) {
                                    lon = info.center[0];
                                    lat = info.center[1];
                                    zoom = info.center[2] || Math.max(info.minzoom || 2, 14);
                                } else if (info.bounds) {
                                    const [minX, minY, maxX, maxY] = info.bounds;
                                    lon = (minX + maxX) / 2;
                                    lat = (minY + maxY) / 2;
                                    
                                    // Dynamic zoom calculation
                                    const latDiff = Math.abs(maxY - minY);
                                    const lonDiff = Math.abs(maxX - minX);
                                    const maxDiff = Math.max(latDiff, lonDiff);
                                    if (maxDiff > 0) {
                                        zoom = Math.min(18, Math.max(2, Math.floor(Math.log2(360 / maxDiff)) - 1));
                                    }
                                    
                                    // Clamp to minzoom if available
                                    if (info.minzoom !== undefined) {
                                        zoom = Math.max(zoom, info.minzoom);
                                    }
                                }

                                if (lon !== 0 || lat !== 0) {
                                    setViewState(prev => ({
                                        ...prev,
                                        longitude: lon,
                                        latitude: lat,
                                        zoom: zoom
                                    }));
                                }
                            })
                            .catch(e => console.error("Failed to fetch raster info for auto-zoom:", e));
                    }
                })
                .catch(err => console.error("Failed to fetch asset URL:", err));
        } else {
            setGeoJson(null);
            setTileUrlTemplate(null);
            setTileJsonUrl(null);
        }
    }, [presignedUrl, asset?.asset_type, asset?.id]);

    const onHover = useCallback((event: any) => {
        const {
            lngLat,
            point: { x, y }
        } = event;
        if (lngLat) {
            setHoverInfo({ x, y, longitude: lngLat.lng, latitude: lngLat.lat });
        }
    }, []);

    const zoomToFeature = useCallback((index: number) => {
        if (!geoJson?.features?.[index]) return;
        const feature = geoJson.features[index];
        
        let lon: number | undefined, lat: number | undefined;
        if (feature.geometry.type === "Point") {
            [lon, lat] = feature.geometry.coordinates;
        } else if (feature.geometry.type === "Polygon") {
            const coords = feature.geometry.coordinates[0];
            lon = coords.reduce((sum: number, c: [number, number]) => sum + c[0], 0) / coords.length;
            lat = coords.reduce((sum: number, c: [number, number]) => sum + c[1], 0) / coords.length;
        }

        if (lon !== undefined && lat !== undefined) {
            setViewState(prev => ({
                ...prev,
                longitude: lon,
                latitude: lat,
                zoom: Math.max(prev.zoom, 10)
            }));
        }
    }, [geoJson]);

    const navigateFeature = useCallback((dir: number) => {
        if (!geoJson?.features?.length) return;
        
        const nextIndex = selectedIndex === -1 
            ? (dir > 0 ? 0 : geoJson.features.length - 1)
            : (selectedIndex + dir + geoJson.features.length) % geoJson.features.length;
        
        setSelectedIndex(nextIndex);
        zoomToFeature(nextIndex);
    }, [geoJson, selectedIndex, zoomToFeature]);

    const MapContent = (isFull: boolean) => (
        <div className={cn(
            "relative overflow-hidden group/map",
            (isFull || fullHeight) ? "w-full h-full rounded-none" : "h-[450px] rounded-2xl border-2 border-primary/10 shadow-2xl transition-all duration-500 bg-black"
        )}
        onMouseLeave={() => setHoverInfo(null)}
        >
            {/* Map UI Overlays */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                 <div className="bg-background/80 backdrop-blur-md shadow-xl border rounded-xl p-3 text-[10px] space-y-2 pointer-events-auto min-w-[140px]">
                    <p className="font-black border-b border-primary/20 pb-1 mb-1 tracking-widest text-primary uppercase">Feature Info</p>
                    <div className="flex items-center gap-2">
                        <Layers className="size-3 text-primary" />
                        <span className="font-bold truncate max-w-[120px]">{asset?.name || "Result Geometry"}</span>
                    </div>
                    {geoJson && (
                        <div className="flex items-center gap-2 opacity-60">
                            <Info className="size-3" />
                            <span>{geoJson.features?.length || 0} Features</span>
                        </div>
                    )}
                    {selectedIndex !== -1 && geoJson && (
                        <div className="pt-1 border-t border-primary/10 text-primary font-bold">
                            Focus: {selectedIndex + 1} of {geoJson.features.length}
                        </div>
                    )}
                </div>

                {hoverInfo && (
                    <div className="bg-black/80 backdrop-blur-md text-white border border-white/10 rounded-lg p-2 text-[9px] font-mono shadow-2xl animate-in fade-in slide-in-from-left-2">
                        <div className="flex items-center gap-2">
                             <span className="text-primary font-bold">LNG:</span> {hoverInfo.longitude.toFixed(6)}
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-primary font-bold">LAT:</span> {hoverInfo.latitude.toFixed(6)}
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                {geoJson?.features?.length > 0 && (
                    <div className="flex items-center bg-background/80 backdrop-blur-md rounded-xl border border-primary/20 p-1 shadow-lg">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-7 rounded-lg hover:bg-primary/10"
                            onClick={() => navigateFeature(-1)}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-7 rounded-lg hover:bg-primary/10"
                            onClick={() => navigateFeature(1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="h-9 px-3 gap-2 bg-background/80 backdrop-blur-md border shadow-lg border-primary/20 hover:border-primary/50 transition-all">
                            <Palette className="size-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-tight hidden sm:block">Styling</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-4 backdrop-blur-xl bg-background/95 border-primary/20 shadow-2xl rounded-xl">
                        <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50 px-0 pb-2">Map Theme</DropdownMenuLabel>
                        <div className="grid grid-cols-1 gap-1">
                            {MAP_STYLES.map(style => (
                                <button 
                                    key={style.id} 
                                    onClick={() => setMapStyle(style.url)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-left",
                                        mapStyle === style.url ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <MapIcon className="size-3.5" />
                                    <span className="text-xs font-bold">{style.label}</span>
                                </button>
                            ))}
                        </div>
                        
                        <DropdownMenuSeparator className="my-4" />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50 px-0 pb-0">Layer Opacity</DropdownMenuLabel>
                                <span className="text-[10px] font-bold text-primary">{(opacity * 100).toFixed(0)}%</span>
                            </div>
                            <input 
                                type="range"
                                min="0"
                                max="100"
                                value={opacity * 100}
                                onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <DropdownMenuSeparator className="my-4" />
                        <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50 px-0 pb-2">Feature Color</DropdownMenuLabel>
                         <div className="grid grid-cols-5 gap-2">
                            {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"].map(c => (
                                <button 
                                    key={c}
                                    onClick={() => setFeatureColor(c)}
                                    className={cn(
                                        "size-7 rounded-full border-2 transition-all hover:scale-110 shadow-sm",
                                        featureColor === c ? "border-white ring-2 ring-primary/50 scale-110" : "border-transparent opacity-70 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {!isFull ? (
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="size-9 bg-background/80 backdrop-blur-md border shadow-lg border-primary/20 hover:border-primary/50 transition-all"
                        onClick={() => setIsMaximized(true)}
                    >
                        <Maximize2 className="size-4 text-primary" />
                    </Button>
                ) : (
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="size-9 bg-background/80 backdrop-blur-md border shadow-lg border-primary/20 hover:border-primary/50 transition-all hover:bg-destructive/10 hover:text-destructive group"
                        onClick={() => setIsMaximized(false)}
                    >
                        <X className="size-4 group-hover:scale-110 transition-transform" />
                    </Button>
                )}
            </div>

            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                onMouseMove={onHover}
            >
                <NavigationControl position="bottom-right" />
                
                {geoJson && (
                    <Source id="earthflow-vector-data" type="geojson" data={geoJson}>
                        <Layer
                            id="vector-points"
                            type="circle"
                            paint={{
                                'circle-radius': 6,
                                'circle-color': featureColor,
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#fff',
                                'circle-opacity': opacity
                            }}
                            filter={['==', '$type', 'Point']}
                        />
                        <Layer
                            id="vector-lines"
                            type="line"
                            paint={{
                                'line-color': featureColor,
                                'line-width': 3,
                                'line-opacity': opacity
                            }}
                            filter={['==', '$type', 'LineString']}
                        />
                        <Layer
                            id="vector-polygons"
                            type="fill"
                            paint={{
                                'fill-color': featureColor,
                                'fill-opacity': opacity * 0.5,
                                'fill-outline-color': '#fff'
                            }}
                            filter={['==', '$type', 'Polygon']}
                        />
                    </Source>
                )}

                {/* RASTER: Using TileJSON as primary, fallback to XYZ template */}
                {asset?.asset_type === "RASTER" && (tileJsonUrl || tileUrlTemplate) && (
                    <Source 
                        key={asset.id}
                        id="earthflow-raster-tiles" 
                        type="raster" 
                        url={tileJsonUrl || undefined}
                        tiles={!tileJsonUrl && tileUrlTemplate ? [tileUrlTemplate] : undefined}
                        tileSize={512} // TiTiler TileJSON specifies 512
                    >
                        <Layer
                            id="raster-layer"
                            type="raster"
                            paint={{
                                'raster-opacity': opacity
                            }}
                        />
                    </Source>
                )}
            </Map>
            
            {!asset && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <MapIcon className="size-8 text-primary opacity-40" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground max-w-xs leading-relaxed">
                        Map preview is only available for nodes outputting spatial assets.
                    </p>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
                 <div className="bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-primary/10 flex items-center gap-2">
                    <MousePointer2 className="size-3 text-primary animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">Interactive Canvas</span>
                 </div>
            </div>
        </div>
    );

    return (
        <div className={fullHeight ? "h-full w-full" : ""}>
            {MapContent(false)}

            {!fullHeight && (
                <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
                    <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-2xl" showCloseButton={false}>
                        <DialogHeader className="sr-only">
                            <DialogTitle>Map Fullscreen Preview</DialogTitle>
                            <DialogDescription>Interactive map for viewing captured spatial data in full screen.</DialogDescription>
                        </DialogHeader>
                        {MapContent(true)}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
});
