import { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { NodeDefinition, NODE_REGISTRY } from "@/lib/workflow-registry";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/stores/workflow-store";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface BaseNodeProps {
  id: string;
  data: any;
  type: string;
  selected?: boolean;
}

export function BaseNode({ id, data, type, selected }: BaseNodeProps) {
  const { executionResults } = useWorkflowStore();
  const output = executionResults?.[id];
  const status = output ? (output.error ? "error" : "success") : null;

  const definition = NODE_REGISTRY[type];

  if (!definition) {
    return (
      <div className="p-4 border-2 border-dashed border-destructive rounded-xl bg-destructive/10 text-destructive text-xs italic">
        Unknown Node Type: {type}
      </div>
    );
  }

  const Icon = definition.icon;
  const colorClass = {
    blue: "border-blue-500 bg-blue-500/10 text-blue-500",
    orange: "border-orange-500 bg-orange-500/10 text-orange-500",
    purple: "border-purple-500 bg-purple-500/10 text-purple-500",
    emerald: "border-emerald-500 bg-emerald-500/10 text-emerald-500",
    amber: "border-amber-500 bg-amber-500/10 text-amber-500",
    pink: "border-pink-500 bg-pink-500/10 text-pink-500",
  }[definition.color] || "border-primary bg-primary/10 text-primary";

  const borderColor = {
    blue: "border-blue-500",
    orange: "border-orange-500",
    purple: "border-purple-500",
    emerald: "border-emerald-500",
    amber: "border-amber-500",
    pink: "border-pink-500",
  }[definition.color] || "border-primary";

  const handleColor = {
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    pink: "bg-pink-500",
  }[definition.color] || "bg-primary";

  // Determine the display label dynamically
  const displayLabel = useMemo(() => {
    // 1. User's explicit custom label
    if (data.label) return data.label;

    // 2. Dynamic label based on the main parameter defined in registry
    if (definition.mainParameter) {
        // Check for an explicit naming override from selectors (e.g. _assetIdName)
        let val = data[`_${definition.mainParameter}Name`] || data[definition.mainParameter];
        if (val !== undefined && val !== null && val !== "") {
            val = String(val); // Safely convert numbers or booleans to string
            // Shorten if it's too long
            return val.length > 20 ? val.substring(0, 17) + "..." : val;
        }
    }

    // 3. Fallback to default human-readable type label
    return definition.label;
  }, [data, definition]);

  const displayDescription = data.description || definition.description;

  return (
    <div className={cn(
      "relative bg-card border-2 rounded-xl shadow-lg min-w-[200px] transition-all duration-200",
      borderColor,
      selected ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""
    )}>
      {/* Status Badges */}
      {status === "success" && (
        <div className="absolute -top-2 -right-2 z-10 bg-green-500 rounded-full border-2 border-background p-0.5 shadow-sm">
          <CheckCircle2 className="size-3 text-white" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute -top-2 -right-2 z-10 bg-destructive rounded-full border-2 border-background p-0.5 shadow-sm">
          <AlertCircle className="size-3 text-white animate-pulse" />
        </div>
      )}

      <div className={cn("p-2 flex items-center justify-between border-b border-current/20 rounded-t-[10px]", colorClass)}>
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <span className="font-semibold text-sm">{displayLabel}</span>
        </div>
      </div>

      <div className="p-4 flex flex-col items-center justify-center min-h-[60px]">
        <span className="text-muted-foreground text-[10px] font-medium text-center line-clamp-2">
          {displayDescription}
        </span>
      </div>

      {/* Handles rendered last so they are visually on top */}
      {/* Target Handles (Inputs) */}
      {(() => {
        if (!definition.inputs) return null;
        const inputs = Array.isArray(definition.inputs) 
          ? definition.inputs 
          : Array.from({ length: definition.inputs }, (_, i) => i === 0 ? "input" : String(i));

        return inputs.map((inputId, index) => {
          const top = inputs.length === 1 ? "50%" : `${20 + (index * 60) / (inputs.length - 1)}%`;
          return (
            <div key={inputId} className="group/handle z-50">
              <Handle
                type="target"
                position={Position.Left}
                id={inputId}
                style={{ top }}
                className={cn("w-3 h-3 border-2 border-background", handleColor)}
              />
              {/* Handlers with labels removed per user request */}
            </div>
          );
        });
      })()}

      {/* Source Handles (Outputs) */}
      {(() => {
        if (!definition.outputs) return null;
        const outputs = Array.isArray(definition.outputs) 
          ? definition.outputs 
          : Array.from({ length: definition.outputs }, (_, i) => i === 0 ? "output" : String(i));

        return outputs.map((outputId, index) => {
          const top = outputs.length === 1 ? "50%" : `${20 + (index * 60) / (outputs.length - 1)}%`;
          return (
            <div key={outputId} className="group/handle z-50">
              <Handle
                type="source"
                position={Position.Right}
                id={outputId}
                style={{ top }}
                className={cn("w-3 h-3 border-2 border-background", handleColor)}
              />
            </div>
          );
        });
      })()}
    </div>
  );
}
