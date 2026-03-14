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
  }[definition.color] || "border-primary bg-primary/10 text-primary";

  const borderColor = {
    blue: "border-blue-500",
    orange: "border-orange-500",
    purple: "border-purple-500",
  }[definition.color] || "border-primary";

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
      {/* Target Handles */}
      {definition.inputs !== undefined && definition.inputs > 0 && Array.from({ length: definition.inputs }).map((_, i) => (
        <Handle
          key={`in-${i}`}
          type="target"
          position={Position.Left}
          id={`in-${i}`}
          style={{ top: definition.inputs === 1 ? '50%' : `${25 + (i * (50 / (definition.inputs! - 1)))}%` }}
          className={cn("w-3 h-3 border-2 border-background", borderColor.replace('border-', 'bg-'))}
        />
      ))}

      <div className={cn("p-2 flex items-center justify-between border-b border-current/20 rounded-t-[10px]", colorClass)}>
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <span className="font-semibold text-sm">{data.label || definition.label}</span>
        </div>
      </div>

      <div className="p-4 flex flex-col items-center justify-center min-h-[60px]">
        <span className="text-muted-foreground text-[10px] font-medium text-center line-clamp-2">
          {data.description || definition.description}
        </span>
      </div>

      {/* Source Handles */}
      {definition.outputs !== undefined && definition.outputs > 0 && Array.from({ length: definition.outputs }).map((_, i) => (
        <Handle
          key={`out-${i}`}
          type="source"
          position={Position.Right}
          id={`out-${i}`}
          style={{ top: definition.outputs === 1 ? '50%' : `${25 + (i * (50 / (definition.outputs! - 1)))}%` }}
          className={cn("w-3 h-3 border-2 border-background", borderColor.replace('border-', 'bg-'))}
        />
      ))}
    </div>
  );
}
