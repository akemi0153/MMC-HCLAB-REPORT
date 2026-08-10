import React, { useState } from 'react';
import { FileSpreadsheet, LogOut, Download } from 'lucide-react';
import { Department, LabSection, JsonQuerySchema, HCORDER } from '../types';
import { executeCensusQuery } from '../utils/censusQueryEngine';
import { DEFAULT_JSON_SCHEMAS } from '../data/jsonSchemas';
import { exportCensusToExcel } from '../utils/excelExporter';

interface HCLABGeneratorProps {
  onLogout: () => void;
  orders: HCORDER[];
  schemas: JsonQuerySchema[];
}

export const HCLABGenerator: React.FC<HCLABGeneratorProps> = ({ onLogout, orders, schemas }) => {
  const [department, setDepartment] = useState<Department>('Laboratory');
  const [reportType, setReportType] = useState<string>('Procedure Census (Detailed)');
  const [section, setSection] = useState<LabSection>('Clinical Microscopy');
  const [dtStart, setDtStart] = useState<string>('2026-08-10');
  const [dtEnd, setDtEnd] = useState<string>('2026-08-11');

  const handleGenerate = () => {
    const schemaToUse = schemas.find(s => s.department === department && s.reportType === reportType) || DEFAULT_JSON_SCHEMAS[0];
    
    try {
      const result = executeCensusQuery(
        department,
        section,
        reportType,
        dtStart,
        dtEnd,
        orders,
        schemaToUse,
        ''
      );
      
      exportCensusToExcel(result);
    } catch (error) {
      alert("Error generating report: " + (error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-3xl font-black text-white tracking-tighter">MM</span>
              <div className="relative flex items-center justify-center">
                <span className="text-3xl font-black text-white tracking-tighter">C</span>
                <span className="text-xl font-black text-teal-500 absolute ml-1.5 -mt-1.5">+</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Report Generator</h2>
              <p className="text-slate-400 text-sm font-medium">HCLAB Census Extraction</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 rounded-xl bg-slate-50 focus:bg-white transition-all text-slate-900"
              >
                <option value="Laboratory">Pathology and Laboratories</option>
                <option value="Nucmed">Nuclear Medicine</option>
                <option value="Pulmo">Pulmonary</option>
                <option value="Medilinx">Medilinx</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 rounded-xl bg-slate-50 focus:bg-white transition-all text-slate-900"
              >
                <option value="Procedure Census (Detailed)">Procedure Census (Detailed)</option>
                <option value="Patient Census (Count)">Patient Census (Count)</option>
                <option value="Procedure Census (Count)">Procedure Census (Count)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as LabSection)}
                className="w-full border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 rounded-xl bg-slate-50 focus:bg-white transition-all text-slate-900"
              >
                <option value="ALL">ALL SECTIONS</option>
                <option value="Clinical Microscopy">Clinical Microscopy</option>
                <option value="Hematology & Coagulation">Hematology & Coagulation</option>
                <option value="Clinical Chemistry">Clinical Chemistry</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Start Date</label>
                <input
                  type="date"
                  value={dtStart}
                  onChange={(e) => setDtStart(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 rounded-xl bg-slate-50 focus:bg-white transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">End Date</label>
                <input
                  type="date"
                  value={dtEnd}
                  onChange={(e) => setDtEnd(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 rounded-xl bg-slate-50 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerate}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
        
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center space-x-3">
          <div className="flex items-center">
            <span className="text-xl font-black text-slate-800 tracking-tighter">MM</span>
            <div className="relative flex items-center justify-center">
              <span className="text-xl font-black text-slate-800 tracking-tighter">C</span>
              <span className="text-lg font-black text-teal-600 absolute ml-1 -mt-1">+</span>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-300"></div>
          <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Makati Medical Center</span>
        </div>
      </div>
    </div>
  );
};
