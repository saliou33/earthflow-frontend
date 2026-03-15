import { LucideIcon, Database, MoveDiagonal, Calculator, LibrarySquare, Maximize, Play, Calendar, Layers, Table as TableIcon, Palette, Map, Scissors, Combine, RefreshCcw, Landmark, Zap, Compass, Filter as FilterIcon, Type, Hash } from "lucide-react";

export type NodeCategory = "io" | "geometry" | "analysis" | "raster" | "table" | "style";

export type ParameterType = "text" | "number" | "select" | "boolean" | "file" | "range" | "color" | "date" | "datetime"
  | "datetime-range" | "asset" | "map";

export interface NodeParameter {
  id: string;
  label: string;
  type: ParameterType;
  description?: string;
  placeholder?: string;
  default?: any;
  options?: { label: string; value: string | number }[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  accept?: string; // For file type
}

export interface NodeDefinition {
  type: string;
  label: string;
  description: string;
  category: NodeCategory;
  icon: LucideIcon;
  color: string;
  inputs?: number;
  outputs?: number;
  parameters?: NodeParameter[];
  mainParameter?: string;
}

export const NODE_CATEGORIES: { id: NodeCategory; label: string; icon: LucideIcon; color: string }[] = [
  { id: "io", label: "Data I/O", icon: LibrarySquare, color: "text-blue-500" },
  { id: "geometry", label: "Vector Ops", icon: Maximize, color: "text-orange-500" },
  { id: "raster", label: "Raster Ops", icon: Layers, color: "text-emerald-500" },
  { id: "analysis", label: "Spatial Analysis", icon: Play, color: "text-purple-500" },
  { id: "table", label: "Table Ops", icon: TableIcon, color: "text-amber-500" },
  { id: "style", label: "Cartography", icon: Palette, color: "text-pink-500" },
];

export const NODE_REGISTRY: Record<string, NodeDefinition> = {
  // --- I/O CATEGORY ---
  "source.asset": {
    type: "source.asset",
    label: "Asset",
    description: "Load an asset (Vector/Raster)",
    category: "io",
    icon: Database,
    color: "blue",
    outputs: 1,
    mainParameter: "assetId",
    parameters: [
      { id: "assetId", label: "Selected Asset", type: "asset", required: true }
    ]
  },
  "variable": {
    type: "variable",
    label: "Variable",
    description: "A dynamic variable or constant",
    category: "io",
    icon: Hash,
    color: "blue",
    outputs: 1,
    mainParameter: "label",
    parameters: [
      { id: "label", label: "Variable Name", type: "text", required: true },
      { id: "inputType", label: "Type", type: "select", default: "float", options: [{ label: "Number", value: "float" }, { label: "String", value: "string" }] },
      { id: "value", label: "Value", type: "text", required: true }
    ]
  },
  "source.wms": { type: "source.wms", label: "WMS Layer", description: "Load WMS tiles", category: "io", icon: Map, color: "blue", outputs: 1, mainParameter: "url", parameters: [{ id: "url", label: "Service URL", type: "text", required: true }, { id: "layers", label: "Layers", type: "text" }] },
  "source.wfs": { type: "source.wfs", label: "WFS Layer", description: "Load WFS features", category: "io", icon: Map, color: "blue", outputs: 1, mainParameter: "url", parameters: [{ id: "url", label: "Service URL", type: "text", required: true }, { id: "typename", label: "Type Name", type: "text" }] },
  "io.draw": { 
    type: "io.draw", 
    label: "Draw", 
    description: "Interactive geometry drawing", 
    category: "io", 
    icon: Scissors, 
    color: "blue", 
    outputs: 1, 
    mainParameter: "label",
    parameters: [
      { id: "label", label: "Geometry Name", type: "text" },
      { id: "geometry", label: "GeoJSON Data", type: "map", required: true }
    ] 
  },
  "source.postgres": {
    type: "source.postgres",
    label: "Postgres Source",
    description: "Load from external DB",
    category: "io",
    icon: Database,
    color: "blue",
    outputs: 1,
    mainParameter: "connectionName",
    parameters: [
      { id: "connectionName", label: "Connection", type: "text", required: true },
      { id: "query", label: "SQL Query", type: "text", required: true, default: "SELECT * FROM my_table" }
    ]
  },

  // --- VECTOR CATEGORY ---
  "vector.buffer": {
    type: "vector.buffer",
    label: "Buffer",
    description: "Expand or shrink geometries",
    category: "geometry",
    icon: MoveDiagonal,
    color: "orange",
    inputs: 1,
    outputs: 1,
    parameters: [
      { id: "distance", label: "Distance", type: "number", default: 100, required: true },
      { id: "segments", label: "Segments", type: "number", default: 8 }
    ]
  },
  "vector.centroid": {
    type: "vector.centroid",
    label: "Centroid",
    description: "Calculate geometry centers",
    category: "geometry",
    icon: Combine,
    color: "orange",
    inputs: 1,
    outputs: 1,
    parameters: [
      { id: "inside", label: "Force Inside", type: "boolean", default: false, description: "Ensure point is within the geometry" }
    ]
  },
  "vector.convex_hull": {
    type: "vector.convex_hull",
    label: "Convex Hull",
    description: "Smallest convex shape",
    category: "geometry",
    icon: RefreshCcw,
    color: "orange",
    inputs: 1,
    outputs: 1,
    parameters: []
  },
  "vector.simplify": {
    type: "vector.simplify",
    label: "Simplify",
    description: "Reduce geometry complexity",
    category: "geometry",
    icon: Scissors,
    color: "orange",
    inputs: 1,
    outputs: 1,
    parameters: [
      { id: "tolerance", label: "Tolerance", type: "number", default: 1.0, required: true }
    ]
  },
  "vector.intersection": {
    type: "vector.intersection",
    label: "Intersection",
    description: "Keep overlapping areas",
    category: "geometry",
    icon: Combine,
    color: "orange",
    inputs: 2,
    outputs: 1,
    parameters: [
      { id: "gridSize", label: "Grid Size", type: "number", default: 0, description: "Precision grid size" }
    ]
  },
  "vector.reproject": { type: "vector.reproject", label: "Reproject", description: "Change CRS", category: "geometry", icon: RefreshCcw, color: "orange", inputs: 1, outputs: 1, parameters: [{ id: "target_crs", label: "Target EPSG", type: "text", default: "4326" }] },

  // --- RASTER CATEGORY ---
  "raster.clip_by_extent": { type: "raster.clip_by_extent", label: "Clip Raster", description: "Clip to BBox", category: "raster", icon: Scissors, color: "emerald", inputs: 2, outputs: 1, parameters: [
      { id: "crop", label: "Crop to Cutline", type: "boolean", default: true },
      { id: "nodata", label: "NoData Value", type: "number", default: 0 }
  ] },
  "raster.statistics": { type: "raster.statistics", label: "Raster Stats", description: "Min/Max/Mean/StdDev", category: "raster", icon: Calculator, color: "emerald", inputs: 1, outputs: 1, parameters: [{ id: "bands", label: "Bands", type: "text", default: "1", placeholder: "e.g. 1,2,3" }] },
  "raster.hillshade": { type: "raster.hillshade", label: "Hillshade", description: "Terrain hillshade", category: "raster", icon: Layers, color: "emerald", inputs: 1, outputs: 1, parameters: [{ id: "azimuth", label: "Azimuth", type: "number", default: 315, min: 0, max: 360 }, { id: "altitude", label: "Altitude", type: "number", default: 45, min: 0, max: 90 }, { id: "zFactor", label: "Z Factor", type: "number", default: 1.0 }] },
  "raster.resample": { type: "raster.resample", label: "Resample", description: "Change pixel size", category: "raster", icon: RefreshCcw, color: "emerald", inputs: 1, outputs: 1, mainParameter: "resolution", parameters: [{ id: "resolution", label: "Target Resolution (m)", type: "number", required: true }, { id: "method", label: "Method", type: "select", options: [{ label: "Nearest Neighbor", value: "near" }, { label: "Bilinear", value: "bilinear" }, { label: "Cubic", value: "cubic" }, { label: "Lanczos", value: "lanczos" }] }] },
  "raster.band_math": { type: "raster.band_math", label: "Band Math", description: "Map algebra", category: "raster", icon: Calculator, color: "emerald", inputs: 2, outputs: 1, mainParameter: "expression", parameters: [{ id: "expression", label: "Algebraic Expression", type: "text", placeholder: "(B1 - B2) / (B1 + B2)", required: true }] },
  "raster.slope": { type: "raster.slope", label: "Slope", description: "Terrain slope", category: "raster", icon: Layers, color: "emerald", inputs: 1, outputs: 1, parameters: [{ id: "units", label: "Units", type: "select", options: [{ label: "Degrees", value: "degrees" }, { label: "Percent", value: "percent" }] }] },
  "raster.aspect": { type: "raster.aspect", label: "Aspect", description: "Terrain aspect", category: "raster", icon: Compass, color: "emerald", inputs: 1, outputs: 1, parameters: [] },

  // --- ANALYSIS CATEGORY ---
  "analysis.kernel_density": { type: "analysis.kernel_density", label: "Kernel Density", description: "Heatmap from points", category: "analysis", icon: Play, color: "purple", inputs: 1, outputs: 1, parameters: [{ id: "radius", label: "Search Radius", type: "number", default: 1000 }] },
  "analysis.viewshed": { type: "analysis.viewshed", label: "Viewshed", description: "Visibility analysis", category: "analysis", icon: Play, color: "purple", inputs: 2, outputs: 1, parameters: [{ id: "observer_height", label: "Observer Height", type: "number", default: 1.7 }] },
  "analysis.watershed": { type: "analysis.watershed", label: "Watershed", description: "Hydrology basins", category: "analysis", icon: Play, color: "purple", inputs: 1, outputs: 1, parameters: [{ id: "threshold", label: "Threshold", type: "number" }] },
  "analysis.voronoi": { type: "analysis.voronoi", label: "Voronoi", description: "Thiessen polygons", category: "analysis", icon: Play, color: "purple", inputs: 1, outputs: 1, parameters: [{ id: "envelope", label: "Clip to Extent", type: "boolean", default: true }] },
  "analysis.cluster": { type: "analysis.cluster", label: "Cluster", description: "Point clustering (DBSCAN)", category: "analysis", icon: Zap, color: "purple", inputs: 1, outputs: 1, parameters: [{ id: "distance", label: "Max Distance (m)", type: "number", default: 500 }, { id: "min_points", label: "Min Points", type: "number", default: 5 }] },

  // --- TABLE CATEGORY ---
  "table.join": { type: "table.join", label: "Join", description: "Join two tables", category: "table", icon: TableIcon, color: "amber", inputs: 2, outputs: 1, parameters: [
      { id: "method", label: "Join Type", type: "select", options: [{ label: "Inner Join", value: "inner" }, { label: "Left Join", value: "left" }, { label: "Right Join", value: "right" }, { label: "Outer Join", value: "outer" }], default: "inner" },
      { id: "left_key", label: "Left Table Key", type: "text", required: true }, 
      { id: "right_key", label: "Right Table Key", type: "text", required: true }
  ] },
  "table.filter": { type: "table.filter", label: "Filter Rows", description: "Query table", category: "table", icon: FilterIcon, color: "amber", inputs: 1, outputs: 1, parameters: [{ id: "expression", label: "Filter Expr", type: "text", placeholder: "e.g. population > 1000" }] },
  "table.aggregate": { type: "table.aggregate", label: "Aggregate", description: "Group-by summary", category: "table", icon: Calculator, color: "amber", inputs: 1, outputs: 1, parameters: [{ id: "group_by", label: "Group By", type: "text" }, { id: "agg_fn", label: "Method", type: "select", options: [{ label: "Sum", value: "sum" }, { label: "Average", value: "avg" }, { label: "Count", value: "count" }] }] },
  "table.rename_field": { type: "table.rename_field", label: "Rename", description: "Modify column names", category: "table", icon: Type, color: "amber", inputs: 1, outputs: 1, mainParameter: "new_name", parameters: [{ id: "old_name", label: "Field", type: "text" }, { id: "new_name", label: "New Name", type: "text" }] },
  "table.formula": { type: "table.formula", label: "Formula", description: "New computed column", category: "table", icon: Calculator, color: "amber", inputs: 1, outputs: 1, mainParameter: "column_name", parameters: [
      { id: "column_name", label: "New Column Name", type: "text", required: true }, 
      { id: "formula", label: "Expression (Rhai/JS)", type: "text", required: true, placeholder: "e.g. col1 * col2 + 10" }
  ] },

  // --- STYLE CATEGORY ---
  "style.simple_fill": { type: "style.simple_fill", label: "Simple Fill", description: "Basic styling", category: "style", icon: Palette, color: "pink", outputs: 1, parameters: [{ id: "color", label: "Fill Color", type: "color", default: "#3b82f6" }, { id: "opacity", label: "Opacity", type: "range", min: 0, max: 1, step: 0.1, default: 0.5 }] },
  "style.choropleth": { type: "style.choropleth", label: "Choropleth", description: "Data-driven colors", category: "style", icon: Palette, color: "pink", inputs: 1, outputs: 1, parameters: [{ id: "field", label: "Attribute", type: "text" }, { id: "scheme", label: "Colors", type: "select", options: [{ label: "Viridis", value: "viridis" }, { label: "Magma", value: "magma" }] }] },
  "style.heatmap": { type: "style.heatmap", label: "Heatmap Style", description: "Style point density", category: "style", icon: Palette, color: "pink", outputs: 1, parameters: [{ id: "radius", label: "Blur Radius", type: "number", default: 30 }] },

  // --- CORE/UTILS ---
  "expression": {
    type: "expression",
    label: "Expression",
    description: "Dynamic Rhai script",
    category: "analysis",
    icon: Calculator,
    color: "purple",
    inputs: 1,
    outputs: 1,
    mainParameter: "expression",
    parameters: [{ id: "expression", label: "Formula", type: "text", required: true }]
  },
};
