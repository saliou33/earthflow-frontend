"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Map, { Source, Layer, NavigationControl, FullscreenControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Maximize2, Minimize2, Layers, Palette, Info, Map as MapIcon, MousePointer2 } from "lucide-react";
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

interface SpatialMapPreviewProps {
  asset?: any;
  presignedUrl?: string;
}

const MAP_STYLES = [
  { id: "dark", label: "Dark Matter", url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
  { id: "light", label: "Positron", url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
  { id: "voyager", label: "Voyager", url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" },
];

export const SpatialMapPreview = memo(function SpatialMapPreview({ asset, presignedUrl }: SpatialMapPreviewProps) {
    const [geoJson, setGeoJson] = useState<any>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [mapStyle, setMapStyle] = useState(MAP_STYLES[0].url);
    const [featureColor, setFeatureColor] = useState("#3b82f6");
    const [opacity, setOpacity] = useState(0.8);
    const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, longitude: number, latitude: number } | null>(null);

    useEffect(() => {
        if (presignedUrl && asset?.asset_type === "VECTOR") {
            fetch(presignedUrl)
                .then(res => res.json())
                .then(data => setGeoJson(data))
                .catch(err => console.error("Failed to fetch asset for map:", err));
        }
    }, [presignedUrl, asset?.asset_type]);

    const onHover = useCallback((event: any) => {
        const {
            lngLat,
            point: { x, y }
        } = event;
        if (lngLat) {
            setHoverInfo({ x, y, longitude: lngLat.lng, latitude: lngLat.lat });
        }
    }, []);

    return (
        <div className={cn(
            "relative rounded-2xl overflow-hidden border-2 border-primary/10 shadow-2xl transition-all duration-500 bg-black group/map",
            isMaximized ? "fixed inset-4 z-50 bg-background border-primary shadow-3xl" : "h-[450px]"
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

            <div className="absolute top-4 right-4 z-10 flex gap-2">
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

                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="size-9 bg-background/80 backdrop-blur-md border shadow-lg border-primary/20 hover:border-primary/50 transition-all"
                    onClick={() => setIsMaximized(!isMaximized)}
                >
                    {isMaximized ? <Minimize2 className="size-4 text-primary" /> : <Maximize2 className="size-4 text-primary" />}
                </Button>
            </div>

            <Map
                initialViewState={{
                    longitude: 0,
                    latitude: 0,
                    zoom: 1.5
                }}
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
});
