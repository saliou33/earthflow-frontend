"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Database, FileType, Check, Filter, Layers, Table as TableIcon, Box } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this hook exists or I'll create it

interface Asset {
  id: string;
  name: string;
  asset_type: string;
}

interface AssetSelectorProps {
  value: string;
  onChange: (value: string, assetName?: string) => void;
  placeholder?: string;
}

const ASSET_TYPES = [
  { id: "all", label: "All Assets", icon: Database, color: "text-primary" },
  { id: "VECTOR", label: "Vector Data", icon: Box, color: "text-blue-500" },
  { id: "RASTER", label: "Raster Layers", icon: Layers, color: "text-orange-500" },
  { id: "TABLE", label: "Structured Tables", icon: TableIcon, color: "text-amber-500" },
];

export function AssetSelector({ value, onChange, placeholder = "Select an asset..." }: AssetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const debouncedSearch = useDebounce(search, 300);

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["assets", debouncedSearch, selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (selectedType !== "all") params.append("asset_type", selectedType);
      
      const res = await apiClient.get(`v1/assets?${params.toString()}`);
      return res.data;
    },
    enabled: open,
  });

  const selectedAsset = useMemo(() => 
    assets.find(a => a.id === value), 
    [assets, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 px-3 font-normal"
        >
          {selectedAsset ? (
            <div className="flex items-center gap-2 truncate">
              <span className={cn(
                "text-[10px] px-1 rounded font-bold border",
                selectedAsset.asset_type === "VECTOR" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                selectedAsset.asset_type === "RASTER" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                "bg-muted text-muted-foreground"
              )}>
                {selectedAsset.asset_type}
              </span>
              <span className="truncate">{selectedAsset.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[450px] shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md overflow-hidden" align="start">
        <div className="flex h-[350px]">
          {/* Left Column: Types */}
          <div className="w-40 border-r bg-muted/30 flex flex-col p-2 space-y-1">
            <h4 className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <Filter className="size-3" />
              Source Type
            </h4>
            {ASSET_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left",
                  selectedType === type.id 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                )}
              >
                <type.icon className={cn("size-3.5", selectedType === type.id ? "text-primary-foreground" : type.color)} />
                {type.label}
              </button>
            ))}
          </div>

          {/* Right Column: Search & Results */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-3 border-b bg-muted/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-9 text-xs bg-background border-primary/10 focus-visible:ring-primary/20"
                  placeholder="Search metadata or filenames..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-1 space-y-0.5">
              {isLoading ? (
                <div className="h-full flex items-center justify-center p-8 flex-col gap-2">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Syncing Lakehouse...</span>
                </div>
              ) : assets.length === 0 ? (
                <div className="h-full flex items-center justify-center p-8 flex-col text-center">
                  <Database className="size-8 text-muted-foreground/20 mb-2" />
                  <p className="text-xs font-medium">No assets found</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Try changing filters or search terms</p>
                </div>
              ) : (
                assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      onChange(asset.id, asset.name);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg transition-all text-left group",
                      value === asset.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0 border",
                        asset.asset_type === "VECTOR" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                        asset.asset_type === "RASTER" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                        "bg-muted text-muted-foreground"
                      )}>
                        <FileType className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate group-hover:text-primary transition-colors">{asset.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">{asset.asset_type}</span>
                      </div>
                    </div>
                    {value === asset.id && <Check className="size-3 text-primary ml-2 shrink-0" />}
                  </button>
                ))
              )}
            </div>

            <div className="p-2 border-t bg-muted/20 flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
               <span>Showing {assets.length} results</span>
               <span className="opacity-50">ESC to close</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
