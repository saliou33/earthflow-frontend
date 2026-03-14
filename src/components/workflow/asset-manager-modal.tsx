import { useState, useRef, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileType, Search, Database, Trash2, Loader2, RefreshCw, Filter, Clock, BarChart3, Pencil } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  description: string | null;
  asset_type: string;
  storage_uri: string;
  created_at: string;
}

interface AssetManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssetManagerModal = memo(function AssetManagerModal({ open, onOpenChange }: AssetManagerModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: assets = [], isLoading, isRefetching, refetch } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await apiClient.get("v1/assets");
      return res.data;
    },
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      
      const res = await apiClient.post("v1/assets/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Asset uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string, name: string, description: string }) => {
      const res = await apiClient.put(`v1/assets/${id}`, { name, description });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Asset updated");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setEditingAsset(null);
    },
    onError: (error: any) => {
      toast.error(`Update failed: ${error.message || "Unknown error"}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`v1/assets/${id}`);
    },
    onSuccess: () => {
      toast.success("Asset deleted");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete asset: ${error.message || "Unknown error"}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadMutation.mutate(file);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const startEditing = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditDescription(asset.description || "");
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !selectedType || a.asset_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw]! sm:max-w-[95vw]! w-full h-[90vh] flex! flex-col! p-0! gap-0! overflow-hidden border-none shadow-2xl ring-1 ring-primary/20">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-muted/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                  <Database className="h-6 w-6 text-primary" />
               </div>
               <div>
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center uppercase text-foreground">
                  Data Lakehouse
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  Multi-modal Spatial refinery
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
              />
              <Button 
                variant="ghost" 
                size="icon"
                className="size-10 rounded-xl hover:bg-primary/10 transition-colors"
                onClick={() => refetch()}
                disabled={isRefetching || isLoading}
              >
                <RefreshCw className={cn("h-5 w-5", (isRefetching || isLoading) && "animate-spin")} />
              </Button>
              <Button 
                className="h-10 rounded-xl px-6 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Dataset
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 border-r bg-muted/20 flex flex-col shrink-0 p-6 space-y-8">
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                  <Filter className="size-3" />
                  Filter Catalog
               </h4>
               <div className="space-y-1">
                  <SidebarFilterItem 
                    active={selectedType === null} 
                    onClick={() => setSelectedType(null)} 
                    count={assets.length}
                    label="All Assets" 
                  />
                  <SidebarFilterItem 
                    active={selectedType === "VECTOR"} 
                    onClick={() => setSelectedType("VECTOR")} 
                    count={assets.filter(a => a.asset_type === "VECTOR").length}
                    label="Vector Data" 
                  />
                  <SidebarFilterItem 
                    active={selectedType === "RASTER"} 
                    onClick={() => setSelectedType("RASTER")} 
                    count={assets.filter(a => a.asset_type === "RASTER").length}
                    label="Raster Layers" 
                  />
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                  <Clock className="size-3" />
                  Recent Activity
               </h4>
               <div className="space-y-3">
                  {assets.slice(0, 3).map(asset => (
                    <div key={asset.id} className="flex flex-col gap-1 pr-2">
                        <span className="text-[11px] font-semibold truncate leading-tight">{asset.name}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">{format(new Date(asset.created_at), "MMM d, HH:mm")}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="mt-auto p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary uppercase">Storage Used</span>
                    <BarChart3 className="size-3 text-primary" />
                </div>
                <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full w-[12%] bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">1.2 GB of 10 GB</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            <div className="px-6 py-4 border-b shrink-0 flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 border-none focus-within:ring-1 ring-primary/20 transition-all">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input 
                  placeholder="Query assets by name, tag, or metadata..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {isLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground flex-col">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading catalog...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground flex-col border-2 border-dashed rounded-xl m-8">
                <Database className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium text-foreground">No assets found</p>
                <p className="max-w-sm text-center mt-2">
                  {searchTerm ? "Try adjusting your search query." : "Upload your first asset to the Data Lakehouse to get started."}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg bg-background overflow-hidden relative shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Type</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Asset Name</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Storage URI</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Uploaded</TableHead>
                      <TableHead className="w-[80px] text-right text-[10px] font-bold uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow key={asset.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className={cn(
                            "px-2 py-1 rounded text-[10px] font-bold w-max border",
                            asset.asset_type === "VECTOR" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            "bg-gray-500/10 text-gray-500 border-gray-500/20"
                          )}>
                            {asset.asset_type || "UNKNOWN"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileType className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{asset.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          {asset.storage_uri}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(asset.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => startEditing(asset)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this asset?")) {
                                  deleteMutation.mutate(asset.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
        
        {/* Edit Sub-Modal */}
        <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Asset Metadata</DialogTitle>
                    <DialogDescription>
                        Update the name and description for this data lakehouse asset.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</label>
                        <Input 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                          placeholder="Asset name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                        <textarea 
                          value={editDescription} 
                          onChange={e => setEditDescription(e.target.value)}
                          placeholder="Briefly describe this resource"
                          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setEditingAsset(null)}>Cancel</Button>
                    <Button 
                      onClick={() => updateMutation.mutate({ 
                        id: editingAsset!.id, 
                        name: editName, 
                        description: editDescription 
                      })}
                      disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
});

function SidebarFilterItem({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count: number }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group",
                active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
            )}
        >
            <span>{label}</span>
            <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md",
                active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
                {count}
            </span>
        </button>
    )
}
