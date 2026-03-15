"use client";

import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import Map, { Source, Layer, useMap, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { Hand, MousePointer2, Plus, Square, Circle, Trash2, MapIcon, Maximize2, X, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
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
    mode: "point" | "polygon" | "rectangle" | "none" | "edit";
    setMode: (mode: "point" | "polygon" | "rectangle" | "none" | "edit") => void;
    setPoints: (points: [number, number][]) => void;
    mapStyle: string;
    setMapStyle: (style: string) => void;
    clear: () => void;
    resetView: () => void;
    navigateFeature: (dir: number) => void;
    featureCount: number;
    isFullscreen: boolean;
    setIsFullscreen: (v: boolean) => void;
    className?: string;
}

interface MapViewProps {
    viewState: any;
    setViewState: (s: any) => void;
    mapStyle: string;
    onMapClick: (e: any) => void;
    onMouseMove: (e: any) => void;
    onMapDblClick: (e: any) => void;
    onContextMenu: (e: any) => void;
    contextMenu: { x: number, y: number, featureId: string } | null;
    setContextMenu: (v: any) => void;
    deleteFeature: (id: string) => void;
    zoomToFeature: (id: string) => void;
    mode: "point" | "polygon" | "rectangle" | "none" | "edit";
    geojsonData: any;
    tempGeojson: any;
    isFullscreen: boolean;
    setIsFullscreen: (v: boolean) => void;
    setMode: (mode: "point" | "polygon" | "rectangle" | "none" | "edit") => void;
    setPoints: (points: [number, number][]) => void;
    setMapStyle: (style: string) => void;
    clear: () => void;
    resetView: () => void;
    navigateFeature: (dir: number) => void;
    featureCount: number;
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
    resetView,
    navigateFeature,
    featureCount,
    isFullscreen, 
    setIsFullscreen, 
    className 
}: ControlsToolbarProps) => (
  <div className={cn("flex items-center justify-between gap-1 p-1 bg-background/80 backdrop-blur-md rounded-xl border shadow-sm px-2 py-1.5", className)}>
      <div className="flex items-center gap-1">
          <Button 
              variant={mode === "edit" ? "secondary" : "ghost"} 
              size="icon" 
              className="size-8 rounded-lg"
              onClick={() => { setMode("edit"); }}
              title="Selection Mode"
          >
              <Hand className="size-4" />
          </Button>
          <Button 
              variant={mode === "point" ? "secondary" : "ghost"} 
              size="icon" 
              className="size-8 rounded-lg"
              onClick={() => { setMode("point"); setPoints([]); }}
              title="Draw Point"
          >
              <Plus className="size-4" />
          </Button>
          <Button 
              variant={mode === "rectangle" ? "secondary" : "ghost"} 
              size="icon" 
              className="size-8 rounded-lg"
              onClick={() => { setMode("rectangle"); setPoints([]); }}
              title="Draw Rectangle"
          >
              <Square className="size-4" />
          </Button>
          <Button 
              variant={mode === "polygon" ? "secondary" : "ghost"} 
              size="icon" 
              className="size-8 rounded-lg"
              onClick={() => { setMode("polygon"); setPoints([]); }}
              title="Draw Polygon"
          >
              <MousePointer2 className="size-4" />
          </Button>
      </div>

      {isFullscreen && featureCount > 0 && (
          <div className="flex items-center gap-0.5 border-l pl-1.5 ml-1">
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-7 rounded-md hover:bg-muted"
                  onClick={() => navigateFeature(-1)}
                  title="Previous Feature"
              >
                  <ChevronLeft className="size-4" />
              </Button>
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-7 rounded-md hover:bg-muted"
                  onClick={() => navigateFeature(1)}
                  title="Next Feature"
              >
                  <ChevronRight className="size-4" />
              </Button>
          </div>
      )}

      {isFullscreen && (
          <div className="flex items-center gap-1.5 border-l pl-2 ml-1">
              {MAP_STYLES.map(style => (
                  <button
                      key={style.id}
                      onClick={() => setMapStyle(style.url)}
                      className={cn(
                          "size-5 rounded-full border-2 transition-all",
                          mapStyle === style.url ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-60 hover:opacity-100 hover:scale-110"
                      )}
                      style={{ 
                        backgroundColor: style.id === 'dark' ? '#000' : style.id === 'light' ? '#eee' : '#ddd',
                        borderColor: style.id === 'dark' && mapStyle !== style.url ? 'rgba(255,255,255,0.2)' : 'transparent'
                      }}
                      title={style.label}
                  />
              ))}
          </div>
      )}
      
      <div className="flex items-center gap-0.5 border-l pl-1.5 ml-1">
          {isFullscreen && (
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8 rounded-lg hover:bg-muted"
                  onClick={resetView}
                  title="Reset View"
              >
                  <RotateCcw className="size-4" />
              </Button>
          )}
          <Button 
              variant="ghost" 
              size="icon" 
              className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
              onClick={clear}
              title="Clear All"
          >
              <Trash2 className="size-4" />
          </Button>
          {!isFullscreen && (
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8 rounded-lg ml-0.5"
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
    onMouseMove,
    onMapDblClick,
    onContextMenu,
    contextMenu,
    setContextMenu,
    deleteFeature,
    zoomToFeature,
    mode, 
    geojsonData, 
    tempGeojson,
    isFullscreen, 
    setIsFullscreen,
    setMode,
    setPoints,
    setMapStyle,
    clear,
    resetView,
    navigateFeature,
    featureCount,
    className 
}: MapViewProps) => (
  <div className={cn("relative w-full rounded-xl overflow-hidden border shadow-inner group bg-muted/10", className)}>
      <Map
          {...viewState}
          onMove={(evt: any) => {
              setViewState(evt.viewState);
              if (contextMenu) setContextMenu(null);
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle}
          onClick={(e) => {
              onMapClick(e);
              if (contextMenu) setContextMenu(null);
          }}
          onMouseMove={onMouseMove}
          onDblClick={onMapDblClick}
          onContextMenu={onContextMenu}
          doubleClickZoom={false}
          cursor={mode !== "none" && mode !== "edit" ? "crosshair" : "grab"}
          attributionControl={false}
      >
          <NavigationControl position={isFullscreen ? "bottom-right" : "top-right"} showCompass={false} />
          
          {geojsonData && (
              <Source type="geojson" data={geojsonData}>
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
                          'line-width': 2
                      }}
                  />
                  <Layer 
                      id="point"
                      type="circle"
                      filter={['==', '$type', 'Point']}
                      paint={{
                          'circle-radius': 5,
                          'circle-color': '#fff',
                          'circle-stroke-width': 2,
                          'circle-stroke-color': '#3b82f6'
                      }}
                  />
              </Source>
          )}

          {tempGeojson && (
              <Source type="geojson" data={tempGeojson}>
                   <Layer 
                      id="temp-poly"
                      type="fill"
                      filter={['==', '$type', 'Polygon']}
                      paint={{
                          'fill-color': '#3b82f6',
                          'fill-opacity': 0.15
                      }}
                  />
                  <Layer 
                      id="temp-line"
                      type="line"
                      filter={['==', '$type', 'LineString']}
                      paint={{
                          'line-color': '#3b82f6',
                          'line-width': 2,
                          'line-dasharray': [2, 2]
                      }}
                  />
                  <Layer 
                      id="temp-point"
                      type="circle"
                      filter={['==', '$type', 'Point']}
                      paint={{
                          'circle-radius': ['case', ['boolean', ['get', 'isClosable'], false], 8, 4],
                          'circle-color': ['case', ['boolean', ['get', 'isClosable'], false], '#22c55e', '#3b82f6'],
                          'circle-opacity': 0.8,
                          'circle-stroke-width': ['case', ['boolean', ['get', 'isClosable'], false], 2, 0],
                          'circle-stroke-color': '#fff'
                      }}
                  />
              </Source>
          )}

          {contextMenu && (
              <div 
                  className="absolute z-50 bg-background/95 backdrop-blur-md border shadow-2xl rounded-lg p-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-200"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
              >
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-[10px] h-8 gap-2 font-bold uppercase tracking-wider"
                      onClick={() => zoomToFeature(contextMenu.featureId)}
                  >
                      <MapIcon className="size-3.5" />
                      Zoom To
                  </Button>
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-[10px] h-8 gap-2 font-bold uppercase tracking-wider text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteFeature(contextMenu.featureId)}
                  >
                      <Trash2 className="size-3.5" />
                      Delete
                  </Button>
              </div>
          )}
      </Map>
      
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm border rounded-lg flex items-center gap-1.5 pointer-events-none shadow-sm">
          <MapIcon className="size-3 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
              {mode === "none" ? "Interactive Canvas" : mode === "edit" ? "Ready to Select" : `Drawing ${mode.toUpperCase()}`}
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
                resetView={resetView}
                navigateFeature={navigateFeature}
                featureCount={featureCount}
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
  const DEFAULT_VIEW = {
    longitude: 0,
    latitude: 0,
    zoom: 1
  };

  const [viewState, setViewState] = useState(DEFAULT_VIEW);
  const [mode, setMode] = useState<"point" | "polygon" | "rectangle" | "none" | "edit">("none");
  const [features, setFeatures] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [hoverPoint, setHoverPoint] = useState<[number, number] | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, featureId: string } | null>(null);
  const [mapStyle, setMapStyle] = useState(MAP_STYLES[0].url);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize from value if exists - ONLY once or when external value changes
  useEffect(() => {
    if (value && value.type === "FeatureCollection") {
        setFeatures(value.features || []);
    } else if (value && value.type === "Feature") {
        setFeatures([value]);
    } else if (!value) {
        setFeatures([]);
    }
  }, [value]);

  const onMouseMove = useCallback((e: any) => {
    if (mode === "none" || mode === "edit") return;
    setHoverPoint([e.lngLat.lng, e.lngLat.lat]);
  }, [mode]);

  const onContextMenu = useCallback((e: any) => {
    e.originalEvent.preventDefault();
    const map = e.target;
    // Layer matching for features - check fill, outline, and points
    const hitFeatures = map.queryRenderedFeatures(e.point, { 
        layers: ['point', 'polygon-fill', 'polygon-outline'] 
    });
    
    if (hitFeatures.length > 0) {
        // Mapbox/Maplibre sometimes returns ID as top-level or in properties
        const featureId = hitFeatures[0].id || hitFeatures[0].properties?.id;
        if (featureId) {
            setContextMenu({
                x: e.point.x,
                y: e.point.y,
                featureId: String(featureId)
            });
        }
    } else {
        setContextMenu(null);
    }
  }, []);

  const deleteFeature = useCallback((id: string) => {
      setFeatures(prev => {
          const updated = prev.filter(f => String(f.id) !== String(id));
          onChange({
              type: "FeatureCollection",
              features: updated
          });
          return updated;
      });
      setContextMenu(null);
  }, [onChange]);

  const zoomToFeature = useCallback((id: string) => {
      const feature = features.find(f => f.id === id);
      if (!feature) return;

      let lon, lat;
      if (feature.geometry.type === "Point") {
          [lon, lat] = feature.geometry.coordinates;
      } else if (feature.geometry.type === "Polygon") {
          // Simple centroid for zoom
          const coords = feature.geometry.coordinates[0];
          lon = coords.reduce((sum: number, c: any) => sum + c[0], 0) / coords.length;
          lat = coords.reduce((sum: number, c: any) => sum + c[1], 0) / coords.length;
      }

      if (lon !== undefined && lat !== undefined) {
          setViewState({
              ...viewState,
              longitude: lon,
              latitude: lat,
              zoom: Math.max(viewState.zoom, 10),
              transitionDuration: 500
          });
      }
      setContextMenu(null);
  }, [features, viewState]);

  const navigateFeature = useCallback((dir: number) => {
      if (features.length === 0) return;
      
      const nextIndex = selectedIndex === -1 
          ? (dir > 0 ? 0 : features.length - 1)
          : (selectedIndex + dir + features.length) % features.length;
      
      setSelectedIndex(nextIndex);
      zoomToFeature(features[nextIndex].id);
  }, [features, selectedIndex, zoomToFeature]);

  const cancelDrawing = useCallback(() => {
    setPoints([]);
    setHoverPoint(null);
  }, []);

  const finalizeFeature = useCallback((geometry: any, nextMode: "point" | "polygon" | "rectangle" | "none" | "edit" = "edit") => {
    const id = Math.random().toString(36).substr(2, 9);
    const newFeature = {
        type: "Feature" as const,
        id,
        geometry,
        properties: { 
            id, // Keep in properties for easier mapping in queryRenderedFeatures
            created_at: new Date().toISOString() 
        }
    };
    const updatedFeatures = [...features, newFeature];
    setFeatures(updatedFeatures);
    onChange({
        type: "FeatureCollection",
        features: updatedFeatures
    });
    cancelDrawing();
    setMode(nextMode);
  }, [features, onChange, cancelDrawing]);

  const onMapClick = useCallback((e: any) => {
    if (mode === "none" || mode === "edit") return;

    const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    if (mode === "point") {
        finalizeFeature({ type: "Point", coordinates: newPoint }, "point");
    } else if (mode === "polygon") {
        if (points.length >= 3) {
            const first = points[0];
            const dist = Math.sqrt(Math.pow(first[0] - newPoint[0], 2) + Math.pow(first[1] - newPoint[1], 2));
            // Doubled threshold for even easier closing (2.0 instead of 1.0)
            if (dist < 2.0 / Math.pow(2, viewState.zoom)) { 
                finalizeFeature({ type: "Polygon", coordinates: [[...points, points[0]]] });
                return;
            }
        }
        setPoints([...points, newPoint]);
    } else if (mode === "rectangle") {
        if (points.length === 0) {
            setPoints([newPoint]);
        } else {
            const start = points[0];
            const end = newPoint;
            const coords = [[
                [start[0], start[1]],
                [end[0], start[1]],
                [end[0], end[1]],
                [start[0], end[1]],
                [start[0], start[1]]
            ]];
            finalizeFeature({ type: "Polygon", coordinates: coords });
        }
    }
  }, [mode, points, finalizeFeature, viewState.zoom]);

  const onMapDblClick = useCallback((e: any) => {
    if (mode === "polygon" && points.length >= 3) {
        e.originalEvent.preventDefault();
        finalizeFeature({ type: "Polygon", coordinates: [[...points, points[0]]] });
    }
  }, [mode, points, finalizeFeature]);

  const clear = useCallback(() => {
      setFeatures([]);
      cancelDrawing();
      onChange(null);
  }, [onChange, cancelDrawing]);

  const resetView = useCallback(() => {
    setViewState(DEFAULT_VIEW);
  }, []);

  const geojsonData = useMemo(() => ({
      type: "FeatureCollection",
      features: features
  }), [features]);

  const tempGeojson = useMemo(() => {
    if (points.length === 0) return null;
    
    const feats: any[] = [];
    
    if (mode === "polygon") {
        const isClosable = points.length >= 3 && hoverPoint && (
            Math.sqrt(Math.pow(points[0][0] - hoverPoint[0], 2) + Math.pow(points[0][1] - hoverPoint[1], 2)) < 2.0 / Math.pow(2, viewState.zoom)
        );

        feats.push({ 
            type: "Feature", 
            geometry: { type: "LineString", coordinates: hoverPoint ? [...points, hoverPoint] : points }, 
            properties: {} 
        });

        points.forEach((p, i) => {
            feats.push({ 
                type: "Feature", 
                geometry: { type: "Point", coordinates: p }, 
                properties: { 
                    isFirst: i === 0,
                    isClosable: i === 0 && isClosable
                } 
            });
        });
    } else if (mode === "rectangle" && points.length === 1 && hoverPoint) {
        const start = points[0];
        const end = hoverPoint;
        feats.push({
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [[
                    [start[0], start[1]],
                    [end[0], start[1]],
                    [end[0], end[1]],
                    [start[0], end[1]],
                    [start[0], start[1]]
                ]]
            },
            properties: {}
        });
    } else {
        feats.push({ type: "Feature", geometry: { type: "Point", coordinates: points[0] }, properties: {} });
    }
    
    return { type: "FeatureCollection", features: feats };
  }, [points, hoverPoint, mode, viewState.zoom]);

  return (
    <div className="space-y-3">
        <ControlsToolbar 
            mode={mode}
            setMode={setMode}
            setPoints={setPoints}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
            clear={clear}
            resetView={resetView}
            navigateFeature={navigateFeature}
            featureCount={features.length}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
        />
        <MapView 
            className="h-56" 
            viewState={viewState}
            setViewState={setViewState}
            mapStyle={mapStyle}
            onMapClick={onMapClick}
            onMouseMove={onMouseMove}
            onMapDblClick={onMapDblClick}
            onContextMenu={onContextMenu}
            contextMenu={contextMenu}
            setContextMenu={setContextMenu}
            deleteFeature={deleteFeature}
            zoomToFeature={zoomToFeature}
            mode={mode}
            geojsonData={geojsonData}
            tempGeojson={tempGeojson}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            setMode={setMode}
            setPoints={setPoints}
            setMapStyle={setMapStyle}
            clear={clear}
            resetView={resetView}
            navigateFeature={navigateFeature}
            featureCount={features.length}
        />
        
        {features.length > 0 && (
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-300">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {features.length} Features captured
                </span>
                <span className="text-[9px] font-mono opacity-50 bg-muted px-1.5 py-0.5 rounded">
                    {viewState.zoom.toFixed(1)}z
                </span>
            </div>
        )}

        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-2xl" showCloseButton={false}>
                <DialogHeader className="sr-only">
                    <DialogTitle>Map Fullscreen View</DialogTitle>
                    <DialogDescription>Interactive map for drawing and viewing geometries in full screen.</DialogDescription>
                </DialogHeader>
                <div className="relative w-full h-full">
                    <MapView 
                        className="rounded-none border-none h-full" 
                        viewState={viewState}
                        setViewState={setViewState}
                        mapStyle={mapStyle}
                        onMapClick={onMapClick}
                        onMouseMove={onMouseMove}
                        onMapDblClick={onMapDblClick}
                        onContextMenu={onContextMenu}
                        contextMenu={contextMenu}
                        setContextMenu={setContextMenu}
                        deleteFeature={deleteFeature}
                        zoomToFeature={zoomToFeature}
                        mode={mode}
                        geojsonData={geojsonData}
                        tempGeojson={tempGeojson}
                        isFullscreen={isFullscreen}
                        setIsFullscreen={setIsFullscreen}
                        setMode={setMode}
                        setPoints={setPoints}
                        setMapStyle={setMapStyle}
                        clear={clear}
                        resetView={resetView}
                        navigateFeature={navigateFeature}
                        featureCount={features.length}
                    />
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
