export type Department = 'Laboratory' | 'Nucmed' | 'Pulmo' | 'Medilinx';

export type LabSection = 
  | 'ALL'
  | 'Blood Bank'
  | 'Microbiology'
  | 'Point Of Care Test'
  | 'Hematology & Coagulation'
  | 'Clinical Chemistry'
  | 'Clinical Microscopy'
  | 'Immunology & Serology'
  | 'Molecular Pathology'
  | 'Drug Testing'
  | 'Emergency Laboratory';

export type PatientType = 'IN' | 'OP' | 'ER' | '00'; // Inpatient, Outpatient, Emergency, Unclassified

export interface Patient {
  mrn: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  patientType: PatientType;
  wardOrClinic: string;
  bedNumber?: string;
  attendingPhysician: string;
  admissionDate: string;
  diagnosis: string;
  status: 'Admitted' | 'Discharged' | 'Transferred' | 'Pending Admission';
}

export interface Bed {
  id: string;
  bedNumber: string;
  ward: string;
  department: string;
  status: 'Occupied' | 'Available' | 'Maintenance' | 'Reserved';
  patient?: Patient;
}

export interface WardOccupancy {
  wardName: string;
  department: string;
  totalBeds: number;
  occupiedBeds: number;
  reservedBeds: number;
  availableBeds: number;
  beds: Bed[];
}

export interface HCORDER {
  labNumber: string; // OH_TNO
  mrn: string; // OH_PID
  patientName: string; // OH_LAST_NAME
  patientType: PatientType; // OH_PTYPE
  age: number;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  trxDate: string; // OH_TRX_DT
  checkInDate: string; // OS_SPL_RCVDT
  collectionDate?: string; // OS_SPL_COLDT
  completedDate?: string; // OH_COMPLETED_DT / OD_VALIDATE_ON
  testCode: string; // OD_ORDER_TI
  testName: string; // TI_NAME
  testGroup: string; // TG_NAME / OD_TEST_GRP
  priority: 'ROUTINE' | 'URGENT';
  clinicCode: string; // OH_CLINIC_CODE
  clinicName: string; // CLINIC_DESC (Source)
  doctorCode: string; // OH_DCODE
  doctorName: string; // RESOURCE_NAME
  episode: string; // OH_VISITNO
  clinicalInfo: string; // OH_DIAG1
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'AMENDED';
  hospitalId: string; // For MediLinx in-reach (11, 12, 13, 14, 15, 1)
  hospitalName: string;
  
  // Specific to Critical Results
  criticalResultValue?: string;
  telephonedDate?: string;
  rmtComment?: string;
  telephonedTo?: string;
  medTech?: string;

  // Specific to Audit Logs
  eventLog?: 'DELETED' | 'AMENDED ORDER';
  username?: string;
  userComment?: string;
  deletionDate?: string;

  // Specific to Blood Bank
  productId?: string;
  bagId?: string;
  abo?: string;
  rh?: string;
  receivedBy?: string;
  issuedBy?: string;
  
  // Specific to Pulmonary TAT
  dateFirstRun?: string;
  dateSecondRun?: string;
  tatMinutes?: number;
  modifiedParams?: string;
  internalNote?: string;
}

export interface JsonQuerySchemaFilter {
  field: string;
  operator: 'EQUALS' | 'IN' | 'LIKE' | 'BETWEEN' | 'NOT_IN' | 'IS_NOT_NULL';
  value: any;
}

export interface JsonQuerySchemaJoin {
  table: string;
  on: string;
  type: 'INNER' | 'LEFT' | 'RIGHT';
}

export interface JsonQuerySchema {
  id: string;
  queryName: string;
  department: Department;
  reportType: string;
  description: string;
  primaryTable: string;
  selectFields: Array<{
    alias: string;
    field: string;
    transformation?: string;
  }>;
  joins: JsonQuerySchemaJoin[];
  filters: JsonQuerySchemaFilter[];
  groupBy?: string[];
  orderBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
  targetEhrDatabase: 'Oracle_HCLAB' | 'FHIR_R4' | 'PostgreSQL_HIS' | 'HL7_V2';
}

export interface CensusReportResult {
  reportTitle: string;
  department: string;
  section: string;
  dateRange: { start: string; end: string };
  generatedAt: string;
  querySchemaUsed: JsonQuerySchema;
  totalRecords: number;
  columns: string[];
  rows: Record<string, any>[];
  summaryMetrics: Record<string, number | string>;
}

export interface AiCensusInsight {
  occupancyAnalysis: string;
  tatBottlenecks: string[];
  departmentHighlights: string[];
  administrativeRecommendations: string[];
  criticalAlertsCount: number;
}
