import { LucideIcon, Database, MoveDiagonal, Calculator, LibrarySquare, Maximize, Play } from "lucide-react";

export type NodeCategory = "io" | "geometry" | "analysis";

export interface NodeDefinition {
  type: string;
  label: string;
  description: string;
  category: NodeCategory;
  icon: LucideIcon;
  color: string;
  inputs?: number;
  outputs?: number;
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
  },
};
