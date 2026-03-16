"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, Play, Menu, Settings, LibrarySquare, ZoomIn, ZoomOut, Expand, Database, Globe, Trash2, FileJson, Download, Upload, History, Copy, AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  ReactFlow, 
  Background,
  BackgroundVariant,
  Controls,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
// MapLibre and React Map GL imports will be added in Milestone 4

import { useWorkflowStore } from "@/stores/workflow-store";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BaseNode } from "@/components/nodes/base-node";
import { NodePropertiesPanel } from "@/components/workflow/node-properties-panel";
import { DataPanel } from "@/components/workflow/data-panel";
import { AssetManagerModal } from "@/components/workflow/asset-manager-modal";
import { ConnectionManagerModal } from "@/components/workflow/connection-manager-modal";
import { NODE_REGISTRY, NODE_CATEGORIES } from "@/lib/workflow-registry";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const nodeTypes = Object.keys(NODE_REGISTRY).reduce((acc, type) => {
  acc[type] = BaseNode;
  return acc;
}, {} as Record<string, any>);

type Workflow = {
  id: string;
  name: string;
  description: string | null;
  graph: {
    nodes: Node[];
    edges: Edge[];
  };
  updated_at: string;
};

export function WorkflowEditorClientPage({ workflowId }: { workflowId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Zustand Store
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    workflowName,
    isSidebarOpen,
    isPropertiesOpen,
    isPropertiesExpanded,
    isRenameDialogOpen,
    isAssetModalOpen,
    isConnectionModalOpen,
    isHistoryDialogOpen,
    isExecuting,
    newNodeName,
    setNodes,
    setEdges,
    setWorkflowName,
    setSelectedNodeId,
    setSelectedEdgeId,
    setIsSidebarOpen,
    setIsPropertiesOpen,
    setIsPropertiesExpanded,
    setIsRenameDialogOpen,
    setIsAssetModalOpen,
    setIsConnectionModalOpen,
    setIsHistoryDialogOpen,
    setIsExecuting,
    setNewNodeName,
    isClearExecutionsAlertOpen,
    setIsClearExecutionsAlertOpen,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
    deleteNode,
    deleteEdge,
    duplicateNode,
    clearCanvas,
    executionResults,
    setExecutionResults,
    setLastExecutionAt,
    setIsDataPanelOpen,
  } = useWorkflowStore();

  // Local UI state
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [nodeSearchQuery, setNodeSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<string[]>(NODE_CATEGORIES.map(c => c.id));

  // Auto-expand all categories when searching
  useEffect(() => {
    if (nodeSearchQuery) {
        setOpenCategories(NODE_CATEGORIES.map(c => c.id));
    }
  }, [nodeSearchQuery]);

  const { data: executionHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["workflows", workflowId, "executions"],
    queryFn: async () => {
      const res = await apiClient.get(`v1/workflows/${workflowId}/executions`);
      return res.data;
    },
    enabled: isHistoryDialogOpen,
  });

  // Derived state to always have the latest node data
  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId) || null
  , [nodes, selectedNodeId]);

  // Ref to track if we've initialized the canvas from data to prevent overwrite loop
  const isInitialized = useRef(false);

  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: ["workflows", workflowId],
    queryFn: async () => {
      const res = await apiClient.get(`v1/workflows/${workflowId}`);
      return res.data;
    },
  });

  useEffect(() => {
    if (workflow && !isInitialized.current) {
      setNodes(workflow.graph.nodes || []);
      setEdges(workflow.graph.edges || []);
      setWorkflowName(workflow.name);
      isInitialized.current = true;
    }
  }, [workflow, workflowId, setNodes, setEdges, setWorkflowName]);

  // Fetch latest execution on load
  const { data: latestExecution } = useQuery({
    queryKey: ["workflows", workflowId, "executions", "latest"],
    queryFn: async () => {
      const res = await apiClient.get(`v1/workflows/${workflowId}/executions/latest`);
      return res.data;
    },
    enabled: !!workflowId,
  });

  useEffect(() => {
    if (latestExecution?.results) {
       setExecutionResults(latestExecution.results);
       setLastExecutionAt(latestExecution.created_at);
    }
  }, [latestExecution, setExecutionResults, setLastExecutionAt]);

  const updateWorkflow = useMutation({
    mutationFn: async (data: { name?: string; graph?: any }) => {
      const res = await apiClient.put(`v1/workflows/${workflowId}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Workflow saved");
      queryClient.invalidateQueries({ queryKey: ["workflows", workflowId] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
    onError: (error) => {
      toast.error("Failed to save workflow");
      console.error(error);
    },
  });

  const onExecute = useCallback(async (nodeId?: string) => {
    const { nodes, edges, workflowName, setIsExecuting, setExecutionResults, setLastExecutionAt, setIsDataPanelOpen } = useWorkflowStore.getState();
    setIsExecuting(true);
    try {
      // 1. Save current graph first
      await apiClient.put(`v1/workflows/${workflowId}`, {
        name: workflowName,
        graph: { nodes, edges }
      });

      // 2. Trigger execution (optionally partial)
      const response = await apiClient.post(`v1/workflows/${workflowId}/execute`, {
        node_id: nodeId
      });

      if (response.status !== 200) {
        throw new Error(response.data || "Execution failed");
      }

      const results = response.data;
      setExecutionResults(results);
      setLastExecutionAt(new Date().toISOString());
      setIsDataPanelOpen(true);
      
      console.log("Execution successful:", results);
      toast.success(nodeId ? `Node execution successful` : "Workflow executed successfully!");
    } catch (error: any) {
      toast.error("Execution failed: " + (error.message || "Unknown error"));
      console.error("Execution failed:", error);
    } finally {
      setIsExecuting(false);
    }
  }, [workflowId]);

  const onClearExecutions = useCallback(async () => {
    const state = useWorkflowStore.getState();
    try {
      await apiClient.delete(`v1/workflows/${workflowId}/executions`);
      state.setExecutionResults(null);
      state.setLastExecutionAt(null);
      state.setIsDataPanelOpen(false);
      toast.success("Execution history cleared successfully");
      queryClient.invalidateQueries({ queryKey: ["workflows", workflowId, "executions"] });
    } catch (error) {
      toast.error("Failed to clear execution history");
    }
  }, [workflowId, queryClient]);

  const onExportWorkflow = useCallback(() => {
    const { nodes, edges, workflowName } = useWorkflowStore.getState();
    const data = {
      name: workflowName,
      graph: { nodes, edges }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, "_").toLowerCase()}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workflow exported as JSON");
  }, []);

  const onImportWorkflow = useCallback(() => {
     const input = document.createElement("input");
     input.type = "file";
     input.accept = ".json";
     input.onchange = (e: any) => {
       const file = e.target.files[0];
       const reader = new FileReader();
       reader.onload = (re: any) => {
         try {
           const data = JSON.parse(re.target.result);
           if (data.graph && data.graph.nodes) {
             const state = useWorkflowStore.getState();
             state.setNodes(data.graph.nodes);
             state.setEdges(data.graph.edges || []);
             state.setWorkflowName(data.name || state.workflowName);
             toast.success("Workflow imported successfully");
           }
         } catch (err) {
           toast.error("Invalid workflow JSON");
         }
       };
       reader.readAsText(file);
     };
     input.click();
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setIsPropertiesOpen(true);
  }, [setSelectedNodeId, setIsPropertiesOpen]);

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = rfInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) || { x: 0, y: 0 };

      const newNodeId = addNode(type, position);
      setSelectedNodeId(newNodeId);
      setIsPropertiesOpen(true);
    },
    [rfInstance, addNode, setSelectedNodeId, setIsPropertiesOpen]
  );
  
  const handleSave = useCallback(() => {
    const state = useWorkflowStore.getState();
    updateWorkflow.mutate({
      name: state.workflowName,
      graph: { nodes: state.nodes, edges: state.edges }
    });
  }, [updateWorkflow]);

  const onZoomIn = useCallback(() => rfInstance?.zoomIn({ duration: 300 }), [rfInstance]);
  const onZoomOut = useCallback(() => rfInstance?.zoomOut({ duration: 300 }), [rfInstance]);
  const onFitView = useCallback(() => rfInstance?.fitView({ duration: 500 }), [rfInstance]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-[calc(100vh-4rem)]">
        <h2 className="text-2xl font-bold">Workflow not found</h2>
        <Link href="/workflows">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workflows
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative flex">
      {/* Canvas Area (Background) */}
        <div className="relative flex-1 bg-background overflow-hidden flex">
          <div className="flex-1 relative">
            <ContextMenu>
                <ContextMenuTrigger className="w-full h-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onEdgeClick={(event, edge) => {
                            setSelectedEdgeId(edge.id);
                        }}
                        onNodeContextMenu={(event, node) => {
                            setSelectedNodeId(node.id);
                        }}
                        onEdgeContextMenu={(event, edge) => {
                            setSelectedEdgeId(edge.id);
                        }}
                        onPaneContextMenu={(event) => {
                            setSelectedNodeId(null);
                            setSelectedEdgeId(null);
                            setIsPropertiesOpen(false);
                        }}
                        onPaneClick={() => {
                            setSelectedNodeId(null);
                            setSelectedEdgeId(null);
                            setIsPropertiesOpen(false);
                        }}
                        nodeTypes={nodeTypes}
                        fitView
                        onInit={setRfInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        proOptions={{ hideAttribution: true }}
                    >
                    </ReactFlow>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                    {selectedNode ? (
                        <>
                            <ContextMenuLabel>Node: {String(selectedNode.data.label || selectedNode.type)}</ContextMenuLabel>
                            <ContextMenuItem onClick={() => onExecute(selectedNode.id)}>
                                <Play className="mr-2 h-4 w-4 text-green-500" />
                                Run this Node
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => {
                                setNewNodeName(String(selectedNode.data.label || ""));
                                setIsRenameDialogOpen(true);
                            }}>
                                Rename
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => duplicateNode(selectedNode.id)}>Duplicate</ContextMenuItem>
                            <ContextMenuItem onClick={() => setIsPropertiesOpen(true)}>Settings</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem className="text-destructive" onClick={() => deleteNode(selectedNode.id)}>
                                Delete Node
                            </ContextMenuItem>
                        </>
                    ) : selectedEdgeId ? (
                         <>
                            <ContextMenuLabel>Edge: Connection</ContextMenuLabel>
                            <ContextMenuItem className="text-destructive" onClick={() => deleteEdge(selectedEdgeId)}>
                                Delete Connection
                            </ContextMenuItem>
                        </>
                    ) : (
                        <>
                            <ContextMenuLabel>Canvas Actions</ContextMenuLabel>
                            <ContextMenuItem onClick={() => clearCanvas()}>Clear Canvas</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => rfInstance?.fitView()}>Fit View</ContextMenuItem>
                        </>
                    )}
                </ContextMenuContent>
            </ContextMenu>
          </div>

          {/* Expanded Sidebar mode - only visible if isPropertiesOpen AND isPropertiesExpanded */}
          {isPropertiesOpen && selectedNode && isPropertiesExpanded && (
            <div className="w-80 shadow-xl z-20 transition-all animate-in slide-in-from-right duration-300 flex flex-col">
              <NodePropertiesPanel 
                key={selectedNode.id}
                node={selectedNode} 
                onClose={() => setIsPropertiesOpen(false)}
                onUpdate={updateNodeData}
              />
            </div>
          )}
        </div>

      {/* Floating Properties Panel (Overlay mode) */}
      {isPropertiesOpen && selectedNode && !isPropertiesExpanded && (
        <div className="absolute top-20 right-4 bottom-24 z-10 w-80 shadow-lg flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95">
          <NodePropertiesPanel 
            key={selectedNode.id}
            node={selectedNode} 
            onClose={() => setIsPropertiesOpen(false)}
            onUpdate={updateNodeData}
          />
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Node</DialogTitle>
            <DialogDescription>
              Enter a new label for this node.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="node-name" className="text-right">
                Name
              </Label>
              <Input
                id="node-name"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button 
                onClick={() => {
                    if (selectedNodeId) {
                        updateNodeData(selectedNodeId, { label: newNodeName });
                        setIsRenameDialogOpen(false);
                    }
                }}
            >
                Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between bg-background/80 backdrop-blur-md border rounded-xl shadow-sm px-4 py-2">
        <div className="flex items-center space-x-2 flex-1">
          <Link href="/workflows">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-6 w-px bg-border mx-2" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-8 w-8 hover:bg-muted text-muted-foreground"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <LibrarySquare className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-8 w-8 hover:bg-muted text-muted-foreground mr-1"
            onClick={() => setIsAssetModalOpen(true)}
          >
            <Database className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-8 w-8 hover:bg-muted text-muted-foreground mr-2"
            onClick={() => setIsConnectionModalOpen(true)}
          >
            <Globe className="h-4 w-4" />
          </Button>
          <div className="relative flex items-center group max-w-[400px] min-w-[120px]">
             {/* Invisible span to measure content width */}
            <span className="invisible whitespace-pre px-2 text-base font-semibold h-8 flex items-center">
              {workflowName || "Untitled Workflow"}
            </span>
            <Input 
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Untitled Workflow"
              className="absolute inset-0 w-full border-transparent hover:border-border focus:border-border shadow-none text-base text-center font-semibold focus-visible:ring-0 px-2 h-8 bg-transparent transition-colors rounded-lg overflow-hidden flex items-center"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Menu className="mr-2 h-4 w-4" />
                Workflow
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 font-bold">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">Operations</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setIsClearExecutionsAlertOpen(true)} className="text-destructive focus:text-destructive cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Clear Executions</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsHistoryDialogOpen(true)} className="cursor-pointer">
                <History className="mr-2 h-4 w-4" />
                <span>Run History</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">Management</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {}} className="cursor-pointer">
                <Copy className="mr-2 h-4 w-4" />
                <span>Duplicate Workflow</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportWorkflow} className="cursor-pointer">
                <Download className="mr-2 h-4 w-4" />
                <span>Export as JSON</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onImportWorkflow} className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                <span>Import JSON</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Settings className="mr-2 h-4 w-4" />
                Canvas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onZoomIn} className="cursor-pointer">
                <ZoomIn className="mr-2 h-4 w-4" />
                <span>Zoom In</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onZoomOut} className="cursor-pointer">
                <ZoomOut className="mr-2 h-4 w-4" />
                <span>Zoom Out</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onFitView} className="cursor-pointer">
                <Expand className="mr-2 h-4 w-4" />
                <span>Fit View</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-border mx-2" />
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={updateWorkflow.isPending}
            size="sm"
            className="h-8"
          >
            {updateWorkflow.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 h-8 font-bold"
            onClick={() => onExecute()}
            disabled={isExecuting}
          >
            <Play className={cn("h-3.5 w-3.5 mr-2", isExecuting && "animate-spin")} />
            {isExecuting ? "Executing..." : "Execute"}
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-8 w-8 hover:bg-muted text-muted-foreground"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <LibrarySquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Left Sidebar (Node Library) - Floating overlay */}
      <div 
        className={`absolute top-20 left-4 bottom-24 z-10 w-72 bg-background/95 backdrop-blur-md border rounded-xl shadow-lg flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"
        }`}
      >
        <div className="p-4 border-b space-y-3">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Node Library</h3>
          <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
             <Input 
                placeholder="Search nodes..." 
                className="pl-8 h-8 text-xs bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                value={nodeSearchQuery}
                onChange={(e) => setNodeSearchQuery(e.target.value)}
             />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <Accordion 
            key={nodeSearchQuery ? "searching" : "browsing"}
            type="multiple" 
            value={openCategories}
            onValueChange={setOpenCategories} 
            className="w-full space-y-2"
          >
            {NODE_CATEGORIES.map((cat) => {
              const filteredNodes = Object.values(NODE_REGISTRY)
                .filter(node => node.category === cat.id && (
                    node.label.toLowerCase().includes(nodeSearchQuery.toLowerCase()) ||
                    node.description.toLowerCase().includes(nodeSearchQuery.toLowerCase())
                ));

              if (filteredNodes.length === 0) return null;

              return (
                <AccordionItem key={cat.id} value={cat.id} className="border-none">
                  <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center text-sm font-semibold">
                      <cat.icon className={cn("mr-2 h-4 w-4", cat.color)} />
                      {cat.label}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 px-1 space-y-2">
                    {filteredNodes.map(node => (
                      <div 
                        key={node.type}
                        className={cn(
                          "group flex items-center p-3 border rounded-xl bg-card transition-all cursor-grab active:cursor-grabbing shadow-sm",
                          node.color === "blue" ? "hover:border-blue-500/50 hover:bg-blue-500/5" :
                          node.color === "orange" ? "hover:border-orange-500/50 hover:bg-orange-500/5" :
                          node.color === "purple" ? "hover:border-purple-500/50 hover:bg-purple-500/5" :
                          node.color === "emerald" ? "hover:border-emerald-500/50 hover:bg-emerald-500/5" :
                          node.color === "amber" ? "hover:border-amber-500/50 hover:bg-amber-500/5" :
                          node.color === "pink" ? "hover:border-pink-500/50 hover:bg-pink-500/5" :
                          "hover:border-primary/50 hover:bg-primary/5"
                        )}
                        onDragStart={(e) => onDragStart(e, node.type)}
                        draggable
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center mr-3 transition-colors",
                          node.color === "blue" ? "bg-blue-500/10 group-hover:bg-blue-500/20" :
                          node.color === "orange" ? "bg-orange-500/10 group-hover:bg-orange-500/20" :
                          node.color === "purple" ? "bg-purple-500/10 group-hover:bg-purple-500/20" :
                          node.color === "emerald" ? "bg-emerald-500/10 group-hover:bg-emerald-500/20" :
                          node.color === "amber" ? "bg-amber-500/10 group-hover:bg-amber-500/20" :
                          node.color === "pink" ? "bg-pink-500/10 group-hover:bg-pink-500/20" :
                          "bg-primary/10 group-hover:bg-primary/20"
                        )}>
                          <node.icon className={cn(
                            "h-4 w-4",
                            node.color === "blue" ? "text-blue-500" :
                            node.color === "orange" ? "text-orange-500" :
                            node.color === "purple" ? "text-purple-500" :
                            node.color === "emerald" ? "text-emerald-500" :
                            node.color === "amber" ? "text-amber-500" :
                            node.color === "pink" ? "text-pink-500" :
                            "text-primary"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{node.label}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                            {node.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>

      {/* Data Results Panel */}
      <DataPanel />

      {/* Run History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2">
                <History className="size-5 text-primary" />
                Workflow Run History
            </DialogTitle>
            <DialogDescription>
              A history of recent executions for this workflow.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-6 pt-2">
            {isLoadingHistory ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Retrieving Logs...</span>
                </div>
            ) : !executionHistory || executionHistory.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                    <History className="size-12 mb-4" />
                    <p className="font-bold">No execution history found</p>
                    <p className="text-xs">Run the workflow to see results here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {executionHistory.map((exec: any) => (
                        <div 
                            key={exec.id} 
                            className="group p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between cursor-pointer"
                            onClick={() => {
                                setExecutionResults(exec.results);
                                setLastExecutionAt(exec.created_at);
                                setIsHistoryDialogOpen(false);
                                setIsDataPanelOpen(true);
                                toast.success("Loaded historical results");
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "size-10 rounded-full flex items-center justify-center",
                                    exec.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                                )}>
                                    {exec.status === "completed" ? <Play className="size-5" /> : <AlertCircle className="size-5" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold uppercase tracking-tight">
                                        {new Date(exec.created_at).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        Execution Time: {exec.execution_time_ms}ms • Status: {exec.status}
                                    </span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
          </div>
          <DialogFooter className="p-6 pt-2 border-t bg-muted/10">
             <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>Close</Button>
             <Button variant="destructive" size="sm" onClick={() => {
                 setIsClearExecutionsAlertOpen(true);
                 setIsHistoryDialogOpen(false);
             }}>Clear All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Manager Modal */}
      <AssetManagerModal open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen} />
      <ConnectionManagerModal open={isConnectionModalOpen} onOpenChange={setIsConnectionModalOpen} />

      {/* Alert Dialogs */}


      <AlertDialog open={isClearExecutionsAlertOpen} onOpenChange={setIsClearExecutionsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Execution History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the entire execution history for this workflow. This action cannot be undone and may affect analysis tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onClearExecutions}
            >
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
