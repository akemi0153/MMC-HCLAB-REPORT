import React, { useState } from 'react';
import { WardOccupancy, JsonQuerySchema, HCORDER } from '../types';
import { 
  Building2, 
  Activity, 
  FileSpreadsheet, 
  Database, 
  Sparkles, 
  ArrowRight, 
  Code2, 
  FileCheck, 
  Server, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Upload, 
  Layers,
  Zap,
  Play
} from 'lucide-react';

interface HomeViewProps {
  wards: WardOccupancy[];
  orders: HCORDER[];
  schemas: JsonQuerySchema[];
  setActiveTab: (tab: 'home' | 'occupancy' | 'generator' | 'schema' | 'insights') => void;
  setSchemas: React.Dispatch<React.SetStateAction<JsonQuerySchema[]>>;
}

export const HomeView: React.FC<HomeViewProps> = ({
  wards,
  orders,
  schemas,
  setActiveTab,
  setSchemas
}) => {
  const totalOccupiedBeds = wards.reduce((sum, w) => sum + w.occupiedBeds, 0);
  const totalCapacity = wards.reduce((sum, w) => sum + w.totalBeds, 0);
  const availableBeds = totalCapacity - totalOccupiedBeds;
  const occupancyRate = totalCapacity > 0 ? ((totalOccupiedBeds / totalCapacity) * 100).toFixed(1) : '0';

  // Manual JSON Schema Quick Input State on Home
  const [showQuickManualModal, setShowQuickManualModal] = useState<boolean>(false);
  const [quickSchemaJson, setQuickSchemaJson] = useState<string>(`{
  "id": "adhoc-manual-query",
  "queryName": "Ad-Hoc Manual Patient Query",
  "department": "Laboratory",
  "reportType": "Manual Custom Query",
  "description": "User-entered manual JSON query schema for custom LIS data extraction",
  "primaryTable": "HCORDER_HEADER",
  "selectFields": [
    { "alias": "LAB_NUMBER", "field": "OH_TNO" },
    { "alias": "PATIENT_NAME", "field": "OH_LAST_NAME" },
    { "alias": "ORDER_DATE", "field": "OH_TRX_DT" },
    { "alias": "STATUS", "field": "OH_STATUS" }
  ],
  "joins": [],
  "filters": [
    { "field": "OH_STATUS", "operator": "EQUALS", "value": "COMPLETED" }
  ],
  "targetEhrDatabase": "Oracle_HCLAB"
}`);
  const [quickManualError, setQuickManualError] = useState<string | null>(null);
  const [quickManualSuccess, setQuickManualSuccess] = useState<string | null>(null);

  const handleSaveQuickManualSchema = () => {
    setQuickManualError(null);
    setQuickManualSuccess(null);
    try {
      const parsed = JSON.parse(quickSchemaJson);
      if (!parsed.id || !parsed.queryName || !parsed.selectFields) {
        setQuickManualError('Schema must include "id", "queryName", and "selectFields".');
        return;
      }
      
      // Upsert into schemas array
      setSchemas(prev => {
        const exists = prev.some(s => s.id === parsed.id);
        if (exists) {
          return prev.map(s => s.id === parsed.id ? parsed : s);
        }
        return [parsed, ...prev];
      });

      setQuickManualSuccess(`Schema "${parsed.queryName}" successfully loaded into state!`);
      setTimeout(() => {
        setShowQuickManualModal(false);
        setActiveTab('schema');
      }, 800);
    } catch (err: any) {
      setQuickManualError(`JSON Syntax Error: ${err.message}`);
    }
  };

  // Recent system events log
  const systemEvents = [
    { id: 1, time: '09:42 AM', type: 'EHR_SYNC', msg: 'Synchronized 18 new test orders from Oracle HCLAB LIS database', status: 'SUCCESS' },
    { id: 2, time: '09:30 AM', type: 'BED_STATE', msg: 'ICU Bed 04 status changed from Reserved to Occupied (Patient MRN: PT-8821)', status: 'INFO' },
    { id: 3, time: '09:15 AM', type: 'SCHEMA_VAL', msg: 'JSON Query Schema "lab-critical-results" passed LIS conformance diagnostics', status: 'SUCCESS' },
    { id: 4, time: '08:50 AM', type: 'REPORT_EXPORT', msg: 'Automated Monthly Patient Census generated and exported to Excel (.xlsx)', status: 'SUCCESS' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome & Command Center Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Oracle HCLAB LIS Engine v4.2 Active
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[10px] font-mono font-semibold">
                EHR Interoperable
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Hospital Census &amp; EHR Command Center
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
              Unified hospital census tracking, ward occupancy monitoring, automated RAW census report generation, and manual/automated JSON query schema execution for healthcare databases.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setActiveTab('generator')}
              className="flex-1 sm:flex-none bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-5 py-3 rounded-2xl transition-all text-xs flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Generate Census</span>
            </button>
            <button
              onClick={() => setShowQuickManualModal(true)}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold px-4 py-3 rounded-2xl transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-teal-400" />
              <span>Manual JSON Schema</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hospital High-Level Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Bed Occupancy Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Occupancy</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{occupancyRate}%</span>
              <span className="text-xs text-slate-500 font-medium">({totalOccupiedBeds} / {totalCapacity} Beds)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${Number(occupancyRate) > 85 ? 'bg-amber-500' : 'bg-teal-500'}`}
                style={{ width: `${Math.min(Number(occupancyRate), 100)}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setActiveTab('occupancy')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center justify-between cursor-pointer"
          >
            <span>Manage Ward Beds</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Available Beds Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Beds</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">{availableBeds}</span>
              <span className="text-xs text-slate-500 font-medium">Ready for intake</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Across 4 primary ward units</p>
          </div>
          <button
            onClick={() => setActiveTab('occupancy')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center justify-between cursor-pointer"
          >
            <span>View Ward Status</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* JSON Query Schemas Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active JSON Schemas</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{schemas.length}</span>
              <span className="text-xs text-slate-500 font-medium">Verified query definitions</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Supports Oracle HCLAB &amp; FHIR R4</p>
          </div>
          <button
            onClick={() => setActiveTab('schema')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center justify-between cursor-pointer"
          >
            <span>Schema Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* LIS & EHR Integration Engine Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">LIS Engine Status</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
              <span className="text-base font-bold text-slate-900">Oracle HCLAB Connected</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Auto-sync active (5s background window)</p>
          </div>
          <button
            onClick={() => setActiveTab('insights')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center justify-between cursor-pointer"
          >
            <span>Executive AI Briefing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Primary Action Modules Navigation Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hospital Operational Modules</h3>
            <p className="text-xs text-slate-500 font-medium">Select a module to execute hospital census tasks or manage query schemas</p>
          </div>
          <span className="text-xs font-mono text-teal-600 font-bold uppercase tracking-wider">4 Core Engines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Module 1: Bed Occupancy */}
          <div 
            onClick={() => setActiveTab('occupancy')}
            className="group border border-slate-200 hover:border-teal-500 rounded-2xl p-5 transition-all hover:shadow-md cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 bg-teal-600 text-white rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700">Bed Occupancy Tracker</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Monitor ward bed capacity, admit/discharge patients, and manage maintenance/reserved states in real time.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-teal-600 group-hover:text-teal-700">
              <span>Open Occupancy Tracker</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 2: Census Generator */}
          <div 
            onClick={() => setActiveTab('generator')}
            className="group border border-slate-200 hover:border-teal-500 rounded-2xl p-5 transition-all hover:shadow-md cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 bg-teal-600 text-white rounded-xl w-fit group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700">Census Report Generator</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Generate automated RAW census reports for Pathology, NucMed, Pulmo, and MediLinx with Excel export (.xlsx).
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-teal-600 group-hover:text-teal-700">
              <span>Generate Census Report</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 3: Schema Studio & Manual Mode */}
          <div 
            onClick={() => setActiveTab('schema')}
            className="group border border-slate-200 hover:border-teal-500 rounded-2xl p-5 transition-all hover:shadow-md cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 bg-teal-600 text-white rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700">JSON Schema Studio</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Build, validate, and edit custom JSON query schemas or manually enter custom SQL-JSON extraction rules.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-teal-600 group-hover:text-teal-700">
              <span>Manage JSON Schemas</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 4: AI Briefing */}
          <div 
            onClick={() => setActiveTab('insights')}
            className="group border border-slate-200 hover:border-teal-500 rounded-2xl p-5 transition-all hover:shadow-md cursor-pointer bg-slate-50/50 hover:bg-teal-50/30 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="p-3 bg-teal-600 text-white rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700">AI Administrative Briefing</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Automated executive analysis powered by Gemini AI on turnaround time bottlenecks, panic values &amp; bed safety.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-teal-600 group-hover:text-teal-700">
              <span>View AI Operational Brief</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* Highlight Box: Manual JSON Schema Workflow */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Manual JSON Query Schema Engine
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Directly write, paste, or validate ad-hoc JSON query specifications for custom Oracle HCLAB &amp; EHR data extraction
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              onClick={() => setShowQuickManualModal(true)}
              className="w-full md:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Compose Custom Schema</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <span className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider">Step 1: Define JSON Structure</span>
            <h4 className="font-bold text-white">Manual Schema Specification</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Specify fields, aliases, joins, filters, and target EHR database tables without writing raw SQL strings.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <span className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider">Step 2: Instant Diagnostic Check</span>
            <h4 className="font-bold text-white">Validation &amp; Field Matching</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Run automated checks against sample LIS order records to verify syntax, required metadata, and projection aliases.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <span className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider">Step 3: Execute Census Query</span>
            <h4 className="font-bold text-white">Live Execution &amp; Excel Export</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Execute your manual schema directly inside the Census Generator to extract records and generate spreadsheet reports.
            </p>
          </div>
        </div>
      </div>

      {/* System Real-Time Events Activity Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Real-Time LIS &amp; EHR Event Activity Stream</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
            Live Stream
          </span>
        </div>

        <div className="space-y-2.5">
          {systemEvents.map((evt) => (
            <div key={evt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-[11px] text-slate-400 font-semibold">{evt.time}</span>
                <span className="font-medium text-slate-800">{evt.msg}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                evt.status === 'SUCCESS' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {evt.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Manual Schema Editor Modal */}
      {showQuickManualModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 text-slate-900 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-50 border border-teal-100 text-teal-600 rounded-xl">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Manual Custom JSON Schema Input</h3>
                  <p className="text-xs text-slate-500 font-medium">Paste or type your custom JSON schema definition</p>
                </div>
              </div>

              <button
                onClick={() => setShowQuickManualModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Raw JSON Specification Text:</span>
                <span className="font-mono text-[11px] text-teal-600">Oracle_HCLAB Compatible</span>
              </label>
              <textarea
                value={quickSchemaJson}
                onChange={(e) => setQuickSchemaJson(e.target.value)}
                rows={12}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-4 font-mono text-xs text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed shadow-inner"
              />
            </div>

            {quickManualError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{quickManualError}</span>
              </div>
            )}

            {quickManualSuccess && (
              <div className="bg-teal-50 border border-teal-200 text-teal-800 p-3 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{quickManualSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowQuickManualModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuickManualSchema}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Save &amp; Load Manual Schema</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
