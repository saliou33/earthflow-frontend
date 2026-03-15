"use client";

import { useState, useEffect, memo } from "react";
import { Database, Maximize2, Minimize2, Terminal, Download, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface DataTablePreviewProps {
  asset: any;
  presignedUrl?: string;
  output?: any;
}

export const DataTablePreview = memo(function DataTablePreview({ asset, presignedUrl, output }: DataTablePreviewProps) {
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        if (presignedUrl && asset?.asset_type === "VECTOR") {
            setIsLoading(true);
            fetch(presignedUrl)
                .then(res => res.json())
                .then(data => {
                    const features = data.features?.slice(0, 50) || [];
                    setPreviewData(features.map((f: any) => f.properties));
                })
                .catch(err => console.error("Failed to fetch asset for table:", err))
                .finally(() => setIsLoading(false));
        }
    }, [presignedUrl, asset?.asset_type]);

    if (!asset) {
        return (
            <pre className="p-4 rounded-xl bg-muted/40 border font-mono text-xs leading-relaxed overflow-auto max-h-[500px] shadow-inner">
                {JSON.stringify(output, null, 2)}
            </pre>
        );
    }

    const TableContent = (isFull: boolean) => (
        <div className={cn(
            "flex flex-col space-y-4 transition-all duration-300",
            isFull ? "w-full h-full p-8 bg-background" : "h-[450px]"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Database className="size-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold tracking-tight">{asset.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[300px] opacity-60">
                            {asset.storage_uri}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-primary/20 hover:bg-primary/5">
                        <Filter className="size-3" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-primary/20 hover:bg-primary/5">
                        <Download className="size-3" />
                        Export
                    </Button>
                    {!isFull ? (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 rounded-lg hover:bg-muted" 
                            onClick={() => setIsMaximized(true)}
                        >
                            <Maximize2 className="size-4" />
                        </Button>
                    ) : (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors group" 
                            onClick={() => setIsMaximized(false)}
                        >
                            <X className="size-4 group-hover:scale-110 transition-transform" />
                        </Button>
                    )}
                </div>
            </div>
            
            <div className={cn(
                "border rounded-xl overflow-hidden bg-muted/10 shadow-sm flex flex-col relative",
                (isFull || isMaximized) ? "flex-1" : "min-h-[200px]"
            )}>
                <div className="p-3 bg-muted/30 border-b flex items-center justify-between backdrop-blur-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Preview Rows</span>
                    {isLoading && <Terminal className="size-3 animate-pulse text-primary" />}
                </div>

                {previewData.length > 0 ? (
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-background/80 backdrop-blur-md sticky top-0 z-10">
                                <tr className="border-b">
                                    {Object.keys(previewData[0]).map(k => (
                                        <th key={k} className="px-5 py-3 font-bold uppercase tracking-tight opacity-70 whitespace-nowrap bg-muted/20">
                                            {k}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, i) => (
                                    <tr key={i} className="border-b border-muted/20 hover:bg-primary/5 transition-colors group">
                                        {Object.values(row).map((v: any, j) => (
                                            <td key={j} className="px-5 py-2.5 truncate max-w-[250px] font-medium group-hover:text-foreground">
                                                {v === null ? <span className="text-muted-foreground/30 italic">null</span> : String(v)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                        {isLoading ? (
                            <div className="space-y-3">
                                <Terminal className="size-8 mx-auto animate-pulse opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Streaming from S3...</p>
                            </div>
                        ) : (
                            <p className="text-sm font-medium">No property data found in this asset.</p>
                        )}
                    </div>
                )}
            </div>
            
            {(isFull || isMaximized) && (
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-2 border-t">
                    <span>Showing first 50 features for performance</span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded italic">Full-Screen Mode</span>
                </div>
            )}
        </div>
    );

    return (
        <>
            {TableContent(false)}

            <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
                <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-2xl" showCloseButton={false}>
                    <DialogHeader className="sr-only">
                        <DialogTitle>Data Table Fullscreen Preview</DialogTitle>
                        <DialogDescription>Viewing asset property data in comprehensive table view.</DialogDescription>
                    </DialogHeader>
                    {TableContent(true)}
                </DialogContent>
            </Dialog>
        </>
    );
});
