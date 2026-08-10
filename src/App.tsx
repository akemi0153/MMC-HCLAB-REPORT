import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { OccupancyTracker } from './components/OccupancyTracker';
import { CensusGenerator } from './components/CensusGenerator';
import { QuerySchemaStudio } from './components/QuerySchemaStudio';
import { AiCensusInsights } from './components/AiCensusInsights';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { LoginScreen } from './components/LoginScreen';
import { HCLABGenerator } from './components/HCLABGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'occupancy' | 'generator' | 'schema' | 'insights'>('home');

  const {
    user,
    userRole,
    authLoading,
    firestoreConnected,
    wards,
    setWards,
    orders,
    schemas,
    setSchemas,
    saveSchemaToFirestore,
    deleteSchemaFromFirestore,
    loginWithGoogle,
    loginWithEmail,
    logoutUser
  } = useFirebaseSync();

  const totalOccupiedBeds = wards.reduce((sum, w) => sum + w.occupiedBeds, 0);
  const totalCapacity = wards.reduce((sum, w) => sum + w.totalBeds, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-slate-500 font-medium">Loading system...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={loginWithEmail} />;
  }

  // If standard user, show the HCLAB Generator dialog ONLY
  if (userRole !== 'admin') {
    return <HCLABGenerator onLogout={logoutUser} orders={orders} schemas={schemas} />;
  }

  // If Admin, show the full dashboard
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 selection:bg-teal-500 selection:text-white flex flex-col">
      
      {/* Top Command Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalOccupiedBeds={totalOccupiedBeds}
        totalCapacity={totalCapacity}
        user={user}
        authLoading={authLoading}
        loginWithGoogle={loginWithGoogle}
        logoutUser={logoutUser}
        firestoreConnected={firestoreConnected}
      />

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
        
        {activeTab === 'home' && (
          <HomeView
            wards={wards}
            orders={orders}
            schemas={schemas}
            setActiveTab={setActiveTab}
            setSchemas={setSchemas}
          />
        )}

        {activeTab === 'occupancy' && (
          <OccupancyTracker wards={wards} setWards={setWards} />
        )}

        {activeTab === 'generator' && (
          <CensusGenerator orders={orders} schemas={schemas} />
        )}

        {activeTab === 'schema' && (
          <QuerySchemaStudio 
            schemas={schemas} 
            setSchemas={setSchemas}
            saveSchemaToFirestore={saveSchemaToFirestore}
            deleteSchemaFromFirestore={deleteSchemaFromFirestore}
          />
        )}

        {activeTab === 'insights' && (
          <AiCensusInsights wards={wards} orders={orders} />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-600">© 2026 HCLAB Hospital Census Control · Real-Time Hospital Occupancy &amp; EHR Integration Engine v4.2</p>
          <p className="font-mono text-[11px] text-teal-600 font-bold uppercase tracking-wider">Oracle HCLAB &amp; LIS Interoperability Verified</p>
        </div>
      </footer>

    </div>
  );
}

