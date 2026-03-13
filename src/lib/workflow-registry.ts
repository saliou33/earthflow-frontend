import { LucideIcon, Database, MoveDiagonal, Calculator, LibrarySquare, Maximize, Play, Calendar } from "lucide-react";

export type NodeCategory = "io" | "geometry" | "analysis";

export type ParameterType = "text" | "number" | "select" | "boolean" | "file" | "range" | "color" | "date" | "datetime"
  | "datetime-range";

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
}

export const NODE_CATEGORIES: { id: NodeCategory; label: string; icon: LucideIcon; color: string }[] = [
  { id: "io", label: "Input / Output", icon: LibrarySquare, color: "text-blue-500" },
  { id: "geometry", label: "Geometry", icon: Maximize, color: "text-orange-500" },
  { id: "analysis", label: "Analysis", icon: Play, color: "text-purple-500" },
];

export const NODE_REGISTRY: Record<string, NodeDefinition> = {
  dataset: {
    type: "dataset",
    label: "Dataset Input",
    description: "Import satellite data",
    category: "io",
    icon: Database,
    color: "blue",
    outputs: 1,
    parameters: [
      {
        id: "datasetId",
        label: "Dataset",
        type: "select",
        description: "Choose the satellite imagery source",
        options: [
          { label: "Sentinel-2 L2A", value: "s2-l2a" },
          { label: "Landsat 8-9 C2 L2", value: "landsat-c2-l2" },
          { label: "MODIS Vegetation Indices", value: "modis-vi" },
        ],
        required: true,
      },
      {
        id: "dateRange",
        label: "Date Range",
        type: "text",
        placeholder: "YYYY-MM-DD to YYYY-MM-DD",
        description: "Filter data by acquisition date",
      }
    ]
  },
  buffer: {
    type: "buffer",
    label: "Buffer Geo",
    description: "Expand vector region",
    category: "geometry",
    icon: MoveDiagonal,
    color: "orange",
    inputs: 1,
    outputs: 1,
    parameters: [
      {
        id: "distance",
        label: "Distance (meters)",
        type: "number",
        default: 100,
        description: "The buffer radius in meters",
        required: true,
      },
      {
        id: "capStyle",
        label: "Cap Style",
        type: "select",
        default: "round",
        options: [
          { label: "Round", value: "round" },
          { label: "Flat", value: "flat" },
          { label: "Square", value: "square" },
        ]
      }
    ]
  },
  math: {
    type: "math",
    label: "Raster Math",
    description: "Algebraic map operations",
    category: "analysis",
    icon: Calculator,
    color: "purple",
    inputs: 2,
    outputs: 1,
    parameters: [
      {
        id: "expression",
        label: "Expression",
        type: "text",
        default: "(A - B) / (A + B)",
        description: "Mathematical expression (e.g., NDVI)",
        placeholder: "(A - B) / (A + B)",
        required: true,
      }
    ]
  },
  "date-filter": {
    type: "date-filter",
    label: "Date Filter",
    description: "Filter data by a specific date range",
    category: "analysis",
    icon: Calendar,
    color: "purple",
    inputs: 1,
    outputs: 1,
    parameters: [
      {
        id: "range",
        label: "Date Range",
        type: "datetime-range",
        required: true,
        description: "Select the start and end date for filtering"
      },
      {
          id: "field",
          label: "Date Field",
          type: "text",
          placeholder: "e.g. timestamp",
          required: true
      }
    ],
  },
};
