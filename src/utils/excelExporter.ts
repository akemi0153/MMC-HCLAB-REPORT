import * as XLSX from 'xlsx';
import { CensusReportResult } from '../types';

export function exportCensusToExcel(reportResult: CensusReportResult) {
  const wb = XLSX.utils.book_new();

  // 1. Data Sheet
  const dataWorksheet = XLSX.utils.json_to_sheet(reportResult.rows);

  // Auto-fit column widths
  if (reportResult.columns && reportResult.columns.length > 0) {
    const colWidths = reportResult.columns.map(col => {
      let maxLen = col.length;
      reportResult.rows.forEach(r => {
        const valStr = String(r[col] || '');
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
    });
    dataWorksheet['!cols'] = colWidths;
  }

  XLSX.utils.book_append_sheet(wb, dataWorksheet, 'Census Raw Data');

  // 2. Summary & Audit Info Sheet
  const summaryRows = [
    { Parameter: 'Report Title', Value: reportResult.reportTitle },
    { Parameter: 'Hospital Department', Value: reportResult.department },
    { Parameter: 'Lab Section / Division', Value: reportResult.section },
    { Parameter: 'Date Range Start', Value: reportResult.dateRange.start },
    { Parameter: 'Date Range End', Value: reportResult.dateRange.end },
    { Parameter: 'Generated Timestamp', Value: reportResult.generatedAt },
    { Parameter: 'Total Line Items', Value: reportResult.totalRecords },
    { Parameter: 'EHR Schema Reference ID', Value: reportResult.querySchemaUsed?.id || 'N/A' },
    { Parameter: 'EHR Target Engine', Value: reportResult.querySchemaUsed?.targetEhrDatabase || 'Oracle_HCLAB' },
    { Parameter: '----------------------------------------', Value: '----------------------------------------' }
  ];

  Object.entries(reportResult.summaryMetrics).forEach(([k, v]) => {
    summaryRows.push({ Parameter: `KPI: ${k}`, Value: String(v) });
  });

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryRows);
  summaryWorksheet['!cols'] = [{ wch: 35 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, summaryWorksheet, 'Executive Summary');

  // 3. EHR Integration JSON Schema Sheet
  if (reportResult.querySchemaUsed) {
    const schemaJsonStr = JSON.stringify(reportResult.querySchemaUsed, null, 2);
    const schemaRows = schemaJsonStr.split('\n').map(line => ({ 'JSON Schema Definition': line }));
    const schemaWorksheet = XLSX.utils.json_to_sheet(schemaRows);
    schemaWorksheet['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(wb, schemaWorksheet, 'EHR JSON Query Schema');
  }

  // Trigger download
  const sanitizedTitle = reportResult.reportTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `HCLAB_Census_${sanitizedTitle}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
