"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, Play, Menu, Settings, LibrarySquare, ZoomIn, ZoomOut, Expand } from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
import { NodePropertiesPanel } from "@/components/node-properties-panel";
import { DataPanel } from "@/components/data-panel";
import { NODE_REGISTRY, NODE_CATEGORIES } from "@/lib/workflow-registry";
import { DEMO_WORKFLOW_ID, DEMO_WORKFLOW_DATA } from "@/lib/demo-data";

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
    workflowName,
    isSidebarOpen,
    isPropertiesOpen,
    isPropertiesExpanded,
    setNodes,
    setEdges,
    setWorkflowName,
    setSelectedNodeId,
    setIsSidebarOpen,
    setIsPropertiesOpen,
    setIsPropertiesExpanded,
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateNodeData,
    deleteNode,
    duplicateNode,
    executionResults,
    setExecutionResults,
    setLastExecutionAt,
    setIsDataPanelOpen,
  } = useWorkflowStore();

  // Local UI state
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

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
      if (workflowId === DEMO_WORKFLOW_ID) {
        setNodes(DEMO_WORKFLOW_DATA.graph.nodes);
        setEdges(DEMO_WORKFLOW_DATA.graph.edges);
        setWorkflowName(DEMO_WORKFLOW_DATA.name);
      } else {
        setNodes(workflow.graph.nodes || []);
        setEdges(workflow.graph.edges || []);
        setWorkflowName(workflow.name);
      }
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

  const onExecute = async (nodeId?: string) => {
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
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setIsPropertiesOpen(true);
  }, [setSelectedNodeId, setIsPropertiesOpen]);

  const onRenameNode = useCallback(() => {
    if (!selectedNodeId) return;
    updateNodeData(selectedNodeId, { label: newNodeName });
    setIsRenameDialogOpen(false);
  }, [newNodeName, selectedNodeId, updateNodeData]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !rfInstance) return;

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const definition = NODE_REGISTRY[type];
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
            label: definition.label 
        },
      };

      setNodes([...nodes, newNode]);
    },
    [rfInstance, nodes, setNodes]
  );
  
  const handleSave = () => {
    updateWorkflow.mutate({
      name: workflowName,
      graph: {
        nodes,
        edges
      }
    });
  };

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
                        onNodeContextMenu={(event, node) => {
                            setSelectedNodeId(node.id);
                        }}
                        onPaneContextMenu={(event) => {
                            setSelectedNodeId(null);
                            setIsPropertiesOpen(false);
                        }}
                        onPaneClick={() => {
                            setSelectedNodeId(null);
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
                    ) : (
                        <>
                            <ContextMenuLabel>Canvas Actions</ContextMenuLabel>
                            <ContextMenuItem onClick={() => setNodes([])}>Clear Canvas</ContextMenuItem>
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
            <Button onClick={onRenameNode}>Save Changes</Button>
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
        <div className="p-4 border-b">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Node Library</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <Accordion type="multiple" defaultValue={NODE_CATEGORIES.map(c => c.id)} className="w-full space-y-2">
            {NODE_CATEGORIES.map((cat) => (
              <AccordionItem key={cat.id} value={cat.id} className="border-none">
                <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center text-sm font-semibold">
                    <cat.icon className={cn("mr-2 h-4 w-4", cat.color)} />
                    {cat.label}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-1 space-y-2">
                  {Object.values(NODE_REGISTRY)
                    .filter(node => node.category === cat.id)
                    .map(node => (
                      <div 
                        key={node.type}
                        className={cn(
                          "group flex items-center p-3 border rounded-xl bg-card transition-all cursor-grab active:cursor-grabbing shadow-sm",
                          node.color === "blue" ? "hover:border-blue-500/50 hover:bg-blue-500/5" :
                          node.color === "orange" ? "hover:border-orange-500/50 hover:bg-orange-500/5" :
                          "hover:border-purple-500/50 hover:bg-purple-500/5"
                        )}
                        onDragStart={(e) => onDragStart(e, node.type)}
                        draggable
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center mr-3 transition-colors",
                          node.color === "blue" ? "bg-blue-500/10 group-hover:bg-blue-500/20" :
                          node.color === "orange" ? "bg-orange-500/10 group-hover:bg-orange-500/20" :
                          "bg-purple-500/10 group-hover:bg-purple-500/20"
                        )}>
                          <node.icon className={cn(
                            "h-4 w-4",
                            node.color === "blue" ? "text-blue-500" :
                            node.color === "orange" ? "text-orange-500" :
                            "text-purple-500"
                          )} />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{node.label}</div>
                          <div className="text-[10px] text-muted-foreground">{node.description}</div>
                        </div>
                      </div>
                    ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Data Results Panel */}
      <DataPanel />
    </div>
  );
}
