"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, Play, Menu, Maximize, Settings, Map as MapIcon, LibrarySquare, ZoomIn, ZoomOut, Expand } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  ReactFlow, 
  Background, 
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
// MapLibre and React Map GL imports will be added in Milestone 4

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

import { BaseNode } from "@/components/nodes/BaseNode";
import { NODE_REGISTRY, NODE_CATEGORIES } from "@/lib/workflow-registry";

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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [workflowName, setWorkflowName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMapPanelOpen, setIsMapPanelOpen] = useState(true);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  
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
  }, [workflow, setNodes, setEdges]);

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

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

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
      if (typeof type === 'undefined' || !type || !rfInstance) {
        return;
      }

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type} Node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [rfInstance, setNodes]
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
  const onNodeClick = useCallback(() => setIsMapPanelOpen(true), []);

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
      <div className="absolute inset-0 z-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>

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
          <Input 
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="max-w-[300px] border-transparent hover:border-border focus:border-border shadow-none text-base font-semibold focus-visible:ring-0 px-2 h-8 bg-transparent transition-colors"
          />
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
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8">
            <Play className="mr-2 h-4 w-4" />
            Execute
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-8 w-8 hover:bg-muted text-muted-foreground"
            onClick={() => setIsMapPanelOpen(!isMapPanelOpen)}
          >
            <MapIcon className="h-4 w-4" />
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

      {/* Right Sidebar (Map Preview) - Floating overlay */}
      <div 
        className={`absolute top-20 right-4 bottom-24 z-10 w-96 bg-background/95 backdrop-blur-md border rounded-xl shadow-lg flex flex-col transition-all duration-300 ease-in-out ${
          isMapPanelOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"
        }`}
      >
        <div className="p-3 border-b flex items-center justify-between">
            <span className="font-medium text-sm flex items-center">
                <MapIcon className="mr-2 h-4 w-4 text-primary" /> Map Preview
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMapPanelOpen(false)}>
                <Maximize className="h-3 w-3" />
            </Button>
        </div>
        <div className="flex-1 relative flex items-center justify-center bg-muted/30 m-2 rounded-lg border border-dashed">
          <p className="text-muted-foreground text-sm flex flex-col items-center">
            <MapIcon className="h-8 w-8 mb-2 opacity-30" />
            Map viewport placeholder
          </p>
        </div>
      </div>
    </div>
  );
}
