"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Settings, Info } from "lucide-react";
import { Node } from "@xyflow/react";

import { NODE_REGISTRY } from "@/lib/workflow-registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DateTimeRangePicker } from "@/components/ui/date-time-range-picker";
import { cn } from "@/lib/utils";

interface NodePropertiesPanelProps {
  node: Node;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
}

export function NodePropertiesPanel({ node, onClose, onUpdate }: NodePropertiesPanelProps) {
  const definition = NODE_REGISTRY[node.type || ""];

  // Generate Zod schema dynamically based on definition parameters
  const schema = useMemo(() => {
    const shape: Record<string, any> = {};
    definition?.parameters?.forEach((param) => {
      let fieldSchema: any;
      
      switch (param.type) {
        case "text":
        case "select":
        case "color":
        case "date":
        case "file":
          fieldSchema = z.string();
          if (param.required) fieldSchema = fieldSchema.min(1, "Required");
          break;
        case "number":
        case "range":
          fieldSchema = z.number();
          break;
        case "boolean":
          fieldSchema = z.boolean();
          break;
        case "datetime-range":
          fieldSchema = z.object({
            start: z.string().min(1, "Required"),
            end: z.string().min(1, "Required"),
          });
          break;
        default:
          fieldSchema = z.any();
      }

      if (!param.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      shape[param.id] = fieldSchema;
    });
    return z.object(shape);
  }, [definition]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: node.data,
  });

  // Sync form when node changes (e.g. user selects a different node)
  useEffect(() => {
    reset(node.data);
  }, [node.id, reset, node.data]);

  if (!node || !definition) return null;

  const onSubmit = (data: any) => {
    onUpdate(node.id, data);
    reset(data); // Clear dirty state
  };

  return (
    <div className="flex flex-col h-full bg-background border-l shadow-2xl">
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center space-x-2">
          <Settings className="size-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Node Settings</h3>
        </div>
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1 p-4 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Type</label>
            <div className="flex items-center space-x-2">
                <div className={cn(
                    "size-6 rounded flex items-center justify-center",
                    definition.color === "blue" ? "bg-blue-500/10 text-blue-500" :
                    definition.color === "orange" ? "bg-orange-500/10 text-orange-500" :
                    "bg-purple-500/10 text-purple-500"
                )}>
                    <definition.icon className="size-3.5" />
                </div>
                <span className="text-sm font-medium">{definition.label}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4 pb-4">
            {definition.parameters?.map((param) => {
              const value = watch(param.id);
              
              return (
                <div key={param.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={param.id} className="text-sm font-semibold flex items-center gap-1">
                      {param.label}
                      {param.required && <span className="text-destructive">*</span>}
                    </Label>
                    {param.description && (
                      <div className="group relative">
                        <Info className="size-3.5 text-muted-foreground cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded border shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          {param.description}
                        </div>
                      </div>
                    )}
                  </div>

                  {param.type === "text" && (
                    <Input
                      id={param.id}
                      {...register(param.id)}
                      placeholder={param.placeholder}
                      className={cn("h-9", errors[param.id] && "border-destructive")}
                    />
                  )}

                  {param.type === "number" && (
                    <Input
                      id={param.id}
                      type="number"
                      {...register(param.id, { valueAsNumber: true })}
                      placeholder={param.placeholder}
                      className={cn("h-9", errors[param.id] && "border-destructive")}
                    />
                  )}

                  {param.type === "select" && (
                    <Select
                      value={String(value ?? param.default ?? "")}
                      onValueChange={(val) => setValue(param.id, val, { shouldDirty: true })}
                    >
                      <SelectTrigger id={param.id} className="h-9">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options?.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {param.type === "boolean" && (
                    <div className="flex items-center space-x-2 pt-1">
                      <Switch
                        id={param.id}
                        checked={!!value}
                        onCheckedChange={(checked) => setValue(param.id, checked, { shouldDirty: true })}
                      />
                      <Label htmlFor={param.id} className="text-xs text-muted-foreground font-normal">
                        {value ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  )}

                  {param.type === "file" && (
                    <Input
                      id={param.id}
                      type="file"
                      accept={param.accept}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setValue(param.id, file.name, { shouldDirty: true });
                      }}
                      className="h-9 py-1 file:text-xs"
                    />
                  )}

                  {param.type === "range" && (
                    <div className="space-y-3 pt-1">
                      <input
                        type="range"
                        min={param.min ?? 0}
                        max={param.max ?? 100}
                        step={param.step ?? 1}
                        value={Number(value ?? param.default ?? 0)}
                        onChange={(e) => setValue(param.id, parseFloat(e.target.value), { shouldDirty: true })}
                        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>{param.min ?? 0}</span>
                        <span className="text-foreground font-bold">{value ?? param.default ?? 0}</span>
                        <span>{param.max ?? 100}</span>
                      </div>
                    </div>
                  )}

                  {param.type === "color" && (
                    <div className="flex items-center space-x-3">
                      <input
                        id={param.id}
                        type="color"
                        value={String(value ?? param.default ?? "#000000")}
                        onChange={(e) => setValue(param.id, e.target.value, { shouldDirty: true })}
                        className="size-9 p-1 bg-transparent border rounded cursor-pointer"
                      />
                      <span className="text-xs font-mono text-muted-foreground uppercase">
                        {String(value ?? param.default ?? "#000000")}
                      </span>
                    </div>
                  )}

                  {param.type === "date" && (
                    <DateTimePicker
                      date={value ? new Date(value) : undefined}
                      onChange={(date) => setValue(param.id, date?.toISOString(), { shouldDirty: true })}
                      placeholder={param.placeholder}
                    />
                  )}

                  {/* Note: We handle datetime-range as a special case */}
                  {param.type === "datetime-range" && (
                    <DateTimeRangePicker
                      range={value ? { 
                        start: new Date(value.start), 
                        end: new Date(value.end) 
                      } : undefined}
                      onChange={(range) => setValue(param.id, range ? {
                        start: range.start.toISOString(),
                        end: range.end.toISOString()
                      } : undefined, { shouldDirty: true })}
                      placeholder={param.placeholder}
                    />
                  )}

                  {errors[param.id] && (
                    <p className="text-[10px] text-destructive font-medium">
                      {errors[param.id]?.message as string}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t bg-muted/10">
            <Button 
                type="submit" 
                className="w-full shadow-lg" 
                size="sm"
                disabled={!isDirty}
            >
                Apply Changes
            </Button>
        </div>
      </form>
    </div>
  );
}

