import React, { useState, useEffect } from 'react';
import { WardOccupancy, Bed, Patient } from '../types';
import { Activity, BedDouble, User, AlertTriangle, ShieldCheck, HeartPulse, Filter, Search, X, CheckCircle2, Clock, Pause, Play, RefreshCw, UserPlus, LogOut } from 'lucide-react';

interface OccupancyTrackerProps {
  wards: WardOccupancy[];
  setWards: React.Dispatch<React.SetStateAction<WardOccupancy[]>>;
}

export const OccupancyTracker: React.FC<OccupancyTrackerProps> = ({ wards, setWards }) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Occupied' | 'Available' | 'Reserved'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  // Auto-Refresh Real-Time Data Controls
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>(() => new Date().toLocaleTimeString());
  const [syncCounter, setSyncCounter] = useState<number>(0);

  // Automatic periodic refresh simulation
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setLastSyncTimestamp(new Date().toLocaleTimeString());
      setSyncCounter(prev => prev + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled]);

  const handleManualSync = () => {
    setLastSyncTimestamp(new Date().toLocaleTimeString());
    setSyncCounter(prev => prev + 1);
  };

  // Compute KPI Summary Metrics
  const totalCapacity = wards.reduce((acc, w) => acc + w.totalBeds, 0);
  const totalOccupied = wards.reduce((acc, w) => acc + w.occupiedBeds, 0);
  const totalReserved = wards.reduce((acc, w) => acc + w.reservedBeds, 0);
  const totalAvailable = wards.reduce((acc, w) => acc + w.availableBeds, 0);
  const overallOccupancyPct = ((totalOccupied / totalCapacity) * 100).toFixed(1);

  // Filter wards by department
  const filteredWards = wards.filter(w => {
    if (selectedDepartment !== 'ALL' && w.department !== selectedDepartment) return false;
    return true;
  });

  const handleToggleBedStatus = (wardIndex: number, bedIndex: number) => {
    const updatedWards = [...wards];
    const bed = updatedWards[wardIndex].beds[bedIndex];

    if (bed.status === 'Occupied') {
      // Discharge patient
      bed.status = 'Available';
      bed.patient = undefined;
      updatedWards[wardIndex].occupiedBeds -= 1;
      updatedWards[wardIndex].availableBeds += 1;
    } else if (bed.status === 'Available') {
      // Admit new patient
      bed.status = 'Occupied';
      bed.patient = {
        mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
        name: 'New Inpatient Admission',
        age: 45,
        gender: 'MALE',
        birthDate: '1980-05-12',
        patientType: 'IN',
        wardOrClinic: updatedWards[wardIndex].wardName,
        bedNumber: bed.bedNumber,
        attendingPhysician: 'Dr. Duty Physician, MD',
        admissionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        diagnosis: 'Acute Ward Admission',
        status: 'Admitted'
      };
      updatedWards[wardIndex].occupiedBeds += 1;
      updatedWards[wardIndex].availableBeds -= 1;
    } else if (bed.status === 'Reserved') {
      bed.status = 'Available';
      updatedWards[wardIndex].reservedBeds -= 1;
      updatedWards[wardIndex].availableBeds += 1;
    }

    setWards(updatedWards);
    if (selectedBed?.id === bed.id) {
      setSelectedBed({ ...bed });
    }
  };

  const handleBedAction = () => {
    if (!selectedBed) return;
    const wardIndex = wards.findIndex(w => w.beds.some(b => b.id === selectedBed.id));
    if (wardIndex !== -1) {
      const bedIndex = wards[wardIndex].beds.findIndex(b => b.id === selectedBed.id);
      if (bedIndex !== -1) {
        handleToggleBedStatus(wardIndex, bedIndex);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Hospital Wide</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{totalCapacity} <span className="text-sm font-sans font-medium text-slate-400">BEDS</span></h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Across {wards.length} Ward Units
            </p>
          </div>
          <div className="p-3 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl">
            <BedDouble className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Active Inpatients</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{totalOccupied} <span className="text-sm font-sans font-medium text-slate-400">OCCUPIED</span></h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <HeartPulse className="w-3.5 h-3.5 text-emerald-600" /> Admitted & Monitored
            </p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl">
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Bed Utilization</span>
            <h3 className={`text-3xl font-extrabold mt-2 font-mono ${Number(overallOccupancyPct) > 85 ? 'text-amber-600' : 'text-slate-900'}`}>
              {overallOccupancyPct}<span className="text-lg font-sans font-medium text-slate-400">%</span>
            </h3>
            <p className="text-xs mt-1 flex items-center gap-1">
              {Number(overallOccupancyPct) > 85 ? (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> High Surge Capacity
                </span>
              ) : (
                <span className="text-teal-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Optimal Flow Rate
                </span>
              )}
            </p>
          </div>
          <div className="p-3 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="bg-sky-50 text-sky-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Vacant Beds</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{totalAvailable} <span className="text-sm font-sans font-medium text-slate-400">READY</span></h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> {totalReserved} Reserved Intake
            </p>
          </div>
          <div className="p-3 bg-sky-50 border border-sky-100 text-sky-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Auto-Refresh Data Controls & Real-Time Sync Toggle */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className={`p-2.5 rounded-xl border ${
            autoRefreshEnabled ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}>
            {autoRefreshEnabled ? (
              <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            ) : (
              <Pause className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm text-slate-900">Real-Time EHR Data Sync</h4>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1 ${
                autoRefreshEnabled
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshEnabled ? 'bg-teal-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {autoRefreshEnabled ? 'LIVE AUTO-SYNC (5s)' : 'PAUSED FOR ENTRY'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {autoRefreshEnabled
                ? `Last synced at ${lastSyncTimestamp} · Background polling active`
                : 'Automatic updates paused for seamless manual data entry & patient intake'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {!autoRefreshEnabled && (
            <button
              onClick={handleManualSync}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Trigger manual data fetch"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
              <span>Sync Now</span>
            </button>
          )}

          {/* Toggle Switch */}
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`relative inline-flex h-9 w-36 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 ${
              autoRefreshEnabled ? 'bg-teal-600' : 'bg-slate-300'
            }`}
            role="switch"
            aria-checked={autoRefreshEnabled}
          >
            <span className="sr-only">Toggle Auto Refresh</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                autoRefreshEnabled ? 'translate-x-28 text-teal-600' : 'translate-x-0.5 text-slate-500'
              }`}
            >
              {autoRefreshEnabled ? <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> : <Pause className="w-3.5 h-3.5" />}
            </span>
            <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-white ${
              autoRefreshEnabled ? 'pr-7' : 'pl-7 text-slate-700'
            }`}>
              {autoRefreshEnabled ? 'Auto ON' : 'Paused'}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Controls & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Filter className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-700 uppercase text-[11px]">Department:</span>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="Critical Care">Critical Care (ICU)</option>
            <option value="Emergency">Emergency (ER)</option>
            <option value="Medicine">Internal Medicine</option>
            <option value="Surgery">Surgery & Post-Op</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="OB-GYN">Obstetrics & Gynecology</option>
          </select>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['ALL', 'Occupied', 'Available', 'Reserved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient or bed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

      </div>

      {/* Ward Cards & Visual Bed Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWards.map((ward, wardIdx) => {
          const wardOccupancyPct = ((ward.occupiedBeds / ward.totalBeds) * 100).toFixed(0);

          const matchingBeds = ward.beds.filter(bed => {
            if (statusFilter !== 'ALL' && bed.status !== statusFilter) return false;
            if (searchQuery.trim() !== '') {
              const q = searchQuery.toLowerCase();
              const bedNumMatch = bed.bedNumber.toLowerCase().includes(q);
              const patMatch = bed.patient?.name.toLowerCase().includes(q) || bed.patient?.mrn.toLowerCase().includes(q);
              if (!bedNumMatch && !patMatch) return false;
            }
            return true;
          });

          return (
            <div key={ward.wardName} className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-800 shadow-sm space-y-4">
              
              {/* Ward Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-base text-slate-900">{ward.wardName}</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 rounded-md">
                      {ward.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {ward.occupiedBeds} Occupied · {ward.availableBeds} Vacant · {ward.reservedBeds} Reserved
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-xl font-extrabold font-mono ${Number(wardOccupancyPct) >= 85 ? 'text-red-600' : 'text-slate-900'}`}>
                    {wardOccupancyPct}%
                  </span>
                  <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${Number(wardOccupancyPct) >= 85 ? 'bg-red-500' : 'bg-teal-500'}`}
                      style={{ width: `${wardOccupancyPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Bed Grid Icons */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {matchingBeds.map((bed, bedIdx) => {
                  const isOcc = bed.status === 'Occupied';
                  const isRes = bed.status === 'Reserved';

                  return (
                    <button
                      key={bed.id}
                      onClick={() => setSelectedBed(bed)}
                      className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between h-20 relative group ${
                        isOcc
                          ? 'bg-red-50/80 border-red-200 hover:border-red-400 text-red-900'
                          : isRes
                          ? 'bg-amber-50/80 border-amber-200 hover:border-amber-400 text-amber-900'
                          : 'bg-teal-50/80 border-teal-200 hover:border-teal-400 text-teal-900'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold font-mono tracking-tight text-slate-900">{bed.bedNumber}</span>
                        <span className={`w-2 h-2 rounded-full ${isOcc ? 'bg-red-500' : isRes ? 'bg-amber-500' : 'bg-teal-500'}`}></span>
                      </div>

                      <div className="my-auto text-center">
                        <BedDouble className={`w-5 h-5 mx-auto opacity-80 ${isOcc ? 'text-red-600' : isRes ? 'text-amber-600' : 'text-teal-600'}`} />
                      </div>

                      <div className="text-[9px] truncate text-slate-600 font-bold">
                        {isOcc ? bed.patient?.name.split(' ')[0] : isRes ? 'Reserved' : 'Vacant'}
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

      {/* Bed Details Modal */}
      {selectedBed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setSelectedBed(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-2xl border ${
                selectedBed.status === 'Occupied'
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-teal-50 border-teal-200 text-teal-600'
              }`}>
                <BedDouble className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedBed.bedNumber} Details</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedBed.ward} ({selectedBed.department})</p>
              </div>
            </div>

            {selectedBed.patient ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Patient Name:</span>
                  <span className="font-bold text-slate-900">{selectedBed.patient.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Medical Record Number (MRN):</span>
                  <span className="font-mono text-teal-700 font-bold">{selectedBed.patient.mrn}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Demographics:</span>
                  <span className="text-slate-700 font-medium">{selectedBed.patient.age} yrs old · {selectedBed.patient.gender}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Attending Physician:</span>
                  <span className="text-slate-700 font-medium">{selectedBed.patient.attendingPhysician}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Admission Timestamp:</span>
                  <span className="text-slate-700 font-mono">{selectedBed.patient.admissionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Clinical Diagnosis:</span>
                  <span className="text-amber-700 font-bold">{selectedBed.patient.diagnosis}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500 text-xs">
                This bed is currently <span className="text-teal-600 font-bold uppercase">{selectedBed.status}</span>.
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={handleBedAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  selectedBed.status === 'Occupied'
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    : selectedBed.status === 'Reserved'
                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    : 'bg-teal-600 text-white hover:bg-teal-500 shadow-xs'
                }`}
              >
                {selectedBed.status === 'Occupied' ? (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Discharge Patient</span>
                  </>
                ) : selectedBed.status === 'Reserved' ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Release Reservation</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Admit New Patient</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedBed(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
