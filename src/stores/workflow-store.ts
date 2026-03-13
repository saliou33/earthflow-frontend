import { create } from "zustand";
import { 
  Connection, 
  Edge, 
  Node, 
  addEdge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  workflowName: string;
  isSidebarOpen: boolean;
  isPropertiesOpen: boolean;
  isPropertiesExpanded: boolean;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setWorkflowName: (name: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsPropertiesOpen: (open: boolean) => void;
  setIsPropertiesExpanded: (expanded: boolean) => void;
  
  // React Flow Handlers
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  
  // Node Operations
  updateNodeData: (nodeId: string, data: any) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowName: "",
  isSidebarOpen: true,
  isPropertiesOpen: false,
  isPropertiesExpanded: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setWorkflowName: (workflowName) => set({ workflowName }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setIsPropertiesOpen: (isPropertiesOpen) => set({ isPropertiesOpen }),
  setIsPropertiesExpanded: (isPropertiesExpanded) => set({ isPropertiesExpanded }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      isPropertiesOpen: get().selectedNodeId === nodeId ? false : get().isPropertiesOpen,
    });
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const newNode = {
      ...node,
      id: `${node.type}-${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      selected: false,
    };

    set({
      nodes: [...get().nodes, newNode],
    });
  },
}));
