import React, { useState, useEffect } from 'react';
import { Patient, Visit, insertPatientSchema, insertVisitSchema } from '@demo-pat-reg/shared';
import '../styles.css';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Registration System</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Patients</h2>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {patients.map((patient) => (
                  <div key={patient.id} className="border rounded-lg p-4">
                    <div className="font-medium">{patient.salutation} {patient.name}</div>
                    <div className="text-sm text-gray-500">{patient.gender}</div>
                    <div className="text-sm text-gray-500">{patient.phoneNumber}</div>
                    <div className="text-sm text-gray-500 mt-1">{patient.address}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      Created: {new Date(patient.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Visits</h2>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {visits.map((visit) => {
                  const patient = patients.find(p => p.id === visit.patientId);
                  return (
                    <div key={visit.id} className="border rounded-lg p-4">
                      <div className="font-medium">Visit # {visit.visitNumber}</div>
                      <div className="text-sm text-gray-500">{visit.type}</div>
                      <div className="text-sm text-gray-500">{visit.status}</div>
                      {patient && (
                        <div className="text-sm text-gray-500 mt-1">
                          Patient: {patient.salutation} {patient.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        Created: {new Date(visit.createdAt).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
