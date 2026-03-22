import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { GlobalSidebar } from '@/components/blocks/global-sidebar';
import { GlobalHeader } from '@/components/blocks/global-header';
import { CommandPalette } from '@/components/blocks/command-palette';
import { VisitsDataTable } from '@/components/visits/VisitsDataTable';
import '../styles.css';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SidebarProvider>
          <GlobalSidebar />
          <SidebarInset>
            <GlobalHeader onCommandPaletteOpen={() => setCommandPaletteOpen(true)} />
            <CommandPalette
              open={commandPaletteOpen}
              onOpenChange={setCommandPaletteOpen}
            />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="space-y-6">
                <VisitsDataTable />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
