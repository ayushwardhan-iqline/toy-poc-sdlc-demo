import React, { useState, useEffect } from 'react';
import { Patient, Visit } from '@demo-pat-reg/shared';
import '../styles.css';

import { BrowserRouter } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { GlobalSidebar } from '@/components/blocks/global-sidebar';
import { GlobalHeader } from '@/components/blocks/global-header';
import { CommandPalette } from '@/components/blocks/command-palette';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, visitsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/patients`),
          fetch(`${import.meta.env.VITE_API_URL}/visits`),
        ]);
        
        if (!patientsRes.ok || !visitsRes.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const patientsData = await patientsRes.json();
        const visitsData = await visitsRes.json();
        
        setPatients(patientsData);
        setVisits(visitsData);
      } catch {
        setPatients([]);
        setVisits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
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
            {loading ? (
              <div className="flex h-full items-center justify-center">Loading...</div>
            ) : (
              <div className="space-y-6">
                <div className="bg-card text-card-foreground shadow sm:rounded-lg p-6 border border-border">
                  <h2 className="text-xl font-semibold mb-4">Patients</h2>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {patients.map((patient) => (
                      <div key={patient.id} className="border border-border rounded-lg p-4 bg-background">
                        <div className="font-medium">{patient.salutation} {patient.name}</div>
                        <div className="text-sm text-muted-foreground">{patient.gender}</div>
                        <div className="text-sm text-muted-foreground">{patient.phoneNumber}</div>
                        <div className="text-sm text-muted-foreground mt-1">{patient.address}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(patient.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card text-card-foreground shadow sm:rounded-lg p-6 border border-border">
                  <h2 className="text-xl font-semibold mb-4">Visits</h2>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {visits.map((visit) => {
                      const patient = patients.find(p => p.id === visit.patientId);
                      return (
                        <div key={visit.id} className="border border-border rounded-lg p-4 bg-background">
                          <div className="font-medium">Visit # {visit.visitNumber}</div>
                          <div className="text-sm text-muted-foreground">{visit.type}</div>
                          <div className="text-sm text-muted-foreground">{visit.status}</div>
                          {patient && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Patient: {patient.salutation} {patient.name}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            Created: {new Date(visit.createdAt).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </BrowserRouter>
  );
};

export default App;
