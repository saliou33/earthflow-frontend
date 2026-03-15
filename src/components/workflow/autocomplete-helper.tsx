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

const CATEGORIES = [
  { id: "all", label: "All Items", icon: Database },
  { id: "variable", label: "Variables", icon: Variable },
  { id: "function", label: "Functions", icon: FunctionSquare },
];

export function AutocompleteHelper({ children, onSelect, context = "text" }: AutocompleteHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { nodes } = useWorkflowStore();

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

    let all = [...vars, ...functions];
    
    if (selectedCategory !== "all") {
        all = all.filter(s => s.type === selectedCategory);
    }
    
    if (!search) return all;
    
    return all.filter(s => 
      s.label.toLowerCase().includes(search.toLowerCase()) || 
      (s.description || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [nodes, search, context, selectedCategory]);

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
        className="p-0 w-[400px] shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()} 
      >
        <div className="flex h-[320px]">
          {/* Category Column */}
          <div className="w-32 border-r bg-muted/30 flex flex-col p-2 space-y-1">
             <h4 className="px-2 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                Catalog
             </h4>
             {CATEGORIES.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left",
                        selectedCategory === cat.id 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                    )}
                >
                    <cat.icon className="size-3.5" />
                    {cat.label}
                </button>
             ))}
          </div>

          {/* Result Column */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-2 border-b bg-muted/10 shrink-0 flex items-center gap-2">
                <Search className="size-3.5 text-muted-foreground ml-1" />
                <input 
                    className="bg-transparent border-none focus:outline-none text-xs w-full h-7"
                    placeholder="Search logic..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <div className="flex-1 overflow-auto p-1 space-y-0.5">
                {suggestions.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                        <Database className="size-8 text-muted-foreground/20 mb-2" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">No suggestions</p>
                    </div>
                )}
                
                {suggestions.map((s) => (
                <button
                    key={s.id}
                    onClick={() => {
                        onSelect(s.type === "function" ? s.value! : s.label);
                        setIsOpen(false);
                    }}
                    className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-primary/10 transition-colors text-left group"
                >
                    <div className={cn(
                        "size-7 rounded-lg flex items-center justify-center shrink-0 border",
                        s.type === "variable" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                    )}>
                    {s.type === "variable" ? <Variable className="size-3.5" /> : <FunctionSquare className="size-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                        {s.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate italic">
                        {s.description}
                    </div>
                    </div>
                </button>
                ))}
            </div>
            
            <div className="p-2 border-t bg-muted/20 shrink-0 flex justify-between items-center px-3">
                <div className="text-[8px] uppercase font-black text-muted-foreground tracking-widest">
                    Smart Helper
                </div>
                <div className="text-[8px] text-muted-foreground/60 font-mono">
                    {suggestions.length} items
                </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
