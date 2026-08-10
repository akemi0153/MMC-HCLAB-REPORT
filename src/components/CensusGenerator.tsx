import React, { useState, useMemo } from 'react';
import { Department, LabSection, HCORDER, CensusReportResult, JsonQuerySchema } from '../types';
import { DEFAULT_JSON_SCHEMAS } from '../data/jsonSchemas';
import { executeCensusQuery } from '../utils/censusQueryEngine';
import { exportCensusToExcel } from '../utils/excelExporter';
import { FileSpreadsheet, Play, Download, Search, AlertCircle, Info, Calendar, Filter, Database, CheckCircle2, ChevronLeft, ChevronRight, Code2, Sliders, Check } from 'lucide-react';

interface CensusGeneratorProps {
  orders: HCORDER[];
  schemas: JsonQuerySchema[];
}

export const CensusGenerator: React.FC<CensusGeneratorProps> = ({ orders, schemas }) => {
  // Schema Mode State: Preset vs Manual
  const [schemaMode, setSchemaMode] = useState<'preset' | 'manual'>('preset');
  const [manualSchemaJson, setManualSchemaJson] = useState<string>(JSON.stringify(schemas[0] || DEFAULT_JSON_SCHEMAS[0], null, 2));
  const [manualJsonError, setManualJsonError] = useState<string | null>(null);

  // Department, Section, Report Type State
  const [department, setDepartment] = useState<Department>('Laboratory');
  const [section, setSection] = useState<LabSection>('ALL');
  const [reportType, setReportType] = useState<string>('Patient Census (Count)');
  
  // Date State (Defaults to July 2025 as in sample request)
  const [dtStart, setDtStart] = useState<string>('2025-07-01');
  const [dtEnd, setDtEnd] = useState<string>('2025-07-31');

  // Search & Pagination State
  const [tableSearch, setTableSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Active Report State
  const [reportResult, setReportResult] = useState<CensusReportResult | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Select a preset schema to populate into manual JSON editor
  const handleSelectSchemaForManual = (schemaId: string) => {
    const s = schemas.find(item => item.id === schemaId);
    if (s) {
      setManualSchemaJson(JSON.stringify(s, null, 2));
      setManualJsonError(null);
    }
  };

  // Dynamic Query Options based on Department (matching legacy VB.NET logic)
  const availableReportTypes = useMemo(() => {
    if (department === 'Laboratory') {
      return [
        'Patient Census (Count)',
        'Procedure Census (Count)',
        'Procedure Census (Detailed)',
        'Anatomic Pathology Census',
        'Patient Critical Results',
        'Amended, Cancelled/Deleted Tests',
        'Daily Order Summary - 1 Year',
        'Daily Order Summary - Archived (More than 1 Year)',
        'Blood Bank - Blood Component Preparation',
        'Blood Bank - Transfusion by Blood Unit',
        'Blood Bank - Total of Patient’s Transfusion (Per Year)'
      ];
    } else if (department === 'Nucmed') {
      return [
        'Patient Census (Count)',
        'Patient Census (Detailed)',
        'Procedure Census (Count)',
        "Doctor's Patient Referal Census",
        "Reader's Report - 1 Year",
        "Reader's Report - Archive (More than 1 Year)",
        "Reader's Report - 4 Months"
      ];
    } else if (department === 'Pulmo') {
      return [
        'Patient Census (Count)',
        'Procedure Census (Count)',
        'Procedure Census (Detailed)',
        'Patient Critical Census',
        'Turn Around Time (More than 30 Mins)'
      ];
    } else if (department === 'Medilinx') {
      return [
        'In-reach Census (By Patient - Send-In)',
        'In-reach Census (By Patient - In-House)',
        'In-reach Census (By Test)',
        'Audit Logs (Amended, Cancelled/Deleted Tests)'
      ];
    }
    return [];
  }, [department]);

  // Handle Department Change
  const handleDepartmentChange = (newDept: Department) => {
    setDepartment(newDept);
    setValidationWarning(null);
    if (newDept === 'Laboratory') {
      setReportType('Patient Census (Count)');
      setSection('ALL');
    } else if (newDept === 'Nucmed') {
      setReportType('Patient Census (Count)');
      setSection('ALL');
    } else if (newDept === 'Pulmo') {
      setReportType('Patient Census (Count)');
      setSection('ALL');
    } else if (newDept === 'Medilinx') {
      setReportType('In-reach Census (By Patient - Send-In)');
      setSection('ALL');
    }
  };

  // Run Query Execution
  const handleGenerateReport = () => {
    setValidationWarning(null);
    setManualJsonError(null);

    const startDateObj = new Date(dtStart);
    const endDateObj = new Date(dtEnd);

    // Date Validation
    if (startDateObj > endDateObj) {
      setValidationWarning('Error: Start Date cannot be later than End Date.');
      return;
    }

    const diffDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24));

    // Legacy VB.NET Rule: Warning for > 15 days on heavy detailed queries
    if (diffDays > 15 && (reportType.includes('Detailed') || reportType.includes('Daily Order Summary'))) {
      setValidationWarning('Notice: Date range exceeds 15 days for a detailed report. Query may return high row volume.');
    }

    let schemaToUse: JsonQuerySchema;

    if (schemaMode === 'manual') {
      try {
        const parsed = JSON.parse(manualSchemaJson);
        if (!parsed.selectFields || !Array.isArray(parsed.selectFields)) {
          setManualJsonError('Manual JSON Schema must include a "selectFields" array.');
          return;
        }
        schemaToUse = parsed;
      } catch (err: any) {
        setManualJsonError(`Invalid JSON Syntax in Manual Schema: ${err.message}`);
        return;
      }
    } else {
      // Find matching query schema
      schemaToUse = schemas.find(s => s.department === department && s.reportType === reportType) || DEFAULT_JSON_SCHEMAS[0];
    }

    // Execute engine
    const result = executeCensusQuery(
      department,
      section,
      reportType,
      dtStart,
      dtEnd,
      orders,
      schemaToUse,
      tableSearch
    );

    setReportResult(result);
    setCurrentPage(1);
  };

  // Filtered rows by search term
  const displayRows = useMemo(() => {
    if (!reportResult) return [];
    if (!tableSearch.trim()) return reportResult.rows;

    const term = tableSearch.toLowerCase();
    return reportResult.rows.filter(r => 
      Object.values(r).some(val => String(val).toLowerCase().includes(term))
    );
  }, [reportResult, tableSearch]);

  // Paginated Rows
  const totalPages = Math.ceil(displayRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return displayRows.slice(startIdx, startIdx + pageSize);
  }, [displayRows, currentPage]);

  return (
    <div className="space-y-6">
      
      {/* Primary Query Configuration Form Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Automated Hospital Census Generator</h2>
              <p className="text-xs text-slate-500 font-medium">Query HCLAB LIS and EHR databases using validated JSON schemas</p>
            </div>
          </div>

          {/* Schema Execution Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setSchemaMode('preset')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                schemaMode === 'preset'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>Preset Schema</span>
            </button>
            <button
              onClick={() => setSchemaMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                schemaMode === 'manual'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Manual Custom JSON</span>
            </button>
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-teal-600" /> Department:
            </label>
            <select
              value={department}
              onChange={(e) => handleDepartmentChange(e.target.value as Department)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="Laboratory">Pathology & Laboratory</option>
              <option value="Nucmed">Nuclear Medicine</option>
              <option value="Pulmo">Pulmonary Laboratory</option>
              <option value="Medilinx">MediLinx Network (In-reach)</option>
            </select>
          </div>

          {/* Section (Enabled for Laboratory) */}
          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-teal-600" /> Section / Unit:
            </label>
            <select
              value={section}
              disabled={department !== 'Laboratory'}
              onChange={(e) => setSection(e.target.value as LabSection)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="ALL">ALL SECTIONS</option>
              <option value="Blood Bank">Blood Bank</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Point Of Care Test">Point Of Care Test (POCT)</option>
              <option value="Hematology & Coagulation">Hematology & Coagulation</option>
              <option value="Clinical Chemistry">Clinical Chemistry</option>
              <option value="Clinical Microscopy">Clinical Microscopy</option>
              <option value="Immunology & Serology">Immunology & Serology</option>
              <option value="Molecular Pathology">Molecular Pathology</option>
              <option value="Drug Testing">Drug Testing</option>
              <option value="Emergency Laboratory">Emergency Laboratory</option>
            </select>
          </div>

          {/* Query Type */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-slate-700 font-bold flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" /> Census Report Type:
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-teal-700 font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {availableReportTypes.map((rt) => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" /> Start Date (`dt_start`):
            </label>
            <input
              type="date"
              value={dtStart}
              onChange={(e) => setDtStart(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Date Range End */}
          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" /> End Date (`dt_end`):
            </label>
            <input
              type="date"
              value={dtEnd}
              onChange={(e) => setDtEnd(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Action Button */}
          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={handleGenerateReport}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{schemaMode === 'manual' ? 'Run Manual JSON Query' : 'Generate Census Report'}</span>
            </button>
          </div>

        </div>

        {/* Manual Custom JSON Schema Input Panel */}
        {schemaMode === 'manual' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-xs text-white">Manual Custom JSON Query Schema Input</span>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-[10px] text-slate-400 font-mono">Load Preset Template:</span>
                <select
                  onChange={(e) => handleSelectSchemaForManual(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-teal-300 font-mono text-[11px] rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value="">-- Select Template Schema --</option>
                  {schemas.map(s => (
                    <option key={s.id} value={s.id}>{s.queryName}</option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              value={manualSchemaJson}
              onChange={(e) => {
                setManualSchemaJson(e.target.value);
                setManualJsonError(null);
              }}
              rows={9}
              className="w-full bg-[#0b1329] border border-slate-800 rounded-xl p-3 font-mono text-xs text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />

            {manualJsonError && (
              <div className="bg-red-950/80 border border-red-800 text-red-300 p-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{manualJsonError}</span>
              </div>
            )}
          </div>
        )}

        {/* Validation Warning Alert */}
        {validationWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{validationWarning}</span>
          </div>
        )}

      </div>

      {/* Output Results Panel */}
      {reportResult ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 shadow-sm space-y-6">
          
          {/* Header & Export Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">{reportResult.reportTitle}</h3>
                <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold rounded-md">
                  {reportResult.totalRecords} Records
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Window: <span className="font-mono text-slate-800">{reportResult.dateRange.start}</span> to <span className="font-mono text-slate-800">{reportResult.dateRange.end}</span> · Generated: {reportResult.generatedAt}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => exportCensusToExcel(reportResult)}
                className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4 text-teal-400" />
                <span>EXPORT TO EXCEL (.XLSX)</span>
              </button>
            </div>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {Object.entries(reportResult.summaryMetrics).map(([k, v]) => (
              <div key={k} className="p-2">
                <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{k}</p>
                <p className="text-lg font-extrabold text-teal-700 font-mono mt-0.5">{String(v)}</p>
              </div>
            ))}
          </div>

          {/* Filter / Search within Table */}
          <div className="flex items-center justify-between text-xs">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search result table..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="text-slate-500 font-medium">
              Showing {paginatedRows.length} of {displayRows.length} rows
            </div>
          </div>

          {/* Interactive Data Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  {reportResult.columns.map((col) => (
                    <th key={col} className="px-4 py-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {reportResult.columns.map((col) => (
                        <td key={col} className="px-4 py-2.5 whitespace-nowrap text-slate-800 font-medium">
                          {col === 'STATUS' ? (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              row[col] === 'COMPLETED' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                              row[col] === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {row[col]}
                            </span>
                          ) : col === 'RESULT_VALUE' ? (
                            <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                              {row[col]}
                            </span>
                          ) : col === 'MRN' || col === 'LAB_NUMBER' ? (
                            <span className="font-mono text-teal-700 font-semibold">{row[col]}</span>
                          ) : (
                            String(row[col] ?? 'N/A')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={reportResult.columns.length} className="px-4 py-8 text-center text-slate-400">
                      No matching records found for this query filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 font-medium">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-[#0f172a] rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-teal-400 text-[10px] font-bold uppercase tracking-widest">Auto-Report Hub</span>
            <h3 className="text-xl font-bold leading-snug">Generate HCLAB Monthly RAW Census</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automated aggregation of patient records, procedure counts, and turnaround times for regulatory compliance. Direct export to Excel (.xlsx).
            </p>
          </div>
          <button
            onClick={handleGenerateReport}
            className="w-full md:w-auto bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RUN CENSUS ENGINE</span>
          </button>
        </div>
      )}

    </div>
  );
};
