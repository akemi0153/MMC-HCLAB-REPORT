import React, { useState } from 'react';
import { JsonQuerySchema } from '../types';
import { Database, Code2, Copy, Check, FileJson, Save, FileCheck, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, RefreshCw, Plus, Upload, Trash2 } from 'lucide-react';

interface QuerySchemaStudioProps {
  schemas: JsonQuerySchema[];
  setSchemas: React.Dispatch<React.SetStateAction<JsonQuerySchema[]>>;
}

interface ValidationResult {
  isValid: boolean;
  timestamp: string;
  checks: Array<{
    title: string;
    description: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    details?: string;
  }>;
  sampleRecordMatches: {
    totalFields: number;
    matchedFields: number;
    sampleRecord: Record<string, any>;
  };
}

export const QuerySchemaStudio: React.FC<QuerySchemaStudioProps> = ({ schemas, setSchemas }) => {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>(schemas[0]?.id || 'lab-patient-count');
  const [copied, setCopied] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  // Delete Schema Modal State
  const [schemaToDelete, setSchemaToDelete] = useState<JsonQuerySchema | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const activeSchema = schemas.find(s => s.id === selectedSchemaId) || schemas[0];
  const [rawJsonText, setRawJsonText] = useState<string>(JSON.stringify(activeSchema, null, 2));

  const handleSelectSchema = (id: string) => {
    setSelectedSchemaId(id);
    setValidationResult(null);
    const schema = schemas.find(s => s.id === id);
    if (schema) {
      setRawJsonText(JSON.stringify(schema, null, 2));
    }
  };

  const handleCreateNewSchema = () => {
    const newId = `custom-schema-${Date.now()}`;
    const newSchema: JsonQuerySchema = {
      id: newId,
      queryName: 'New Custom Manual Schema',
      department: 'Laboratory',
      reportType: 'Manual Custom Census Query',
      description: 'Ad-hoc manual JSON query schema specification created by user.',
      primaryTable: 'HCORDER_HEADER',
      selectFields: [
        { alias: 'LAB_NUMBER', field: 'OH_TNO' },
        { alias: 'MRN', field: 'OH_PID' },
        { alias: 'PATIENT_NAME', field: 'OH_LAST_NAME' },
        { alias: 'ORDER_DATE', field: 'OH_TRX_DT' },
        { alias: 'STATUS', field: 'OH_STATUS' }
      ],
      joins: [],
      filters: [
        { field: 'OH_STATUS', operator: 'EQUALS', value: 'COMPLETED' }
      ],
      targetEhrDatabase: 'Oracle_HCLAB'
    };

    setSchemas(prev => [newSchema, ...prev]);
    setSelectedSchemaId(newId);
    setRawJsonText(JSON.stringify(newSchema, null, 2));
    setValidationResult(null);
  };

  const handleImportRawJson = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJsonText) as JsonQuerySchema;
      if (!parsed.id || !parsed.queryName || !parsed.selectFields) {
        setImportError('Invalid Schema: Must contain "id", "queryName", and "selectFields".');
        return;
      }
      setSchemas(prev => [parsed, ...prev.filter(s => s.id !== parsed.id)]);
      setSelectedSchemaId(parsed.id);
      setRawJsonText(JSON.stringify(parsed, null, 2));
      setShowImportModal(false);
      setImportJsonText('');
      setValidationResult(null);
    } catch (err: any) {
      setImportError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(rawJsonText) as JsonQuerySchema;
      const updated = schemas.map(s => s.id === parsed.id ? parsed : s);
      setSchemas(updated);
      alert(`JSON Schema "${parsed.queryName}" saved successfully!`);
    } catch (e: any) {
      alert(`Invalid JSON Format: ${e.message}`);
    }
  };

  const handleOpenDeleteModal = (schema: JsonQuerySchema, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSchemaToDelete(schema);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!schemaToDelete) return;
    const targetId = schemaToDelete.id;
    setSchemas(prev => {
      const filtered = prev.filter(s => s.id !== targetId);
      if (selectedSchemaId === targetId) {
        const nextSchema = filtered[0];
        if (nextSchema) {
          setSelectedSchemaId(nextSchema.id);
          setRawJsonText(JSON.stringify(nextSchema, null, 2));
        } else {
          setSelectedSchemaId('');
          setRawJsonText('{}');
        }
      }
      return filtered;
    });
    setShowDeleteModal(false);
    setSchemaToDelete(null);
    setValidationResult(null);
  };

  // Sample LIS/EHR patient & test order record object for live validation testing
  const sampleEhrRecord: Record<string, any> = {
    OH_TNO: "20250724-0891",
    OH_PID: "PT-8821",
    OH_LAST_NAME: "DELA CRUZ, JUAN",
    OH_PTYPE: "IN",
    OH_CLINIC_CODE: "ICU-01",
    OD_ORDER_TI: "CBC_AUTO",
    OH_TRX_DT: "2025-07-24 09:41:00",
    OH_STATUS: "COMPLETED",
    DEPARTMENT: "Laboratory",
    HOSPITAL_ID: "11"
  };

  const handleValidateSchema = () => {
    setIsValidating(true);
    
    setTimeout(() => {
      const checks: ValidationResult['checks'] = [];
      let parsedSchema: any = null;
      let syntaxValid = false;

      // 1. JSON Syntax Check
      try {
        parsedSchema = JSON.parse(rawJsonText);
        syntaxValid = true;
        checks.push({
          title: 'JSON Syntax Structure',
          description: 'Valid JSON string formatting without parsing exceptions',
          status: 'PASSED',
        });
      } catch (err: any) {
        checks.push({
          title: 'JSON Syntax Structure',
          description: 'Failed to parse JSON string',
          status: 'FAILED',
          details: err.message,
        });
      }

      if (syntaxValid && parsedSchema) {
        // 2. Required Schema Metadata Check
        const requiredProps = ['id', 'queryName', 'department', 'primaryTable', 'targetEhrDatabase'];
        const missingProps = requiredProps.filter(p => !parsedSchema[p]);
        
        if (missingProps.length === 0) {
          checks.push({
            title: 'LIS Metadata Specifications',
            description: `All core parameters present (Target Engine: ${parsedSchema.targetEhrDatabase || 'Oracle_HCLAB'})`,
            status: 'PASSED',
          });
        } else {
          checks.push({
            title: 'LIS Metadata Specifications',
            description: `Missing required metadata fields: ${missingProps.join(', ')}`,
            status: 'FAILED',
          });
        }

        // 3. Select Projections Check
        if (Array.isArray(parsedSchema.selectFields) && parsedSchema.selectFields.length > 0) {
          const invalidFields = parsedSchema.selectFields.filter((f: any) => !f.field || !f.alias);
          if (invalidFields.length === 0) {
            checks.push({
              title: 'Select Projections & Aliases',
              description: `Validated ${parsedSchema.selectFields.length} select projections and alias mappings`,
              status: 'PASSED',
            });
          } else {
            checks.push({
              title: 'Select Projections & Aliases',
              description: 'Some selectFields are missing required "field" or "alias" properties',
              status: 'FAILED',
            });
          }
        } else {
          checks.push({
            title: 'Select Projections & Aliases',
            description: 'schema.selectFields must be a non-empty array of projections',
            status: 'FAILED',
          });
        }

        // 4. Filters & Operators Validation
        if (Array.isArray(parsedSchema.filters)) {
          const validOperators = ['EQUALS', 'IN', 'LIKE', 'BETWEEN', 'NOT_IN', 'IS_NOT_NULL'];
          const invalidFilters = parsedSchema.filters.filter((f: any) => !f.field || !validOperators.includes(f.operator));
          
          if (invalidFilters.length === 0) {
            checks.push({
              title: 'Filter Operators & Predicates',
              description: `Validated ${parsedSchema.filters.length} query filter conditions with supported SQL operators`,
              status: 'PASSED',
            });
          } else {
            checks.push({
              title: 'Filter Operators & Predicates',
              description: 'Filters contain invalid or unsupported operators or missing fields',
              status: 'FAILED',
              details: `Allowed operators: ${validOperators.join(', ')}`,
            });
          }
        } else {
          checks.push({
            title: 'Filter Operators & Predicates',
            description: 'schema.filters should be an array of query predicate conditions',
            status: 'WARNING',
          });
        }

        // 5. Joins Integrity
        if (Array.isArray(parsedSchema.joins)) {
          const invalidJoins = parsedSchema.joins.filter((j: any) => !j.table || !j.on || !['INNER', 'LEFT', 'RIGHT'].includes(j.type));
          if (invalidJoins.length === 0) {
            checks.push({
              title: 'Table Joins Interoperability',
              description: `Validated ${parsedSchema.joins.length} relational table join configurations`,
              status: 'PASSED',
            });
          } else {
            checks.push({
              title: 'Table Joins Interoperability',
              description: 'Joins contain invalid join types or missing table/ON conditions',
              status: 'FAILED',
            });
          }
        }

        // 6. Sample LIS Record Conformance Evaluation
        const selectFieldNames = (parsedSchema.selectFields || []).map((f: any) => f.field);
        let matchedCount = 0;
        selectFieldNames.forEach((field: string) => {
          if (field in sampleEhrRecord || field.includes('.')) {
            matchedCount++;
          }
        });

        const isOverallValid = checks.every(c => c.status !== 'FAILED');

        setValidationResult({
          isValid: isOverallValid,
          timestamp: new Date().toLocaleTimeString(),
          checks,
          sampleRecordMatches: {
            totalFields: selectFieldNames.length,
            matchedFields: matchedCount,
            sampleRecord: sampleEhrRecord,
          },
        });
      } else {
        setValidationResult({
          isValid: false,
          timestamp: new Date().toLocaleTimeString(),
          checks,
          sampleRecordMatches: {
            totalFields: 0,
            matchedFields: 0,
            sampleRecord: sampleEhrRecord,
          },
        });
      }

      setIsValidating(false);
    }, 400);
  };

  // Generate SQL representation from the JSON Schema
  const generatedSql = activeSchema ? `
SELECT 
${activeSchema.selectFields.map(f => `  ${f.field} AS ${f.alias}`).join(',\n')}
FROM ${activeSchema.primaryTable}
${activeSchema.joins.map(j => `${j.type} JOIN ${j.table} ON ${j.on}`).join('\n')}
WHERE 
${activeSchema.filters.map(f => `  ${f.field} ${f.operator} ${f.value}`).join(' AND\n')}
${activeSchema.groupBy ? `GROUP BY ${activeSchema.groupBy.join(', ')}` : ''}
${activeSchema.orderBy ? `ORDER BY ${activeSchema.orderBy.map(o => `${o.field} ${o.direction}`).join(', ')}` : ''};
`.trim() : '';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">EHR Integration & JSON Query Schema Studio</h2>
            <p className="text-xs text-slate-500 font-medium">Standardized query specification schemas for seamless LIS/EHR database interoperability</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateNewSchema}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Schema</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>Paste Raw JSON</span>
          </button>
          <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-xs font-bold text-teal-700 rounded-lg font-mono hidden sm:inline-block">
            Target: {activeSchema?.targetEhrDatabase || 'Oracle_HCLAB'}
          </span>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Schema List Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered EHR Query Schemas</h3>
            <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{schemas.length} Loaded</span>
          </div>

          <button
            onClick={handleCreateNewSchema}
            className="w-full py-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600" />
            <span>Add Custom Manual Schema</span>
          </button>
          
          <div className="space-y-2">
            {schemas.map((schema) => {
              const isSelected = schema.id === selectedSchemaId;
              return (
                <div
                  key={schema.id}
                  onClick={() => handleSelectSchema(schema.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col space-y-1 cursor-pointer group relative ${
                    isSelected
                      ? 'bg-teal-600 border-teal-700 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{schema.queryName}</span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${
                        isSelected ? 'bg-teal-700 border-teal-500 text-teal-100 font-semibold' : 'bg-white border-slate-200 text-slate-500 font-medium'
                      }`}>
                        {schema.department}
                      </span>
                      <button
                        onClick={(e) => handleOpenDeleteModal(schema, e)}
                        className={`p-1 rounded-lg transition-all cursor-pointer ${
                          isSelected ? 'text-teal-200 hover:text-white hover:bg-teal-700' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Delete schema"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-[11px] line-clamp-2 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>{schema.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle & Right Column: Interactive Editor & Generated SQL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* JSON Schema Code Editor */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-sm space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileJson className="w-4 h-4 text-teal-600" />
                <h4 className="font-bold text-sm text-slate-900">JSON Query Schema Definition</h4>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleValidateSchema}
                  disabled={isValidating}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Validate schema structure & run LIS record test"
                >
                  {isValidating ? (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  ) : (
                    <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>{isValidating ? 'Validating...' : 'Validate Schema'}</span>
                </button>

                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Schema'}</span>
                </button>

                <button
                  onClick={handleSaveJson}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-xs font-bold text-white flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Schema</span>
                </button>

                {activeSchema && (
                  <button
                    onClick={(e) => handleOpenDeleteModal(activeSchema, e)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="Delete current query schema"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={rawJsonText}
              onChange={(e) => {
                setRawJsonText(e.target.value);
                setValidationResult(null);
              }}
              rows={14}
              className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-4 font-mono text-xs text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed shadow-inner"
            />

          </div>

          {/* Schema Validation Diagnostic Results Panel */}
          {validationResult && (
            <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
              validationResult.isValid ? 'bg-teal-50/50 border-teal-200 text-slate-900' : 'bg-red-50/50 border-red-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center space-x-2">
                  {validationResult.isValid ? (
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {validationResult.isValid ? 'Schema Validation Passed' : 'Schema Validation Diagnostics Found Issues'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">Checked against LIS/EHR database standards at {validationResult.timestamp}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                  validationResult.isValid ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {validationResult.isValid ? 'CONFORMS TO LIS SCHEMA' : 'INVALID SPECIFICATION'}
                </span>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnostic Checklist</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {validationResult.checks.map((chk, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{chk.title}</span>
                        {chk.status === 'PASSED' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" /> PASS
                          </span>
                        ) : chk.status === 'WARNING' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> WARN
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" /> FAIL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-normal">{chk.description}</p>
                      {chk.details && (
                        <p className="text-[10px] font-mono text-red-600 mt-1 bg-red-50 p-1 rounded border border-red-100">{chk.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample EHR Record Match Evaluation */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-teal-600" /> Live LIS Sample Order Record Evaluation Test
                  </span>
                  <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[10px]">
                    {validationResult.sampleRecordMatches.matchedFields} / {validationResult.sampleRecordMatches.totalFields} Fields Map Directly
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Verified field aliases against sample Oracle HCLAB database record <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">#PT-8821</code> (OH_TNO: 20250724-0891).
                </p>
              </div>
            </div>
          )}

          {/* Generated SQL Equivalent */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Code2 className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-sm text-slate-900">Oracle LIS / EHR Database Generated SQL Equivalent</h4>
            </div>

            <pre className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 font-mono text-xs text-teal-200 overflow-x-auto leading-relaxed shadow-inner">
              {generatedSql}
            </pre>
          </div>

        </div>

      </div>

      {/* Paste / Import Raw JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 text-slate-900 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-50 border border-teal-100 text-teal-600 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Paste Raw JSON Query Schema</h3>
                  <p className="text-xs text-slate-500 font-medium">Import an external JSON schema string directly into the schema repository</p>
                </div>
              </div>

              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">JSON Schema Payload:</label>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder={`{\n  "id": "my-custom-schema",\n  "queryName": "My Custom Query",\n  "department": "Laboratory",\n  "primaryTable": "HCORDER_HEADER",\n  "selectFields": [\n    { "alias": "PATIENT_NAME", "field": "OH_LAST_NAME" }\n  ]\n}`}
                rows={10}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 font-mono text-xs text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner"
              />
            </div>

            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportRawJson}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Import JSON Schema</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Query Schema Warning Modal */}
      {showDeleteModal && schemaToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            
            <div className="flex items-start space-x-3.5 border-b border-slate-100 pb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0 border border-red-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">Delete Query JSON Schema?</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">This action will permanently remove the query schema definition from state.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Schema Name:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{schemaToDelete.queryName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">ID:</span>
                <span className="font-mono text-slate-700 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">{schemaToDelete.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Department:</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px]">{schemaToDelete.department}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs font-medium space-y-1">
              <p className="font-bold flex items-center gap-1 text-amber-950">
                <span>⚠️</span> Warning
              </p>
              <p className="leading-relaxed text-amber-800">
                Automated census reports utilizing this query schema definition will no longer be generated in the Census Generator unless re-imported.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSchemaToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

