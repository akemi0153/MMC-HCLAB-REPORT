import { JsonQuerySchema } from '../types';

export const DEFAULT_JSON_SCHEMAS: JsonQuerySchema[] = [
  {
    id: 'lab-patient-count',
    queryName: 'Patient Census Query (MMC) - ALL/Section',
    department: 'Laboratory',
    reportType: 'Patient Census (Count)',
    description: 'Aggregates distinct patient count by date range and patient classification (Inpatient, Outpatient, Emergency, Unclassified).',
    primaryTable: 'HORD_HDR',
    selectFields: [
      { alias: 'DATE_RANGE', field: 'TRUNC(HORD_HDR.OH_TRX_DT)' },
      { alias: 'OUTPATIENT', field: 'COUNT(UNIQUE CASE WHEN OH_PTYPE="OP" THEN OH_PID END)' },
      { alias: 'INPATIENT', field: 'COUNT(UNIQUE CASE WHEN OH_PTYPE="IN" THEN OH_PID END)' },
      { alias: 'EMERGENCY', field: 'COUNT(UNIQUE CASE WHEN OH_PTYPE="ER" THEN OH_PID END)' },
      { alias: 'UNCLASSIFIED', field: 'COUNT(UNIQUE CASE WHEN OH_PTYPE="00" THEN OH_PID END)' }
    ],
    joins: [
      { table: 'HORD_DTL', on: 'HORD_HDR.OH_TNO = HORD_DTL.OD_TNO', type: 'INNER' }
    ],
    filters: [
      { field: 'HORD_HDR.OH_PID', operator: 'EQUALS', value: 'NOT_00' },
      { field: 'HORD_HDR.OH_TRX_DT', operator: 'BETWEEN', value: ':dt_start AND :dt_end' }
    ],
    groupBy: ['TRUNC(HORD_HDR.OH_TRX_DT)', 'HORD_HDR.OH_PTYPE'],
    orderBy: [{ field: 'TRUNC(HORD_HDR.OH_TRX_DT)', direction: 'ASC' }],
    targetEhrDatabase: 'Oracle_HCLAB'
  },
  {
    id: 'lab-procedure-count',
    queryName: 'Procedure Count Census Query (MMC)',
    department: 'Laboratory',
    reportType: 'Procedure Census (Count)',
    description: 'Counts validated laboratory test procedures by test group, test code, test name, and patient category.',
    primaryTable: 'HORD_DTL',
    selectFields: [
      { alias: 'TEST_GROUP', field: 'TEST_GROUP.TG_NAME' },
      { alias: 'TEST_CODE', field: 'HORD_DTL.OD_ORDER_TI' },
      { alias: 'TEST_NAME', field: 'TEST_ITEM.TI_NAME' },
      { alias: 'OUTPATIENT', field: 'COUNT(CASE WHEN OH_PTYPE="OP" THEN OD_ORDER_TI END)' },
      { alias: 'INPATIENT', field: 'COUNT(CASE WHEN OH_PTYPE="IN" THEN OD_ORDER_TI END)' },
      { alias: 'EMERGENCY', field: 'COUNT(CASE WHEN OH_PTYPE="ER" THEN OD_ORDER_TI END)' },
      { alias: 'UNCLASSIFIED', field: 'COUNT(CASE WHEN OH_PTYPE="00" THEN OD_ORDER_TI END)' }
    ],
    joins: [
      { table: 'HORD_HDR', on: 'HORD_HDR.OH_TNO = HORD_DTL.OD_TNO', type: 'INNER' },
      { table: 'HORD_SPL', on: 'HORD_HDR.OH_TNO = HORD_SPL.OS_TNO', type: 'INNER' },
      { table: 'TEST_ITEM', on: 'HORD_DTL.OD_ORDER_TI = TEST_ITEM.TI_CODE', type: 'INNER' },
      { table: 'TEST_GROUP', on: 'TEST_ITEM.TI_TEST_GRP = TEST_GROUP.TG_CODE', type: 'INNER' }
    ],
    filters: [
      { field: 'HORD_DTL.OD_VALIDATE_ON', operator: 'BETWEEN', value: ':dt_start AND :dt_end' },
      { field: 'HORD_SPL.OS_SPL_RJ_FLAG', operator: 'EQUALS', value: 'N' },
      { field: 'TEST_ITEM.TI_ORDER_ENABLE', operator: 'EQUALS', value: 'Y' }
    ],
    groupBy: ['TEST_GROUP.TG_NAME', 'HORD_DTL.OD_ORDER_TI', 'TEST_ITEM.TI_NAME', 'HORD_HDR.OH_PTYPE'],
    orderBy: [{ field: 'COUNT(HORD_DTL.OD_ORDER_TI)', direction: 'DESC' }],
    targetEhrDatabase: 'Oracle_HCLAB'
  },
  {
    id: 'lab-procedure-detailed',
    queryName: 'Procedure Detailed Census Query (MMC)',
    department: 'Laboratory',
    reportType: 'Procedure Census (Detailed)',
    description: 'Detailed line item report listing each lab order, patient MRN, ordering physician, clinic source, and validation timestamps.',
    primaryTable: 'HORD_HDR',
    selectFields: [
      { alias: 'LAB_NUMBER', field: 'HORD_HDR.OH_TNO' },
      { alias: 'PATIENT_NAME', field: 'HORD_HDR.OH_LAST_NAME' },
      { alias: 'MRN', field: 'HORD_HDR.OH_PID' },
      { alias: 'TEST_CODES', field: 'HORD_DTL.OD_ORDER_TI' },
      { alias: 'TEST_NAME', field: 'TEST_ITEM.TI_NAME' },
      { alias: 'TEST_GROUP', field: 'TEST_GROUP.TG_NAME' },
      { alias: 'DATE_ORDERED', field: 'HORD_HDR.OH_TRX_DT' },
      { alias: 'EPISODE', field: 'HORD_HDR.OH_VISITNO' },
      { alias: 'DOCTOR', field: 'HFRESOURCE.RESOURCE_NAME' },
      { alias: 'PATIENT_TYPE', field: 'HORD_HDR.OH_PTYPE' },
      { alias: 'THE_SOURCE', field: 'HFCLINIC.CLINIC_DESC' },
      { alias: 'CLINICAL_INFO', field: 'HORD_HDR.OH_DIAG1' },
      { alias: 'STATUS', field: 'CASE WHEN OD_VALIDATE_ON IS NULL THEN "PENDING" ELSE "COMPLETED" END' },
      { alias: 'COMPLETED_DT', field: 'HORD_HDR.OH_COMPLETED_DT' }
    ],
    joins: [
      { table: 'HORD_DTL', on: 'HORD_HDR.OH_TNO = HORD_DTL.OD_TNO', type: 'INNER' },
      { table: 'HFRESOURCE', on: 'HORD_HDR.OH_DCODE = HFRESOURCE.RESOURCE_CODE', type: 'LEFT' },
      { table: 'HFCLINIC', on: 'HORD_HDR.OH_CLINIC_CODE = HFCLINIC.CLINIC_CODE', type: 'LEFT' },
      { table: 'TEST_ITEM', on: 'HORD_DTL.OD_ORDER_TI = TEST_ITEM.TI_CODE', type: 'INNER' },
      { table: 'TEST_GROUP', on: 'TEST_ITEM.TI_TEST_GRP = TEST_GROUP.TG_CODE', type: 'INNER' }
    ],
    filters: [
      { field: 'HORD_HDR.OH_COMPLETED_DT', operator: 'BETWEEN', value: ':dt_start AND :dt_end' }
    ],
    orderBy: [{ field: 'HORD_HDR.OH_TRX_DT', direction: 'ASC' }],
    targetEhrDatabase: 'Oracle_HCLAB'
  },
  {
    id: 'lab-critical-results',
    queryName: 'Patient Critical Results Log',
    department: 'Laboratory',
    reportType: 'Patient Critical Results',
    description: 'Tracks panics and critical lab values relayed to attending nurses/doctors with timestamp audit trail.',
    primaryTable: 'HORD_HDR',
    selectFields: [
      { alias: 'ORDERED_DATE', field: 'HORD_HDR.OH_TRX_DT' },
      { alias: 'LAB_NUMBER', field: 'HORD_HDR.OH_TNO' },
      { alias: 'MRN', field: 'HORD_HDR.OH_PID' },
      { alias: 'PATIENT_NAME', field: 'HORD_HDR.OH_LAST_NAME' },
      { alias: 'TEST_GROUP', field: 'TEST_GROUP.TG_NAME' },
      { alias: 'COLLECTION_DT', field: 'HORD_SPL.OS_SPL_COLDT' },
      { alias: 'ARRIVAL_DT', field: 'HORD_SPL.OS_SPL_RCVDT' },
      { alias: 'TELEPHONED_DT', field: 'TELEPHONE_QUEUE.TQ_DATE' },
      { alias: 'TEST_ITEM', field: 'TEST_ITEM.TI_NAME' },
      { alias: 'RESULT_VALUE', field: 'TELEPHONE_QUEUE.TQ_RESULT' },
      { alias: 'RMT_COMMENT', field: 'TELEPHONE_QUEUE.TQ_COMMENT' },
      { alias: 'TELEPHONED_TO', field: 'TELEPHONE_QUEUE.TQ_TEL_TO' },
      { alias: 'MEDICAL_TECHNOLOGIST', field: 'USER_ACCOUNT.USER_NAME' }
    ],
    joins: [
      { table: 'TELEPHONE_QUEUE', on: 'TELEPHONE_QUEUE.TQ_LAB_TNO = HORD_HDR.OH_TNO', type: 'INNER' },
      { table: 'TEST_ITEM', on: 'TEST_ITEM.TI_CODE = TELEPHONE_QUEUE.TQ_TESTCODE', type: 'INNER' },
      { table: 'TEST_GROUP', on: 'TEST_GROUP.TG_CODE = TEST_ITEM.TI_TEST_GRP', type: 'INNER' },
      { table: 'USER_ACCOUNT', on: 'USER_ACCOUNT.USER_ID = TELEPHONE_QUEUE.TQ_TEL_BY', type: 'INNER' }
    ],
    filters: [
      { field: 'HORD_HDR.OH_TRX_DT', operator: 'BETWEEN', value: ':dt_start AND :dt_end' }
    ],
    orderBy: [{ field: 'TELEPHONE_QUEUE.TQ_DATE', direction: 'DESC' }],
    targetEhrDatabase: 'Oracle_HCLAB'
  },
  {
    id: 'medilinx-inreach-sendin',
    queryName: 'In-reach Census - By Patient (Send-In)',
    department: 'Medilinx',
    reportType: 'In-reach Census (By Patient - Send-In)',
    description: 'Tracks send-in specimens from affiliated networks (Asian Hospital, Cardinal Santos, De Los Santos, Manila Doctors, Our Lady of Lourdes).',
    primaryTable: 'JV_DPD',
    selectFields: [
      { alias: 'HOSPITAL_ID', field: 'JV_DPH.JDH_HOSPITAL_ID' },
      { alias: 'HOSPITAL_NAME', field: 'CASE WHEN JDH_HOSPITAL_ID="11" THEN "ASIAN HOSPITAL" WHEN JDH_HOSPITAL_ID="12" THEN "CARDINAL SANTOS" WHEN JDH_HOSPITAL_ID="13" THEN "DELOS SANTOS" WHEN JDH_HOSPITAL_ID="15" THEN "MANILA DOCTORS" WHEN JDH_HOSPITAL_ID="14" THEN "OUR LADY OF LOURDES" END' },
      { alias: 'ORDER_BATCH_DT', field: 'JV_DPH.JDH_TRX_DT' },
      { alias: 'CHECK_IN_DT', field: 'JV_DPD.JDD_SPL_RCVDT' },
      { alias: 'LAB_NUMBER', field: 'JV_DPD.JDD_SID' },
      { alias: 'MRN', field: 'JV_DPD.JDD_PID' },
      { alias: 'PATIENT_NAME', field: 'JV_DPD.JDD_PNAME' },
      { alias: 'TEST_CODE', field: 'JV_DPD_TI.JDI_TI_CODE' },
      { alias: 'TEST_NAME', field: 'TEST_ITEM.TI_NAME' },
      { alias: 'RELEASED_DT', field: 'ORD_HDR.OH_COMPLETED_DT' },
      { alias: 'DISCOUNT_NO_BILLING_FLAG', field: 'CASE WHEN JDD_RJ_CODE IS NOT NULL THEN "1" ELSE "0" END' }
    ],
    joins: [
      { table: 'JV_DPH', on: 'JV_DPH.JDH_BATCH_NO = JV_DPD.JDD_BATCH_NO', type: 'INNER' },
      { table: 'JV_DPD_TI', on: 'JV_DPD.JDD_SID = JV_DPD_TI.JDI_SID', type: 'INNER' },
      { table: 'ORD_HDR', on: 'JV_DPD.JDD_LAB_TNO = ORD_HDR.OH_TNO', type: 'INNER' },
      { table: 'TEST_ITEM', on: 'JV_DPD_TI.JDI_TI_CODE = TEST_ITEM.TI_CODE', type: 'INNER' }
    ],
    filters: [
      { field: 'JV_DPD.JDD_SPL_RCVDT', operator: 'BETWEEN', value: ':dt_start AND :dt_end' }
    ],
    orderBy: [{ field: 'JV_DPH.JDH_HOSPITAL_ID', direction: 'ASC' }, { field: 'JV_DPD.JDD_PNAME', direction: 'ASC' }],
    targetEhrDatabase: 'Oracle_HCLAB'
  },
  {
    id: 'pulmo-tat-analysis',
    queryName: 'Turn Around Time (More than 30 Mins)',
    department: 'Pulmo',
    reportType: 'Turn Around Time (More than 30 Mins)',
    description: 'Pulmonary function test turnaround time delay analysis (>30 mins) with instrument run timestamps and RT comments.',
    primaryTable: 'ORD_HDR',
    selectFields: [
      { alias: 'LAB_NUMBER', field: 'ORD_HDR.OH_TNO' },
      { alias: 'PATIENT_NAME', field: 'ORD_HDR.OH_LAST_NAME' },
      { alias: 'MRN', field: 'ORD_HDR.OH_PID' },
      { alias: 'TEST_NAME', field: 'TEST_ITEM.TI_NAME' },
      { alias: 'PATIENT_TYPE', field: 'ORD_HDR.OH_PTYPE' },
      { alias: 'DATE_ORDERED', field: 'ORD_HDR.OH_TRX_DT' },
      { alias: 'DATE_CHECKED_IN', field: 'ORD_SPL.OS_SPL_RCVDT' },
      { alias: 'DATE_FIRST_RUN', field: 'AUDLOGS_FIRST.E_DATETIME' },
      { alias: 'DATE_RELEASED', field: 'ORD_HDR.OH_COMPLETED_DT' },
      { alias: 'RELEASED_BY', field: 'USER_ACCOUNT.USER_NAME' },
      { alias: 'TAT_MINUTES', field: '(ORD_HDR.OH_COMPLETED_DT - ORD_SPL.OS_SPL_RCVDT)*1440' },
      { alias: 'MODIFIED_RESULT_PARAMETERS', field: 'AUDLOGS_SECOND.E_COMMENT' }
    ],
    joins: [
      { table: 'ORD_DTL', on: 'ORD_HDR.OH_TNO = ORD_DTL.OD_TNO', type: 'INNER' },
      { table: 'ORD_SPL', on: 'ORD_HDR.OH_TNO = ORD_SPL.OS_TNO', type: 'INNER' },
      { table: 'TEST_ITEM', on: 'ORD_DTL.OD_ORDER_TI = TEST_ITEM.TI_CODE', type: 'INNER' }
    ],
    filters: [
      { field: 'ORD_DTL.OD_TEST_GRP', operator: 'EQUALS', value: 'PL' },
      { field: 'TAT_MINUTES', operator: 'BETWEEN', value: '31 AND 9999' }
    ],
    orderBy: [{ field: 'ORD_HDR.OH_TRX_DT', direction: 'DESC' }],
    targetEhrDatabase: 'Oracle_HCLAB'
  }
];
