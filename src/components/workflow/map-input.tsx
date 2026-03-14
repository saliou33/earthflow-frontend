"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Map, { Source, Layer, useMap, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { MousePointer2, Scissors, Square, Circle, Trash2, MapIcon, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapInputProps {
  value?: any;
  onChange: (value: any) => void;
}

const MAP_STYLES = [
  { id: "dark", label: "Dark Matter", url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
  { id: "light", label: "Positron", url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
  { id: "voyager", label: "Voyager", url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" },
];

export function MapInput({ value, onChange }: MapInputProps) {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 1
  });

  const [mode, setMode] = useState<"point" | "polygon" | "none">("none");
  const [points, setPoints] = useState<[number, number][]>([]);
  const [mapStyle, setMapStyle] = useState(MAP_STYLES[0].url);

  // Initialize from value if exists
  useEffect(() => {
    if (value && value.geometry && value.geometry.coordinates) {
        if (value.geometry.type === "Point") {
            setPoints([value.geometry.coordinates]);
        } else if (value.geometry.type === "Polygon") {
            // Take the first ring and remove last point (closed ring)
            const coords = value.geometry.coordinates[0];
            setPoints(coords.slice(0, coords.length - 1));
        }
    }
  }, [value]);

  const onMapClick = useCallback((e: any) => {
    if (mode === "none") return;

    const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    if (mode === "point") {
        const geojson = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: newPoint
            },
            properties: {}
        };
        onChange(geojson);
        setPoints([newPoint]);
        setMode("none");
    } else if (mode === "polygon") {
        const newPoints = [...points, newPoint];
        setPoints(newPoints);
        
        if (newPoints.length >= 3) {
            const geojson = {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [[...newPoints, newPoints[0]]] // Close the polygon
                },
                properties: {
                    area: "Calculated Area" // Placeholder
                }
            };
            onChange(geojson);
        }
    }
  }, [mode, points, onChange]);

  const clear = () => {
      setPoints([]);
      onChange(null);
  };

  const geojsonData = points.length > 0 ? {
      type: "FeatureCollection",
      features: [
          {
              type: "Feature",
              geometry: points.length === 1 ? {
                  type: "Point",
                  coordinates: points[0]
              } : {
                  type: "Polygon",
                  coordinates: [points.length >= 3 ? [...points, points[0]] : points]
              },
              properties: {}
          }
      ]
  } : null;

  return (
    <div className="space-y-3">
        <div className="flex items-center justify-between gap-1 p-1 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-0.5">
                <Button 
                    variant={mode === "point" ? "secondary" : "ghost"} 
                    size="icon" 
                    className="size-7 rounded"
                    onClick={() => { setMode("point"); setPoints([]); }}
                    title="Draw Point"
                >
                    <MousePointer2 className="size-3.5" />
                </Button>
                <Button 
                    variant={mode === "polygon" ? "secondary" : "ghost"} 
                    size="icon" 
                    className="size-7 rounded"
                    onClick={() => { setMode("polygon"); setPoints([]); }}
                    title="Draw Polygon"
                >
                    <Square className="size-3.5" />
                </Button>
            </div>

            <div className="flex items-center gap-1 border-l pl-1 ml-0.5">
                {MAP_STYLES.map(style => (
                    <button
                        key={style.id}
                        onClick={() => setMapStyle(style.url)}
                        className={cn(
                            "size-5 rounded-full border transition-all",
                            mapStyle === style.url ? "border-primary ring-1 ring-primary ring-offset-1 ring-offset-background" : "border-transparent opacity-50 hover:opacity-100"
                        )}
                        style={{ backgroundColor: style.id === 'dark' ? '#000' : style.id === 'light' ? '#eee' : '#ddd' }}
                        title={style.label}
                    />
                ))}
            </div>
            
            <div className="flex-1" />
            
            <Button 
                variant="ghost" 
                size="icon" 
                className="size-7 rounded text-destructive hover:bg-destructive/10"
                onClick={clear}
                title="Clear Drawing"
            >
                <Trash2 className="size-3.5" />
            </Button>
        </div>

        <div className="relative h-56 w-full rounded-xl overflow-hidden border shadow-inner group bg-muted/10">
            <Map
                {...viewState}
                onMove={(evt: any) => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                onClick={onMapClick}
                cursor={mode !== "none" ? "crosshair" : "grab"}
            >
                <NavigationControl position="top-right" showCompass={false} />
                
                {geojsonData && (
                    <Source type="geojson" data={geojsonData as any}>
                        <Layer 
                            id="point-shadow"
                            type="circle"
                            filter={['==', '$type', 'Point']}
                            paint={{
                                'circle-radius': 6,
                                'circle-color': '#3b82f6',
                                'circle-opacity': 0.4,
                                'circle-blur': 1
                            }}
                        />
                        <Layer 
                            id="point"
                            type="circle"
                            filter={['==', '$type', 'Point']}
                            paint={{
                                'circle-radius': 4,
                                'circle-color': '#fff',
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#3b82f6'
                            }}
                        />
                        <Layer 
                            id="polygon-fill"
                            type="fill"
                            filter={['==', '$type', 'Polygon']}
                            paint={{
                                'fill-color': '#3b82f6',
                                'fill-opacity': 0.2
                            }}
                        />
                        <Layer 
                            id="polygon-outline"
                            type="line"
                            filter={['==', '$type', 'Polygon']}
                            paint={{
                                'line-color': '#3b82f6',
                                'line-width': 2,
                                'line-dasharray': [2, 2]
                            }}
                        />
                    </Source>
                )}
            </Map>
            
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm border rounded flex items-center gap-1.5 pointer-events-none">
                <MapIcon className="size-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                    {mode === "none" ? "Interactive Canvas" : `Sketching ${mode}`}
                </span>
            </div>
        </div>
        
        {points.length > 0 && (
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-300">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {points.length} Geopoints captured
                </span>
                <span className="text-[9px] font-mono opacity-50 bg-muted px-1.5 py-0.5 rounded">
                    {viewState.zoom.toFixed(1)}z
                </span>
            </div>
        )}
    </div>
  );
}
