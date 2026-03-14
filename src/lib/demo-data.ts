import { Node, Edge } from "@xyflow/react";

export const DEMO_WORKFLOW_ID = "d0000000-0000-0000-0000-000000000000";

export const DEMO_WORKFLOW_DATA = {
  id: DEMO_WORKFLOW_ID,
  name: "Math Expression Demo (Static)",
  description: "A demo showing variables being combined in a Rhai expression (Frontend Static Override).",
  graph: {
    nodes: [
      {
        id: "node-v1",
        type: "variable",
        position: { x: 100, y: 100 },
        data: { value: "10.0", label: "a", inputType: "float" }
      },
      {
        id: "node-v2",
        type: "variable",
        position: { x: 100, y: 250 },
        data: { value: "5.0", label: "b", inputType: "float" }
      },
      {
        id: "node-exp",
        type: "expression",
        position: { x: 400, y: 175 },
        data: { expression: "a + b" }
      }
    ] as Node[],
    edges: [
      {
        id: "edge-1",
        source: "node-v1",
        target: "node-exp",
        sourceHandle: "value",
        targetHandle: "a"
      },
      {
        id: "edge-2",
        source: "node-v2",
        target: "node-exp",
        sourceHandle: "value",
        targetHandle: "b"
      }
    ] as Edge[]
  }
};

export const VECTOR_DEMO_DATA = {
  id: "v-demo-analysis",
  name: "Advanced Vector Chain",
  description: "Chain: Buffer -> Centroid -> Buffer -> Convex Hull -> Simplify",
  graph: {
    nodes: [
      { id: "v1", type: "vector_input", position: { x: 0, y: 0 }, data: { label: "Cities" } },
      { id: "v2", type: "vector.buffer", position: { x: 250, y: 0 }, data: { distance: 100 } },
      { id: "v3", type: "vector.centroid", position: { x: 500, y: 0 }, data: {} },
      { id: "v4", type: "vector.buffer", position: { x: 750, y: 0 }, data: { distance: 50 } },
      { id: "v5", type: "vector.convex_hull", position: { x: 1000, y: 0 }, data: {} },
      { id: "v6", type: "vector.simplify", position: { x: 1250, y: 0 }, data: { tolerance: 0.1 } },
    ] as Node[],
    edges: [
      { id: "e1", source: "v1", target: "v2", sourceHandle: "output", targetHandle: "input" },
      { id: "e2", source: "v2", target: "v3", sourceHandle: "output", targetHandle: "input" },
      { id: "e3", source: "v3", target: "v4", sourceHandle: "output", targetHandle: "input" },
      { id: "e4", source: "v4", target: "v5", sourceHandle: "output", targetHandle: "input" },
      { id: "e5", source: "v5", target: "v6", sourceHandle: "output", targetHandle: "input" },
    ] as Edge[]
  }
};
