import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Topbar */}
      <header className="flex h-14 items-center justify-between border-b px-4 bg-background">
        <div className="flex items-center space-x-4">
          <h1 className="font-bold text-lg">EarthFlow</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">Log in</Button>
          <Button size="sm">Sign up</Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Node Library) */}
        <aside className="w-64 border-r bg-muted/20 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Node Library</h2>
          <div className="space-y-2">
            <div className="p-3 border rounded-md bg-background shadow-sm text-sm cursor-grab">
              Vector Source
            </div>
            <div className="p-3 border rounded-md bg-background shadow-sm text-sm cursor-grab">
              Buffer
            </div>
            <div className="p-3 border rounded-md bg-background shadow-sm text-sm cursor-grab">
              Intersect
            </div>
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col bg-dot-pattern">
          <div className="flex-1 relative">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Canvas Area (React Flow)
            </div>
          </div>
          {/* Execution Log / Bottom Panel */}
          <div className="h-48 border-t bg-background p-4 overflow-y-auto">
            <h3 className="font-semibold text-sm mb-2">Execution Log</h3>
            <div className="text-xs text-muted-foreground font-mono space-y-1">
              <p>[System] EarthFlow initialized.</p>
            </div>
          </div>
        </main>

        {/* Right Map Panel */}
        <aside className="w-1/3 min-w-[300px] border-l bg-background relative flex flex-col">
          <div className="p-2 border-b flex justify-between items-center bg-muted/10">
            <h3 className="font-semibold text-sm">Map Viewer</h3>
            <Button variant="ghost" size="sm" className="h-6 text-xs">Layers</Button>
          </div>
          <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/5">
            Map Area (MapLibre GL)
          </div>
        </aside>
      </div>
    </div>
  );
}
