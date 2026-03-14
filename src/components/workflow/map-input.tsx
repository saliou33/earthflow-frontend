"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import Map, { Source, Layer, useMap, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { MousePointer2, Scissors, Square, Circle, Trash2, MapIcon, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MapInputProps {
  value?: any;
  onChange: (value: any) => void;
}

interface ControlsToolbarProps {
    mode: "point" | "polygon" | "none";
    setMode: (mode: "point" | "polygon" | "none") => void;
    setPoints: (points: [number, number][]) => void;
    mapStyle: string;
    setMapStyle: (style: string) => void;
    clear: () => void;
    isFullscreen: boolean;
    setIsFullscreen: (v: boolean) => void;
    className?: string;
}

interface MapViewProps {
    viewState: any;
    setViewState: (s: any) => void;
    mapStyle: string;
    onMapClick: (e: any) => void;
    mode: "point" | "polygon" | "none";
    geojsonData: any;
    isFullscreen: boolean;
    setIsFullscreen: (v: boolean) => void;
    // For passing back to Toolbar within MapView in fullscreen
    setMode: (mode: "point" | "polygon" | "none") => void;
    setPoints: (points: [number, number][]) => void;
    setMapStyle: (style: string) => void;
    clear: () => void;
    className?: string;
}

const MAP_STYLES = [
  { id: "dark", label: "Dark Matter", url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
  { id: "light", label: "Positron", url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
  { id: "voyager", label: "Voyager", url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" },
];

const ControlsToolbar = memo(({ 
    mode, 
    setMode, 
    setPoints, 
    mapStyle, 
    setMapStyle, 
    clear, 
    isFullscreen, 
    setIsFullscreen, 
    className 
}: ControlsToolbarProps) => (
  <div className={cn("flex items-center justify-between gap-1 p-1 bg-background/80 backdrop-blur-md rounded-xl border shadow-sm px-2 py-1.5", className)}>
      <div className="flex items-center gap-1">
          <Button 
              variant={mode === "point" ? "secondary" : "ghost"} 
              size="icon" 
              className="size-8 rounded-lg"
              onClick={() => { setMode("point"); setPoints([]); }}
              title="Draw Point"
          >
              <MousePointer2 className="size-4" />
          </Button>
          <Button 
              variant={mode === "polygon" ? "secondary" : "ghost"} 
              size="icon" 
              className="size-8 rounded-lg"
              onClick={() => { setMode("polygon"); setPoints([]); }}
              title="Draw Polygon"
          >
              <Square className="size-4" />
          </Button>
      </div>

      <div className="flex items-center gap-1.5 border-l pl-2 ml-1">
          {MAP_STYLES.map(style => (
              <button
                  key={style.id}
                  onClick={() => setMapStyle(style.url)}
                  className={cn(
                      "size-5 rounded-full border-2 transition-all",
                      mapStyle === style.url ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                  style={{ backgroundColor: style.id === 'dark' ? '#000' : style.id === 'light' ? '#eee' : '#ddd' }}
                  title={style.label}
              />
          ))}
      </div>
      
      <div className="min-w-8" />
      
      <div className="flex items-center gap-1">
          <Button 
              variant="ghost" 
              size="icon" 
              className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
              onClick={clear}
              title="Clear Drawing"
          >
              <Trash2 className="size-4" />
          </Button>
          {!isFullscreen && (
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8 rounded-lg"
                  onClick={() => setIsFullscreen(true)}
                  title="Fullscreen Mode"
              >
                  <Maximize2 className="size-4" />
              </Button>
          )}
      </div>
  </div>
));

const MapView = memo(({ 
    viewState, 
    setViewState, 
    mapStyle, 
    onMapClick, 
    mode, 
    geojsonData, 
    isFullscreen, 
    setIsFullscreen,
    setMode,
    setPoints,
    setMapStyle,
    clear,
    className 
}: MapViewProps) => (
  <div className={cn("relative w-full rounded-xl overflow-hidden border shadow-inner group bg-muted/10", className)}>
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
      
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm border rounded-lg flex items-center gap-1.5 pointer-events-none shadow-sm">
          <MapIcon className="size-3 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
              {mode === "none" ? "Interactive Canvas" : `Sketching ${mode}`}
          </span>
      </div>

      {isFullscreen && (
          <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
              <ControlsToolbar 
                mode={mode}
                setMode={setMode}
                setPoints={setPoints}
                mapStyle={mapStyle}
                setMapStyle={setMapStyle}
                clear={clear}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
                className="w-fit" 
              />
              <Button 
                  variant="secondary" 
                  size="icon" 
                  className="size-10 rounded-full shadow-lg border-2" 
                  onClick={() => setIsFullscreen(false)}
              >
                  <X className="size-5" />
              </Button>
          </div>
      )}
  </div>
));

export function MapInput({ value, onChange }: MapInputProps) {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 1
  });

  const [mode, setMode] = useState<"point" | "polygon" | "none">("none");
  const [points, setPoints] = useState<[number, number][]>([]);
  const [mapStyle, setMapStyle] = useState(MAP_STYLES[0].url);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    } else if (!value) {
        setPoints([]);
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
        <ControlsToolbar 
            mode={mode}
            setMode={setMode}
            setPoints={setPoints}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
            clear={clear}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
        />
        <MapView 
            className="h-56" 
            viewState={viewState}
            setViewState={setViewState}
            mapStyle={mapStyle}
            onMapClick={onMapClick}
            mode={mode}
            geojsonData={geojsonData}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            setMode={setMode}
            setPoints={setPoints}
            setMapStyle={setMapStyle}
            clear={clear}
        />
        
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

        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                <div className="relative w-full h-full">
                    <MapView 
                        className="rounded-none border-none h-full" 
                        viewState={viewState}
                        setViewState={setViewState}
                        mapStyle={mapStyle}
                        onMapClick={onMapClick}
                        mode={mode}
                        geojsonData={geojsonData}
                        isFullscreen={isFullscreen}
                        setIsFullscreen={setIsFullscreen}
                        setMode={setMode}
                        setPoints={setPoints}
                        setMapStyle={setMapStyle}
                        clear={clear}
                    />
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
