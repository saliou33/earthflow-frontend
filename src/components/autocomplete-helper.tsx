"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Variable, FunctionSquare, Database, ArrowRight } from "lucide-react";
import { useWorkflowStore } from "@/stores/workflow-store";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteHelperProps {
  children: React.ReactNode;
  onSelect: (value: string) => void;
  context?: "expression" | "text";
}

const COMMON_FUNCTIONS = [
  { label: "ST_Buffer", value: "ST_Buffer(", description: "Expand geometry" },
  { label: "ST_Intersection", value: "ST_Intersection(", description: "Intersect two geometries" },
  { label: "abs", value: "abs(", description: "Absolute value" },
  { label: "sqrt", value: "sqrt(", description: "Square root" },
  { label: "min", value: "min(", description: "Minimum of two values" },
  { label: "max", value: "max(", description: "Maximum of two values" },
];

interface Suggestion {
  id: string;
  label: string;
  type: "variable" | "function";
  description: string;
  value?: string;
}

export function AutocompleteHelper({ children, onSelect, context = "text" }: AutocompleteHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { nodes, edges } = useWorkflowStore();

  const suggestions = useMemo<Suggestion[]>(() => {
    const vars: Suggestion[] = nodes
      .filter(n => n.type === "variable" || (n.data as any).label)
      .map(n => ({
        id: n.id,
        label: String((n.data as any).label || (n.data as any).name || n.id),
        type: "variable" as const,
        description: `Output from ${String((n.data as any).label || n.type)}`,
      }));

    const functions: Suggestion[] = context === "expression" ? COMMON_FUNCTIONS.map(f => ({
      id: f.label,
      label: f.label,
      type: "function" as const,
      value: f.value,
      description: f.description,
    })) : [];

    const all = [...vars, ...functions];
    
    if (!search) return all;
    
    return all.filter(s => 
      s.label.toLowerCase().includes(search.toLowerCase()) || 
      (s.description || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [nodes, search, context]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="w-full relative group cursor-text">
          {children}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
             <ArrowRight className="size-3 text-muted-foreground" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        side="right" 
        align="start" 
        sideOffset={12} 
        className="p-0 w-64 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm"
        onOpenAutoFocus={(e) => e.preventDefault()} 
      >
        <div className="flex flex-col max-h-80 overflow-hidden">
          <div className="p-2 border-b bg-muted/30 shrink-0 flex items-center gap-2">
            <Search className="size-3.5 text-muted-foreground" />
            <input 
              className="bg-transparent border-none focus:outline-none text-xs w-full"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-auto p-1 space-y-0.5">
            {suggestions.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">
                    No suggestions found
                </div>
            )}
            
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelect(s.type === "function" ? s.value! : s.label);
                  setIsOpen(false);
                }}
                className="w-full flex items-start gap-2 p-2 rounded-md hover:bg-primary/10 transition-colors text-left group"
              >
                <div className={cn(
                  "size-6 rounded flex items-center justify-center shrink-0",
                  s.type === "variable" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                )}>
                  {s.type === "variable" ? <Variable className="size-3.5" /> : <FunctionSquare className="size-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                    {s.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate italic">
                    {s.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-2 border-t bg-muted/20 shrink-0">
             <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">
                Press Enter to select • Up/Down to navigate
             </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
