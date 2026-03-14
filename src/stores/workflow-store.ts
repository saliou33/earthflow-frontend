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
  // UI State
  isSidebarOpen: boolean;
  isPropertiesOpen: boolean;
  isPropertiesExpanded: boolean;
  isRenameDialogOpen: boolean;
  isAssetModalOpen: boolean;
  isConnectionModalOpen: boolean;
  isHistoryDialogOpen: boolean;
  isExecuting: boolean;
  newNodeName: string;
  nodeToDelete: string | null;
  isClearExecutionsAlertOpen: boolean;
  
  // Execution & UI Panels
  executionResults: Record<string, any> | null;
  lastExecutionAt: string | null;
  isDataPanelOpen: boolean;
  dataPanelHeight: number;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setWorkflowName: (name: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsPropertiesOpen: (open: boolean) => void;
  setIsPropertiesExpanded: (expanded: boolean) => void;
  setIsRenameDialogOpen: (open: boolean) => void;
  setIsAssetModalOpen: (open: boolean) => void;
  setIsConnectionModalOpen: (open: boolean) => void;
  setIsHistoryDialogOpen: (open: boolean) => void;
  setIsExecuting: (executing: boolean) => void;
  setNewNodeName: (name: string) => void;
  setNodeToDelete: (id: string | null) => void;
  setIsClearExecutionsAlertOpen: (open: boolean) => void;
  
  setExecutionResults: (results: Record<string, any> | null) => void;
  setIsDataPanelOpen: (open: boolean) => void;
  setDataPanelHeight: (height: number) => void;
  setLastExecutionAt: (at: string | null) => void;
  
  // React Flow Handlers
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  
  // Node Operations
  addNode: (type: string, position: { x: number, y: number }, label?: string) => string;
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
  isRenameDialogOpen: false,
  isAssetModalOpen: false,
  isConnectionModalOpen: false,
  isHistoryDialogOpen: false,
  isExecuting: false,
  newNodeName: "",
  nodeToDelete: null,
  isClearExecutionsAlertOpen: false,
  executionResults: null,
  lastExecutionAt: null,
  isDataPanelOpen: false,
  dataPanelHeight: 300,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setWorkflowName: (workflowName) => set({ workflowName }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setIsPropertiesOpen: (isPropertiesOpen) => set({ isPropertiesOpen }),
  setIsPropertiesExpanded: (isPropertiesExpanded) => set({ isPropertiesExpanded }),
  setIsRenameDialogOpen: (isRenameDialogOpen) => set({ isRenameDialogOpen }),
  setIsAssetModalOpen: (isAssetModalOpen) => set({ isAssetModalOpen }),
  setIsConnectionModalOpen: (isConnectionModalOpen) => set({ isConnectionModalOpen }),
  setIsHistoryDialogOpen: (isHistoryDialogOpen) => set({ isHistoryDialogOpen }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setNewNodeName: (newNodeName) => set({ newNodeName }),
  setNodeToDelete: (nodeToDelete) => set({ nodeToDelete }),
  setIsClearExecutionsAlertOpen: (isClearExecutionsAlertOpen) => set({ isClearExecutionsAlertOpen }),

  setExecutionResults: (executionResults) => set({ executionResults }),
  setIsDataPanelOpen: (isDataPanelOpen) => set({ isDataPanelOpen }),
  setDataPanelHeight: (dataPanelHeight) => set({ dataPanelHeight }),
  setLastExecutionAt: (lastExecutionAt) => set({ lastExecutionAt }),

  onNodesChange: (changes) => {
    const nextNodes = applyNodeChanges(changes, get().nodes);
    
    // React Flow's applyNodeChanges only handles node state. 
    // We need to manually clean up edges if nodes are removed (e.g. via Delete key)
    const removedNodeIds = changes
      .filter((c) => c.type === "remove")
      .map((c: any) => c.id);

    if (removedNodeIds.length > 0) {
      set({
        nodes: nextNodes,
        edges: get().edges.filter(
          (edge) => !removedNodeIds.includes(edge.source) && !removedNodeIds.includes(edge.target)
        ),
      });
    } else {
      set({ nodes: nextNodes });
    }
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

  addNode: (type, position, label) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: label ? { label } : {},
    };

    set({
      nodes: [...get().nodes, newNode],
      selectedNodeId: newNode.id,
      isPropertiesOpen: true,
    });

    return newNode.id;
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
