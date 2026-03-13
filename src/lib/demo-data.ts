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
