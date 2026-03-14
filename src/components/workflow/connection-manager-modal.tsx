import { useState, useMemo } from "react";
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
import { 
    Database, 
    Globe, 
    Plus, 
    Trash2, 
    Loader2, 
    RefreshCw, 
    CheckCircle2, 
    XCircle, 
    ShieldCheck, 
    Settings2, 
    HardDrive, 
    Cloud, 
    ArrowRight,
    Search,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ProviderType = "POSTGRES" | "S3" | "DRIVE" | "BIGQUERY";

interface Connection {
  id: string;
  name: string;
  provider: ProviderType;
  last_test_ok: boolean | null;
  last_tested_at: string | null;
  created_at: string;
}

interface ConnectionManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROVIDERS = [
    { id: "POSTGRES", label: "PostgreSQL / PostGIS", icon: Database, color: "text-blue-500", bg: "bg-blue-500/10", description: "Direct spatial database connection" },
    { id: "S3", label: "AWS S3 / Cloud Storage", icon: Cloud, color: "text-orange-500", bg: "bg-orange-500/10", description: "Object storage for rasters and assets" },
    { id: "DRIVE", label: "Google Drive", icon: HardDrive, color: "text-emerald-500", bg: "bg-emerald-500/10", description: "Personal and shared file access" },
    { id: "BIGQUERY", label: "Google BigQuery", icon: Globe, color: "text-purple-500", bg: "bg-purple-500/10", description: "Enterprise scale analytics" },
] as const;

export function ConnectionManagerModal({ open, onOpenChange }: ConnectionManagerModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"list" | "select-provider" | "configure">("list");
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null); // ID of connection being edited
  
  // Form State
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [search, setSearch] = useState("");

  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      const res = await apiClient.get("v1/connections");
      return res.data;
    },
    enabled: open,
  });

  const filteredConnections = useMemo(() => 
    connections.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  , [connections, search]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        provider: selectedProvider,
        credentials: { url },
        config: {}
      };
      
      if (isEditing) {
          return await apiClient.put(`v1/connections/${isEditing}`, payload);
      } else {
          return await apiClient.post("v1/connections", payload);
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Connector updated" : "Connector initialized");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(`Operation failed: ${err.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`v1/connections/${id}`);
    },
    onSuccess: () => {
      toast.success("Connector severed");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    }
  });

  const testMutation = useMutation({
      mutationFn: async (id: string) => {
          return await apiClient.post(`v1/connections/${id}/test`, {});
      },
      onSuccess: () => {
          toast.success("Signal connection verified");
          queryClient.invalidateQueries({ queryKey: ["connections"] });
      }
  });

  const resetForm = () => {
      setStep("list");
      setSelectedProvider(null);
      setIsEditing(null);
      setName("");
      setUrl("");
  };

  const startEdit = (conn: Connection) => {
      setIsEditing(conn.id);
      setSelectedProvider(conn.provider);
      setName(conn.name);
      setUrl(""); // We don't fetch plain text passwords/urls back
      setStep("configure");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if(!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-[95vw]! sm:max-w-[95vw]! w-full h-[90vh] flex! flex-col! p-0! gap-0! overflow-hidden border-none shadow-2xl ring-1 ring-primary/20 bg-background/95 backdrop-blur-xl">
        
        {/* Header - Unified across steps */}
        <DialogHeader className="p-8 pb-6 border-b shrink-0 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight uppercase truncate">
                  {step === "list" ? "External Grid" : (isEditing ? "Reconfigure Node" : "Initialize Link")}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {step === "list" ? "Manage distributed data connectors" : "Define encrypted credentials for remote access"}
                </DialogDescription>
              </div>
            </div>
            {step === "list" && (
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            placeholder="Find link..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-10 pl-10 pr-4 bg-muted/20 border-none rounded-xl w-64 font-bold text-xs"
                        />
                    </div>
                    <Button 
                        onClick={() => setStep("select-provider")}
                        className="rounded-xl font-black px-6 shadow-lg shadow-primary/20 h-10 uppercase tracking-widest text-[10px]"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Connect New
                    </Button>
                </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === "list" && (
              <div className="flex-1 overflow-auto p-8 pt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredConnections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-3xl opacity-60 bg-muted/5">
                      <div className="size-20 rounded-full bg-muted/10 flex items-center justify-center mb-6 border border-muted/20">
                        <Database className="h-10 w-10 opacity-20" />
                      </div>
                      <p className="font-black uppercase tracking-[0.3em] text-xs">No active connectors in range</p>
                      <Button variant="ghost" className="mt-4 text-primary font-bold" onClick={() => setStep("select-provider")}>Initialize first link</Button>
                  </div>
                ) : (
                  <div className="border rounded-2xl overflow-hidden shadow-sm bg-muted/10 animate-in fade-in duration-500">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 border-b">
                          <TableHead className="text-[10px] font-black uppercase py-4 pl-6">Status</TableHead>
                          <TableHead className="text-[10px] font-black uppercase py-4">Source Identity</TableHead>
                          <TableHead className="text-[10px] font-black uppercase py-4">Technology</TableHead>
                          <TableHead className="text-[10px] font-black uppercase py-4">Last Sync</TableHead>
                          <TableHead className="text-right text-[10px] font-black uppercase py-4 pr-6">Management</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredConnections.map((conn) => (
                          <TableRow key={conn.id} className="hover:bg-primary/5 transition-colors border-b last:border-0 group">
                            <TableCell className="pl-6">
                              {conn.last_test_ok === true ? (
                                <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] tracking-widest">
                                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                  <span>SYNCED</span>
                                </div>
                              ) : conn.last_test_ok === false ? (
                                <div className="flex items-center gap-2 text-destructive font-black text-[10px] tracking-widest">
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>SILENT</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] tracking-widest">
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin-slow opacity-50" />
                                  <span>VERIFYING</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-black text-sm tracking-tight text-foreground/90">{conn.name}</span>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{conn.id.split('-')[0]}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-2">
                                   <div className={cn("size-6 rounded-md flex items-center justify-center border", PROVIDERS.find(p => p.id === conn.provider)?.bg)}>
                                        {(() => {
                                            const Icon = PROVIDERS.find(p => p.id === conn.provider)?.icon || Database;
                                            return <Icon className={cn("size-3.5", PROVIDERS.find(p => p.id === conn.provider)?.color)} />
                                        })()}
                                   </div>
                                   <span className="text-[10px] font-black tracking-widest uppercase opacity-70">
                                      {conn.provider}
                                   </span>
                               </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">
                                    {conn.last_tested_at ? new Date(conn.last_tested_at).toLocaleString() : "Never"}
                                </span>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                                  title="Test Connection"
                                  onClick={() => testMutation.mutate(conn.id)}
                                  disabled={testMutation.isPending}
                                >
                                  {testMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-foreground/70 hover:bg-muted rounded-lg"
                                  title="Edit Config"
                                  onClick={() => startEdit(conn)}
                                >
                                  <Settings2 className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                  title="Terminate Link"
                                  onClick={() => {
                                    if (confirm("Permanently disconnect this resource?")) {
                                        deleteMutation.mutate(conn.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="size-3.5" />
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
          )}

          {step === "select-provider" && (
              <div className="flex-1 p-12 flex flex-col animate-in slide-in-from-bottom-8 duration-500">
                  <div className="mb-8">
                    <h4 className="text-xl font-black uppercase tracking-tight">Select Grid Technology</h4>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Choose the protocol for remote data transmission</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                      {PROVIDERS.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => {
                                setSelectedProvider(provider.id);
                                setStep("configure");
                            }}
                            className="flex items-start gap-5 p-6 rounded-3xl border-2 border-transparent bg-muted/5 hover:bg-muted/10 hover:border-primary/20 transition-all text-left group"
                          >
                              <div className={cn("size-14 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform", provider.bg)}>
                                  <provider.icon className={cn("size-7", provider.color)} />
                              </div>
                              <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                      <h5 className="font-black text-sm uppercase tracking-tight">{provider.label}</h5>
                                      <ChevronRight className="size-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                  </div>
                                  <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest opacity-60">{provider.description}</p>
                              </div>
                          </button>
                      ))}
                  </div>
                  <div className="mt-auto pt-10 border-t flex justify-end">
                      <Button variant="ghost" className="font-black uppercase tracking-widest text-[10px]" onClick={() => resetForm()}>Cancel</Button>
                  </div>
              </div>
          )}

          {step === "configure" && (
              <div className="flex-1 p-12 flex flex-col animate-in slide-in-from-right-8 duration-500 max-w-2xl mx-auto w-full">
                  <div className="flex items-center gap-4 mb-10">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center border", PROVIDERS.find(p => p.id === selectedProvider)?.bg)}>
                        {(() => {
                            const Icon = PROVIDERS.find(p => p.id === selectedProvider)?.icon || Database;
                            return <Icon className={cn("size-5", PROVIDERS.find(p => p.id === selectedProvider)?.color)} />
                        })()}
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">{isEditing ? "Modify" : "New"} {PROVIDERS.find(p => p.id === selectedProvider)?.label}</h4>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Protocol: {selectedProvider} Transmission</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                      <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1">Connector Alias</label>
                          <Input 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="e.g. Master Production Grid" 
                            className="rounded-2xl border-none bg-muted/20 h-12 px-5 font-bold text-sm focus:ring-2 ring-primary/20 transition-all"
                          />
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1">Secure Transmission URL</label>
                          <div className="relative">
                            <Input 
                                value={url} 
                                onChange={e => setUrl(e.target.value)} 
                                placeholder={selectedProvider === "POSTGRES" ? "postgres://user:pass@host:5432/db" : "s3://access_key:secret_key@region"} 
                                type="password"
                                className="rounded-2xl border-none bg-muted/20 h-12 px-5 font-mono text-xs focus:ring-2 ring-primary/20 transition-all pr-10"
                            />
                            <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-emerald-500 opacity-60" />
                          </div>
                      </div>
                      
                      {selectedProvider === "S3" && (
                          <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                              <Cloud className="size-4 text-orange-500 shrink-0 mt-0.5" />
                              <p className="text-[9px] font-bold text-orange-700/80 uppercase tracking-widest leading-normal">Ensure your S3 bucket CORS policy allows authenticated requests from this origin for metadata indexing.</p>
                          </div>
                      )}
                  </div>

                  <div className="mt-auto pt-10 flex gap-4 justify-end">
                      <Button variant="ghost" className="font-black uppercase tracking-widest text-[10px] h-11" onClick={() => isEditing ? resetForm() : setStep("select-provider")}>
                        {isEditing ? "Cancel" : "Back"}
                      </Button>
                      <Button 
                        disabled={createMutation.isPending || !name || (!isEditing && !url)}
                        className="rounded-xl font-black px-10 h-11 uppercase tracking-widest text-[11px] bg-primary shadow-lg shadow-primary/30"
                        onClick={() => createMutation.mutate()}
                      >
                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Update Link" : "Establish Signal"}
                      </Button>
                  </div>
              </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
