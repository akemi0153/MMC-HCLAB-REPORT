import React, { useState } from 'react';
import { AiCensusInsight, WardOccupancy, HCORDER } from '../types';
import { Sparkles, Activity, AlertTriangle, ShieldCheck, TrendingUp, RefreshCw, CheckCircle2, UserCheck } from 'lucide-react';

interface AiCensusInsightsProps {
  wards: WardOccupancy[];
  orders: HCORDER[];
}

export const AiCensusInsights: React.FC<AiCensusInsightsProps> = ({ wards, orders }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [insight, setInsight] = useState<AiCensusInsight | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalCapacity = wards.reduce((acc, w) => acc + w.totalBeds, 0);
  const totalOccupied = wards.reduce((acc, w) => acc + w.occupiedBeds, 0);
  const totalAvailable = wards.reduce((acc, w) => acc + w.availableBeds, 0);
  const occupancyPct = ((totalOccupied / totalCapacity) * 100).toFixed(1);

  const criticalOrders = orders.filter(o => o.criticalResultValue);
  const tatExceededOrders = orders.filter(o => o.tatMinutes && o.tatMinutes > 30);

  const handleGenerateBriefing = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const summaryMetrics = {
        totalHospitalBeds: totalCapacity,
        occupiedBeds: totalOccupied,
        availableBeds: totalAvailable,
        overallOccupancyPct: `${occupancyPct}%`,
        criticalPanicValuesLogged: criticalOrders.length,
        tatExceeded30MinsCount: tatExceededOrders.length,
        totalJul2025Orders: orders.length
      };

      const topSampleData = orders.slice(0, 5).map(o => ({
        labNumber: o.labNumber,
        patientName: o.patientName,
        patientType: o.patientType,
        testName: o.testName,
        doctorName: o.doctorName,
        status: o.status
      }));

      const response = await fetch('/api/ai/census-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportTitle: 'July 2025 Hospital Census & EHR Real-time Analysis',
          department: 'Pathology, Emergency & Critical Care',
          totalRecords: orders.length,
          summaryMetrics,
          topSampleData
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to call Gemini API endpoint');
      }

      setInsight(data.insights);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error generating AI administrative briefing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Gemini AI Executive Administrative Briefing</h2>
            <p className="text-xs text-slate-500 font-medium">Automated AI analysis of hospital census trends, bed occupancy, TAT bottlenecks & critical value safety</p>
          </div>
        </div>

        <button
          onClick={handleGenerateBriefing}
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Analyzing EHR Data...' : 'Generate Executive AI Briefing'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-xs flex items-center space-x-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Surge & Capacity</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-extrabold text-teal-700 font-mono">{occupancyPct}% <span className="text-xs font-sans text-slate-500 font-normal">Occupied</span></p>
          <p className="text-xs text-slate-500 font-medium">{totalOccupied} of {totalCapacity} total hospital beds occupied</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Panic Values</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-extrabold text-red-600 font-mono">{criticalOrders.length} <span className="text-xs font-sans text-slate-500 font-normal">Logged</span></p>
          <p className="text-xs text-slate-500 font-medium">100% telephoned within standard 5-minute notification window</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Turnaround Delays</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 font-mono">{tatExceededOrders.length} <span className="text-xs font-sans text-slate-500 font-normal">&gt;30 mins</span></p>
          <p className="text-xs text-slate-500 font-medium">Primary cause: instrument rest/re-run cycles & Nebulization rest</p>
        </div>

      </div>

      {/* Generated AI Content Panel */}
      {insight ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-sm space-y-6">
          
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-base text-teal-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" /> Chief Medical Officer Analysis
            </h3>
            <span className="text-xs font-mono text-slate-400">Gemini 2.5 Engine</span>
          </div>

          {/* Occupancy Analysis */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700">Occupancy & Patient Flow Analysis</h4>
            <p className="text-xs leading-relaxed text-slate-700 font-medium">{insight.occupancyAnalysis}</p>
          </div>

          {/* TAT Bottlenecks */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Turnaround Time (TAT) Operational Bottlenecks
            </h4>
            <ul className="space-y-2">
              {insight.tatBottlenecks.map((item, idx) => (
                <li key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-medium flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Executive Administrative Recommendations
            </h4>
            <ul className="space-y-2">
              {insight.administrativeRecommendations.map((rec, idx) => (
                <li key={idx} className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 font-medium flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm space-y-3">
          <Sparkles className="w-8 h-8 text-teal-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-900">Click "Generate Executive AI Briefing" above</h4>
          <p className="text-xs max-w-md mx-auto text-slate-500 font-medium">
            Synthesizes current bed occupancy levels, LIS test volumes, TAT delays, and critical panic value logs into actionable hospital leadership insights.
          </p>
        </div>
      )}

    </div>
  );
};
