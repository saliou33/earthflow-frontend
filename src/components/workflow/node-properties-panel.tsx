"use client";

import { useState, useMemo, useEffect, memo } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Settings, Info, Maximize2, Minimize2 } from "lucide-react";
import { Node } from "@xyflow/react";

import { useWorkflowStore } from "@/stores/workflow-store";
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
import { AutocompleteHelper } from "@/components/workflow/autocomplete-helper";
import { MapInput } from "@/components/workflow/map-input";
import { AssetSelector } from "@/components/workflow/asset-selector";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface NodePropertiesPanelProps {
  node: Node;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
}

export const NodePropertiesPanel = memo(function NodePropertiesPanel({ node, onClose, onUpdate }: NodePropertiesPanelProps) {
  const definition = NODE_REGISTRY[node.type || ""];
  const { isPropertiesExpanded, setIsPropertiesExpanded } = useWorkflowStore();

  // Generate Zod schema dynamically based on definition parameters
  const schema = useMemo(() => {
    const shape: Record<string, any> = {
      label: z.string().optional(),
      description: z.string().optional(),
    };
    definition?.parameters?.forEach((param) => {
      let fieldSchema: any;
      
      switch (param.type) {
        case "text":
        case "select":
        case "color":
        case "date":
        case "datetime":
        case "file":
        case "asset":
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema as any),
    defaultValues: {
      ...node.data,
      label: node.data.label || "", // Don't eagerly fallback to definition.label, let it be dynamically resolved
      description: node.data.description || "",
    } as any,
  });

  const formData = watch();
  const debouncedFormData = useDebounce(formData, 500);

  // Auto-save on form change
  useEffect(() => {
    if (debouncedFormData) {
        onUpdate(node.id, debouncedFormData);
    }
  }, [debouncedFormData, node.id, onUpdate]);

  // Sync form when node changes (e.g. user selects a different node)
  useEffect(() => {
    reset({
      ...node.data,
      label: node.data.label || "",
      description: node.data.description || "",
    });
  }, [node.id, reset, node.data, definition]);

  if (!node || !definition) return null;

  // Filter out parameters that conflict with global fields
  const customParameters = definition.parameters?.filter(p => p.id !== "label" && p.id !== "description") || [];

  return (
    <div className={cn(
        "flex flex-col h-full shadow-2xl overflow-hidden",
        isPropertiesExpanded ? "bg-background border-l" : "bg-background/95 backdrop-blur-md rounded-xl border"
    )}>
      <div className="p-3 border-b flex items-center justify-between bg-muted/30 shrink-0">
        <div className="flex items-center space-x-2">
          <Settings className="size-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Node Settings</h3>
        </div>
        <div className="flex items-center gap-0.5">
            <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 rounded-lg" 
                onClick={() => setIsPropertiesExpanded(!isPropertiesExpanded)}
                title={isPropertiesExpanded ? "Collapse to Overlay" : "Expand to Sidebar"}
            >
                {isPropertiesExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={onClose}>
                <X className="size-4" />
            </Button>
        </div>
      </div>

      <form className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1 p-4 space-y-5 pb-8">
            {customParameters.map((param) => {
              const value = watch(param.id);
              
              return (
                <div key={param.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={param.id} className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                      {param.label}
                      {param.required && <span className="text-destructive">*</span>}
                    </Label>
                    {param.description && (
                      <div className="group relative">
                        <Info className="size-3 text-muted-foreground cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded border shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          {param.description}
                        </div>
                      </div>
                    )}
                  </div>

                  {param.type === "text" && (
                    <AutocompleteHelper 
                      onSelect={(suggestion) => {
                        const current = watch(param.id) || "";
                        setValue(param.id, current + suggestion, { shouldDirty: true });
                      }}
                      context={param.id === "expression" ? "expression" : "text"}
                    >
                      <Input
                        id={param.id}
                        {...register(param.id)}
                        placeholder={param.placeholder}
                        className={cn("h-8 text-sm", errors[param.id] && "border-destructive")}
                      />
                    </AutocompleteHelper>
                  )}

                  {param.type === "number" && (
                    <Input
                      id={param.id}
                      type="number"
                      {...register(param.id, { valueAsNumber: true })}
                      placeholder={param.placeholder}
                      className={cn("h-8 text-sm", errors[param.id] && "border-destructive")}
                    />
                  )}

                  {param.type === "select" && (
                    <Select
                      value={String(value ?? param.default ?? "")}
                      onValueChange={(val) => setValue(param.id, val, { shouldDirty: true })}
                    >
                      <SelectTrigger id={param.id} className="h-8 w-full text-sm">
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
                    <div className="flex items-center justify-between py-1 px-2 border rounded-lg bg-muted/5 h-9">
                      <Label htmlFor={param.id} className="text-xs text-muted-foreground font-normal">
                        {value ? "Enabled" : "Disabled"}
                      </Label>
                      <Switch
                        id={param.id}
                        checked={!!value}
                        onCheckedChange={(checked) => setValue(param.id, checked, { shouldDirty: true })}
                        className="scale-90"
                      />
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
                      className="h-8 py-1 text-xs file:hidden"
                    />
                  )}

                  {param.type === "range" && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="range"
                        min={param.min ?? 0}
                        max={param.max ?? 100}
                        step={param.step ?? 1}
                        value={Number(value ?? param.default ?? 0)}
                        onChange={(e) => setValue(param.id, parseFloat(e.target.value), { shouldDirty: true })}
                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[9px] text-muted-foreground font-medium px-0.5">
                        <span>{param.min ?? 0}</span>
                        <span className="text-foreground font-bold">{value ?? param.default ?? 0}</span>
                        <span>{param.max ?? 100}</span>
                      </div>
                    </div>
                  )}

                  {param.type === "color" && (
                    <div className="flex items-center space-x-3">
                      <div className="relative size-8 rounded border overflow-hidden shrink-0">
                          <input
                            id={param.id}
                            type="color"
                            value={String(value ?? param.default ?? "#000000")}
                            onChange={(e) => setValue(param.id, e.target.value, { shouldDirty: true })}
                            className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer"
                          />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground uppercase">
                        {String(value ?? param.default ?? "#000000")}
                      </span>
                    </div>
                  )}

                  {(param.type === "date" || param.type === "datetime") && (
                    <DateTimePicker
                      date={value ? new Date(value as string) : undefined}
                      onChange={(date) => setValue(param.id, date?.toISOString(), { shouldDirty: true })}
                      placeholder={param.placeholder}
                      className="h-8 text-sm"
                    />
                  )}

                  {/* Note: We handle datetime-range as a special case */}
                  {param.type === "datetime-range" && (
                    <DateTimeRangePicker
                      range={value ? { 
                        start: new Date((value as any).start), 
                        end: new Date((value as any).end) 
                      } : undefined}
                      onChange={(range) => setValue(param.id, range ? {
                        start: range.start.toISOString(),
                        end: range.end.toISOString()
                      } : undefined, { shouldDirty: true })}
                      placeholder={param.placeholder}
                      className="h-8 text-xs"
                    />
                  )}

                  {param.type === "asset" && (
                    <AssetSelector
                      value={String(value ?? param.default ?? "")}
                      onChange={(val, assetName) => {
                         setValue(param.id, val, { shouldDirty: true });
                         if (assetName) setValue(`_${param.id}Name`, assetName, { shouldDirty: true });
                      }}
                      placeholder="Search and select assets..."
                    />
                  )}

                  {param.type === "map" && (
                    <MapInput 
                      value={value} 
                      onChange={(val) => setValue(param.id, val, { shouldDirty: true })} 
                    />
                  )}

                  {errors[param.id] && (
                    <p className="text-[10px] text-destructive font-medium">
                      {String(errors[param.id]?.message ?? "")}
                    </p>
                  )}
                </div>
              );
            })}

          {customParameters.length > 0 && <Separator className="my-2" />}

            <div className="space-y-1.5">
               <Label htmlFor="node-label" className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Custom Label
               </Label>
               <Input 
                  id="node-label"
                  {...register("label")}
                  placeholder={definition.label}
                  className="h-8 text-sm font-bold border-primary/20 bg-primary/5 focus-visible:ring-primary/30"
               />
            </div>
            
            <div className="space-y-1.5">
               <Label htmlFor="node-description" className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Annotation / Purpose
               </Label>
               <textarea 
                  id="node-description"
                  {...register("description")}
                  placeholder="Optional notes about this operation..."
                  className="w-full min-h-[60px] p-2 text-xs rounded-md border bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:italic transition-all"
               />
            </div>


        </div>

      </form>
    </div>
  );
});

