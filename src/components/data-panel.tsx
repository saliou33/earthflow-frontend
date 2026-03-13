"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  Terminal, 
  Table as TableIcon, 
  Map as MapIcon, 
  Maximize2, 
  Minimize2,
  X,
  Database,
  Search
} from "lucide-react";
import { useWorkflowStore } from "@/stores/workflow-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function DataPanel() {
  const { 
    isDataPanelOpen, 
    setIsDataPanelOpen, 
    dataPanelHeight, 
    setDataPanelHeight,
    executionResults,
    lastExecutionAt,
    selectedNodeId,
    nodes
  } = useWorkflowStore();

  const [activeTab, setActiveTab] = useState<"console" | "table" | "map">("console");
  const [isMaximized, setIsMaximized] = useState(false);
  const isResizing = useRef(false);
  const lastY = useRef(0);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const nodeOutput = selectedNodeId && executionResults ? executionResults[selectedNodeId] : null;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    lastY.current = e.clientY;
    document.body.style.cursor = "ns-resize";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = lastY.current - e.clientY;
      lastY.current = e.clientY;
      setDataPanelHeight(Math.max(100, Math.min(window.innerHeight - 100, dataPanelHeight + delta)));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dataPanelHeight, setDataPanelHeight]);

  if (!isDataPanelOpen && !isMaximized) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <Button 
          variant="secondary" 
          size="sm" 
          className="rounded-full shadow-2xl border bg-background/90 backdrop-blur-md px-4 py-3 h-10 gap-2 hover:scale-105 active:scale-95 transition-all"
          onClick={() => setIsDataPanelOpen(true)}
        >
          <ChevronUp className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Results Panel</span>
          {executionResults && (
            <div className="ml-1 size-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </Button>
      </div>
    );
  }

  const panelHeight = isMaximized ? "100vh" : `${dataPanelHeight}px`;

  return (
    <div 
      className={cn(
        "absolute left-0 right-0 bottom-0 bg-background/95 backdrop-blur-xl border-t shadow-2xl z-40 flex flex-col transition-all duration-300 ease-out",
        isMaximized ? "top-0" : ""
      )}
      style={{ height: panelHeight }}
    >
      {/* Resize Handle */}
      {!isMaximized && (
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-primary/30 transition-colors z-50 flex items-center justify-center group"
          onMouseDown={handleMouseDown}
        >
            <div className="w-12 h-1 rounded-full bg-muted-foreground/20 group-hover:bg-primary/50" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0 bg-muted/30">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
             <h3 className="text-sm font-bold uppercase tracking-tight">Execution Results</h3>
          </div>
          
          <Separator orientation="vertical" className="h-6" />

          {lastExecutionAt && (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              <span>Last Run:</span>
              <span className="text-foreground">{new Date(lastExecutionAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setIsMaximized(!isMaximized)}>
            {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setIsDataPanelOpen(false)}>
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Secondary Sidebar (Node List) */}
        <div className="w-64 border-r bg-muted/5 flex flex-col shrink-0">
            <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Job Nodes</span>
                <Search className="size-3 text-muted-foreground" />
            </div>
            <div className="flex-1 overflow-auto p-1 space-y-0.5">
                {nodes.map(n => {
                    const hasOutput = executionResults && executionResults[n.id];
                    const isError = hasOutput && hasOutput.error;
                    return (
                        <button
                            key={n.id}
                            onClick={() => useWorkflowStore.getState().setSelectedNodeId(n.id)}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-left group",
                                selectedNodeId === n.id ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Database className={cn("size-3.5", hasOutput ? "text-green-500" : "opacity-30", isError && "text-destructive")} />
                            <span className="text-xs font-medium truncate flex-1">{String((n.data as any).label || n.type)}</span>
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Main Result View */}
        <div className="flex-1 overflow-auto bg-black/5 dark:bg-white/5 p-6">
            {!executionResults ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                    <div className="size-16 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                         <Terminal className="size-8" />
                    </div>
                    <p className="text-sm font-medium">Run the execution to see results</p>
                </div>
            ) : selectedNodeId ? (
                <div className="space-y-6 max-w-5xl mx-auto">
                    {/* Aligned Tabs */}
                    <div className="flex bg-muted/30 p-1 rounded-xl border w-fit">
                        <TabButton 
                            active={activeTab === "console"} 
                            onClick={() => setActiveTab("console")}
                            icon={<Terminal className="size-3.5" />}
                            label="Console" 
                        />
                        <TabButton 
                            active={activeTab === "table"} 
                            onClick={() => setActiveTab("table")}
                            icon={<TableIcon className="size-3.5" />}
                            label="Data Table" 
                        />
                        <TabButton 
                            active={activeTab === "map"} 
                            onClick={() => setActiveTab("map")}
                            icon={<MapIcon className="size-3.5" />}
                            label="Spatial Preview" 
                        />
                    </div>

                    <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold tracking-tight">{String((selectedNode?.data as any)?.label || selectedNode?.type || "Untitled Node")}</h4>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Node Output Payload</p>
                        </div>
                        {nodeOutput && (
                             <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">Success</div>
                        )}
                    </div>
                    
                    {nodeOutput ? (
                        <pre className="p-4 rounded-xl bg-muted/40 border font-mono text-xs leading-relaxed overflow-auto max-h-[500px] shadow-inner">
                            {JSON.stringify(nodeOutput, null, 2)}
                        </pre>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl grayscale opacity-30">
                            <X className="size-12 mb-2" />
                            <p className="text-sm font-bold uppercase tracking-widest">No output for this node</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-2 text-muted-foreground italic">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <ChevronUp className="size-4 animate-bounce" />
                        Select a node to view its specific output
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                active ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
            )}
        >
            {icon}
            {label}
        </button>
    )
}
