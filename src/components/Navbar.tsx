import React from 'react';
import { Home, Activity, Database, FileSpreadsheet, Sparkles, Building2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'occupancy' | 'generator' | 'schema' | 'insights';
  setActiveTab: (tab: 'home' | 'occupancy' | 'generator' | 'schema' | 'insights') => void;
  totalOccupiedBeds: number;
  totalCapacity: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalOccupiedBeds,
  totalCapacity
}) => {
  const occupancyRate = totalCapacity > 0 ? ((totalOccupiedBeds / totalCapacity) * 100).toFixed(1) : '0';
  const numericRate = Number(occupancyRate);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="p-1.5 bg-teal-500 text-slate-950 rounded-lg shadow-sm flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-slate-950" />
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1">
                HCLAB <span className="font-light text-slate-300">Census</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-black bg-teal-500/15 text-teal-300 border border-teal-500/30 rounded hidden sm:flex items-center gap-1 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                EHR LIVE
              </span>
            </div>
          </div>

          {/* Center Compact Telemetry Badge */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/80 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-slate-400 text-[10px]">OCCUPANCY:</span>
            <span className={`font-bold ${numericRate > 85 ? 'text-amber-400' : 'text-teal-300'}`}>
              {occupancyRate}%
            </span>
            <span className="text-slate-500 text-[10px]">({totalOccupiedBeds}/{totalCapacity})</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-teal-500 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('occupancy')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'occupancy'
                  ? 'bg-teal-500 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Bed Occupancy</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-teal-500 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Census Report</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-teal-500 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>JSON Schema</span>
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-teal-500 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Briefing</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};


