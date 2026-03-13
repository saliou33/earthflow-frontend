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
  Search,
} from "lucide-react";
import { useWorkflowStore } from "@/stores/workflow-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { DataTablePreview } from "../data/data-table";
import { SpatialMapPreview } from "../data/spatial-map";

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

  // Extract asset metadata if it's a JSON output
  const asset = nodeOutput?.output?.type === "Json" ? nodeOutput.output.value : null;

  // Fetch presigned URL for the asset
  const { data: presignedData } = useQuery({
    queryKey: ["assets", asset?.id, "url"],
    queryFn: async () => {
      const res = await apiClient.get(`v1/assets/${asset.id}/url`);
      return res.data;
    },
    enabled: !!asset?.id,
  });

  const lastAutoSelectExecution = useRef<string | null>(null);

  // Auto-select node ONLY when a new execution completes
  useEffect(() => {
    if (executionResults && lastExecutionAt && lastExecutionAt !== lastAutoSelectExecution.current) {
      lastAutoSelectExecution.current = lastExecutionAt;
      
      const nodeIds = Object.keys(executionResults);
      const lastNodeId = nodeIds[nodeIds.length - 1];
      if (lastNodeId) {
        useWorkflowStore.getState().setSelectedNodeId(lastNodeId);
        // Explicitly open data panel if results arrived
        setIsDataPanelOpen(true);
      }
    }
  }, [executionResults, lastExecutionAt, setIsDataPanelOpen]);

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

  const panelHeight = isMaximized ? "100vh" : (isDataPanelOpen ? `${dataPanelHeight}px` : "0px");

  return (
    <>
      {/* Floating Entry Button */}
      <div className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 ease-in-out",
        isDataPanelOpen || isMaximized ? "opacity-0 pointer-events-none translate-y-10" : "opacity-100 translate-y-0"
      )}>
        <Button 
          variant="secondary" 
          size="sm" 
          className="rounded-full shadow-2xl border bg-background/90 backdrop-blur-md px-4 py-3 h-10 gap-2 hover:scale-105 active:scale-95 transition-all text-primary font-bold uppercase tracking-widest text-[10px]"
          onClick={() => setIsDataPanelOpen(true)}
        >
          <ChevronUp className="size-4" />
          <span>Execution Details</span>
          {executionResults && (
            <div className="ml-1 size-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          )}
        </Button>
      </div>

      {/* Main Panel Content */}
      <div 
        className={cn(
          "absolute left-0 right-0 bottom-0 bg-background/95 backdrop-blur-2xl border-t shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)] z-40 flex flex-col transition-all duration-700 ease-in-out transform origin-bottom",
          isDataPanelOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
        style={{ height: panelHeight }}
      >
        {/* Resize Handle */}
        {!isMaximized && (
          <div 
            className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-primary/30 transition-colors z-50 flex items-center justify-center group"
            onMouseDown={handleMouseDown}
          >
              <div className="w-12 h-1 rounded-full bg-muted-foreground/20 group-hover:bg-primary/50 transition-colors" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b shrink-0 bg-muted/20 backdrop-blur-md">
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2">
               <div className="size-2 rounded-full bg-primary animate-pulse" />
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80">Workflow Output</h3>
            </div>
            
            <Separator orientation="vertical" className="h-4" />

            {lastExecutionAt && (
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                <span className="opacity-50">Executed:</span>
                <span className="text-foreground/70">{new Date(lastExecutionAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setIsMaximized(!isMaximized)}>
              {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => {
                setIsDataPanelOpen(false);
                setIsMaximized(false);
            }}>
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Secondary Sidebar (Node List) */}
          <div className="w-64 border-r bg-muted/5 flex flex-col shrink-0">
              <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Node Jobs</span>
                  <Search className="size-3 text-muted-foreground/50" />
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-1">
                  {nodes.map(n => {
                      const hasOutput = executionResults && executionResults[n.id];
                      const isError = hasOutput && hasOutput.error;
                      return (
                          <button
                              key={n.id}
                              onClick={() => useWorkflowStore.getState().setSelectedNodeId(n.id)}
                              className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group",
                                  selectedNodeId === n.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                              )}
                          >
                              <Database className={cn("size-3.5", selectedNodeId === n.id ? "text-primary-foreground" : (hasOutput ? "text-green-500" : "opacity-30"), isError && "text-destructive")} />
                              <span className="text-xs font-bold truncate flex-1 tracking-tight">{String((n.data as any).label || n.type)}</span>
                          </button>
                      )
                  })}
              </div>
          </div>

          {/* Main Result View */}
          <div className="flex-1 overflow-auto bg-black/2 dark:bg-white/2 p-8">
              {!executionResults ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground/40">
                      <div className="size-20 rounded-3xl border-2 border-dashed border-muted-foreground/10 flex items-center justify-center shadow-inner">
                           <Terminal className="size-10 opacity-20" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.2em]">Awaiting Execution...</p>
                  </div>
              ) : selectedNodeId ? (
                  <div className="space-y-8 max-w-6xl mx-auto">
                      {/* Premium Tabs */}
                      <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-primary/10 w-fit backdrop-blur-xl">
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
                              label="Structure" 
                          />
                          <TabButton 
                              active={activeTab === "map"} 
                              onClick={() => setActiveTab("map")}
                              icon={<MapIcon className="size-3.5" />}
                              label="Analysis" 
                          />
                      </div>

                      <div className="flex items-center justify-between border-b border-primary/10 pb-6">
                          <div className="space-y-1.5">
                              <h4 className="text-2xl font-black tracking-tighter text-foreground/90">{String((selectedNode?.data as any)?.label || selectedNode?.type || "Untitled Source")}</h4>
                              <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">System Metadata</span>
                                  <Separator orientation="vertical" className="h-2" />
                                  <span className="text-[10px] text-primary font-black tracking-widest">{selectedNodeId.split('-')[0]}</span>
                              </div>
                          </div>
                          {nodeOutput && (
                               <div className="px-4 py-1.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">Validated Result</div>
                          )}
                      </div>
                      
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === "console" && (
                            nodeOutput ? (
                                <pre className="p-6 rounded-2xl bg-muted/40 border border-primary/5 font-mono text-[11px] leading-relaxed overflow-auto max-h-[600px] shadow-2xl backdrop-blur-sm">
                                    {JSON.stringify(nodeOutput, null, 2)}
                                </pre>
                            ) : (
                                <EmptyState message="No output payload detected" />
                            )
                        )}

                        {activeTab === "table" && (
                            <DataTablePreview asset={asset} presignedUrl={presignedData?.url} output={nodeOutput} />
                        )}

                        {activeTab === "map" && (
                            <SpatialMapPreview asset={asset} presignedUrl={presignedData?.url} />
                        )}
                      </div>
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground/30 italic">
                      <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em]">
                          <ChevronUp className="size-6 animate-bounce text-primary" />
                          Select node to inspect
                      </div>
                  </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2.5 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                active ? "bg-background text-primary shadow-xl shadow-primary/5 border border-primary/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            {icon}
            {label}
        </button>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl grayscale opacity-30 bg-muted/5">
            <X className="size-16 mb-4 opacity-20" />
            <p className="text-[11px] font-black uppercase tracking-[0.3em]">{message}</p>
        </div>
    );
}
