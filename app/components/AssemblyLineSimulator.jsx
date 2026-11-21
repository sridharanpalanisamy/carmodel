"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const initialDepartments = [
  {
    "id": "supplier",
    "name": "Supplier & Incoming Materials",
    "description": "Raw materials, supplier receipts and incoming lot acceptance",
    "unit": "lots",
    "cycleSeconds": 12,
    "target": 360,
    "actual": 8,
    "downtime": 1.5,
    "shiftHours": 8,
    "breakMinutes": 40,
    "rejected": 0
  },
  {
    "id": "fabrication",
    "name": "Fabrication",
    "description": "Cutting, bending, stamping and structural part fabrication",
    "unit": "parts",
    "cycleSeconds": 38,
    "target": 340,
    "actual": 18,
    "downtime": 2.5,
    "shiftHours": 8,
    "breakMinutes": 40,
    "rejected": 0
  },
  {
    "id": "machine",
    "name": "Machine Shop",
    "description": "Turning, milling, drilling and precision machining",
    "unit": "parts",
    "cycleSeconds": 52,
    "target": 330,
    "actual": 22,
    "downtime": 3,
    "shiftHours": 8,
    "breakMinutes": 40,
    "rejected": 0
  },
  {
    "id": "internal-logistics",
    "name": "Internal Logistics",
    "description": "Material movement, kitting and line-side replenishment",
    "unit": "kits",
    "cycleSeconds": 20,
    "target": 350,
    "actual": 12,
    "downtime": 1,
    "shiftHours": 8,
    "breakMinutes": 40,
    "rejected": 0
  },
  {
    "id": "paint",
    "name": "Paint Shop",
    "description": "Surface preparation, coating, curing and finish handling",
    "unit": "parts",
    "cycleSeconds": 64,
    "target": 325,
    "actual": 28,
    "downtime": 4,
    "shiftHours": 8,
    "breakMinutes": 40,
    "rejected": 0
  },
  {
    "id": "assembly",
    "name": "Assembly Line",
    "description": "Sub-assembly, fitment, fastening and vehicle assembly",
    "unit": "vehicles",
    "cycleSeconds": 78,
    "target": 300,
    "actual": 35,
    "downtime": 5,
    "shiftHours": 8,
    "breakMinutes": 40,
    "rejected": 0
  },
  {
    "id": "testing",
    "name": "Testing",
    "description": "Functional, electrical, road-simulation and end-of-line tests",
    "unit": "vehicles",
    "cycleSeconds": 95,
    "target": 290,
    "actual": 20,
    "downtime": 3,
    "shiftHours": 8,
    "breakMinutes": 40,
    "rejected": 0
  },
  {
    "id": "quality",
    "name": "Quality Check Department",
    "description": "Final inspection, defect segregation and release approval",
    "unit": "vehicles",
    "cycleSeconds": 42,
    "target": 285,
    "actual": 16,
    "downtime": 2,
    "shiftHours": 8,
    "breakMinutes": 40,
    "rejected": 0
  },
  {
    "id": "dispatch",
    "name": "Transport & Dispatch Logistics",
    "description": "Finished-goods staging, documentation and vehicle dispatch",
    "unit": "vehicles",
    "cycleSeconds": 30,
    "target": 280,
    "actual": 10,
    "downtime": 1,
    "shiftHours": 8,
    "breakMinutes": 40,
    "rejected": 0
  }
];

const initialStations = [
  { name: "Stamping", seconds: 42 },
  { name: "Body welding", seconds: 55 },
  { name: "Surface preparation", seconds: 48 },
  { name: "Paint finishing", seconds: 62 },
  { name: "Powertrain preparation", seconds: 50 },
  { name: "Final assembly", seconds: 68 },
  { name: "Quality validation", seconds: 45 }
];

const initialWeeklyProduction = [
  { day: "Monday", planned: 350, good: 330, rejected: 8, downtime: 35 },
  { day: "Tuesday", planned: 350, good: 340, rejected: 5, downtime: 25 },
  { day: "Wednesday", planned: 350, good: 310, rejected: 12, downtime: 55 },
  { day: "Thursday", planned: 350, good: 345, rejected: 4, downtime: 20 },
  { day: "Friday", planned: 350, good: 325, rejected: 9, downtime: 40 },
  { day: "Saturday", planned: 300, good: 290, rejected: 4, downtime: 25 },
  { day: "Sunday", planned: 0, good: 0, rejected: 0, downtime: 0 }
];

function parseWeeklyProductionCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim()); cell = "";
    } else if ((char === "\\n" || char === "\\r") && !quoted) {
      if (char === "\\r" && text[index + 1] === "\\n") index += 1;
      row.push(cell.trim()); cell = "";
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(value => value !== "")) rows.push(row);
  if (rows.length !== 8) throw new Error("Upload must contain one header row and exactly seven daily rows.");
  const headers = rows[0].map(value => value.toLowerCase().replace(/[ _-]/g, ""));
  const required = ["day", "planned", "good", "rejected", "downtime"];
  const positions = required.map(header => headers.indexOf(header));
  if (positions.some(index => index < 0)) throw new Error("Required columns: Day, Planned, Good, Rejected, Downtime.");
  const allowedDays = initialWeeklyProduction.map(item => item.day);
  const seen = new Set();
  return rows.slice(1).map(values => {
    const day = values[positions[0]];
    if (!allowedDays.includes(day) || seen.has(day)) throw new Error("Use each day Monday through Sunday exactly once.");
    seen.add(day);
    const numbers = positions.slice(1).map(index => Number(values[index]));
    if (numbers.some(value => !Number.isInteger(value) || value < 0)) throw new Error("Production and downtime values must be non-negative whole numbers.");
    const [planned, good, rejected, downtime] = numbers;
    if (good + rejected > planned && planned !== 0) throw new Error(day + ": good plus rejected units cannot exceed planned units in this sample format.");
    if (downtime > 720) throw new Error(day + ": downtime cannot exceed 720 minutes.");
    return { day, planned, good, rejected, downtime };
  }).sort((a, b) => allowedDays.indexOf(a.day) - allowedDays.indexOf(b.day));
}

function parseStationPerformanceCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\\n" || char === "\\r") && !quoted) {
      if (char === "\\r" && text[index + 1] === "\\n") index += 1;
      row.push(cell.trim()); cell = "";
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(value => value !== "")) rows.push(row);
  if (rows.length !== initialStations.length + 1) throw new Error("Upload must contain a header and exactly seven station rows.");
  const headers = rows[0].map(value => value.toLowerCase().replace(/[ _-]/g, ""));
  const required = ["station", "processed", "rejected", "downtime", "avgcycletime"];
  const positions = required.map(header => headers.indexOf(header));
  if (positions.some(index => index < 0)) throw new Error("Required columns: Station, Processed, Rejected, Downtime, AvgCycleTime. Optional: DefectCategory, DowntimeCause.");
  const defectPosition = headers.indexOf("defectcategory");
  const downtimeCausePosition = headers.indexOf("downtimecause");
  const seen = new Set();
  return rows.slice(1).map(values => {
    const name = values[positions[0]];
    if (!initialStations.some(station => station.name === name) || seen.has(name)) throw new Error("Use each of the seven station names exactly once.");
    seen.add(name);
    const [processed, rejected, downtime, avgCycleSeconds] = positions.slice(1).map(index => Number(values[index]));
    if (![processed, rejected, downtime, avgCycleSeconds].every(Number.isFinite) ||
      !Number.isInteger(processed) || !Number.isInteger(rejected) || !Number.isInteger(downtime) ||
      processed < 0 || rejected < 0 || downtime < 0 || downtime > 720 || avgCycleSeconds < 1 || avgCycleSeconds > 600) {
      throw new Error(name + ": enter whole non-negative counts/minutes and an average cycle time from 1 to 600 seconds.");
    }
    if (rejected > processed) throw new Error(name + ": rejected units cannot exceed processed units.");
    return { name, processed, rejected, downtime, avgCycleSeconds, defectCategory: defectPosition >= 0 ? (values[defectPosition] || "Not specified") : "Not specified", downtimeCause: downtimeCausePosition >= 0 ? (values[downtimeCausePosition] || "Not specified") : "Not specified" };
  }).sort((a, b) => initialStations.findIndex(station => station.name === a.name) - initialStations.findIndex(station => station.name === b.name));
}

const initialStationPerformance = [
  { name: "Stamping", processed: 342, rejected: 3, downtime: 18, avgCycleSeconds: 42, defectCategory: "Dimensional variation", downtimeCause: "Die adjustment" },
  { name: "Body welding", processed: 338, rejected: 4, downtime: 32, avgCycleSeconds: 55, defectCategory: "Weld porosity", downtimeCause: "Welding fixture reset" },
  { name: "Surface preparation", processed: 334, rejected: 5, downtime: 27, avgCycleSeconds: 48, defectCategory: "Surface contamination", downtimeCause: "Cleaning equipment stoppage" },
  { name: "Paint finishing", processed: 329, rejected: 9, downtime: 46, avgCycleSeconds: 62, defectCategory: "Paint finish defect", downtimeCause: "Booth maintenance" },
  { name: "Powertrain preparation", processed: 326, rejected: 2, downtime: 21, avgCycleSeconds: 50, defectCategory: "Fitment mismatch", downtimeCause: "Part replenishment" },
  { name: "Final assembly", processed: 324, rejected: 3, downtime: 38, avgCycleSeconds: 68, defectCategory: "Assembly mismatch", downtimeCause: "Tool changeover" },
  { name: "Quality validation", processed: 321, rejected: 7, downtime: 16, avgCycleSeconds: 45, defectCategory: "Inspection failure", downtimeCause: "Retest queue" }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
}

function formatMinutesAsClock(totalMinutes) {
  return formatDuration(Math.max(0, Number(totalMinutes) || 0) * 60);
}

function isValidSavedScenario(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const inRange = (number, min, max) => Number.isFinite(number) && number >= min && number <= max;
  const supportedVersion = value.version === undefined || value.version === 1 || value.version === 2;
  const stationOrderMatches = value.stationNames === undefined ||
    (Array.isArray(value.stationNames) &&
      value.stationNames.length === initialStations.length &&
      value.stationNames.every((name, index) => name === initialStations[index].name));
  return supportedVersion &&
    stationOrderMatches &&
    Array.isArray(value.cycleTimes) &&
    value.cycleTimes.length === initialStations.length &&
    value.cycleTimes.every(seconds => inRange(seconds, 20, 180)) &&
    inRange(value.shiftHours, 4, 12) &&
    inRange(value.breakMinutes, 0, 120) &&
    inRange(value.availability, 50, 100) &&
    inRange(value.yieldRate, 70, 100) &&
    inRange(value.target, 50, 700) &&
    typeof value.savedAt === "string" &&
    Number.isFinite(Date.parse(value.savedAt));
}

function getScenarioProjection(snapshot) {
  const bottleneck = Math.max(...snapshot.cycleTimes);
  const netMinutes = Math.max(0, snapshot.shiftHours * 60 - snapshot.breakMinutes);
  const ideal = bottleneck > 0 ? Math.floor(netMinutes * 60 / bottleneck) : 0;
  const available = Math.floor(ideal * snapshot.availability / 100);
  const good = Math.floor(available * snapshot.yieldRate / 100);
  return {
    good,
    bottleneck,
    bottleneckName: initialStations[snapshot.cycleTimes.indexOf(bottleneck)]?.name || "—",
    gap: good - snapshot.target,
    attainmentPercent: snapshot.target > 0 ? good / snapshot.target * 100 : 0
  };
}

function getScenarioCapacityMetrics(snapshot, projection = getScenarioProjection(snapshot)) {
  const netMinutes = Math.max(0, snapshot.shiftHours * 60 - snapshot.breakMinutes);
  const ideal = projection.bottleneck > 0 ? Math.floor(netMinutes * 60 / projection.bottleneck) : 0;
  const available = Math.floor(ideal * snapshot.availability / 100);
  const requiredAvailable = snapshot.target > 0 && snapshot.yieldRate > 0
    ? Math.ceil(snapshot.target / (snapshot.yieldRate / 100)) : 0;
  const requiredIdeal = requiredAvailable > 0 && snapshot.availability > 0
    ? Math.ceil(requiredAvailable / (snapshot.availability / 100)) : 0;
  const requiredCycle = requiredIdeal > 0 ? Math.floor(netMinutes * 60 / requiredIdeal) : 0;
  const feasible = snapshot.target === 0 || (requiredCycle >= 20 && snapshot.availability > 0 && snapshot.yieldRate > 0);
  return {
    netMinutes, ideal, available, requiredCycle, feasible,
    taktSeconds: snapshot.target > 0 ? netMinutes * 60 / snapshot.target : 0
  };
}

function buildImprovementActions(stations) {
  const sorted = [...stations];
  const bottleneck = sorted.reduce((slowest, station) => station.avgCycleSeconds > slowest.avgCycleSeconds ? station : slowest, sorted[0]);
  const downtimeLeader = sorted.reduce((highest, station) => station.downtime > highest.downtime ? station : highest, sorted[0]);
  const defectLeader = sorted.reduce((highest, station) => station.rejected > highest.rejected ? station : highest, sorted[0]);
  const dueDate = days => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  return [
    { id: "cycle-time", priority: "High", issue: bottleneck.name + " has the longest average cycle time (" + bottleneck.avgCycleSeconds + " sec).", action: "Observe the work cycle, identify waiting or repeat handling, and trial a balanced work sequence.", owner: "", dueDate: dueDate(7), status: "Not started", kpi: "Average cycle time at " + bottleneck.name },
    { id: "downtime", priority: "High", issue: downtimeLeader.name + " records the highest downtime (" + downtimeLeader.downtime + " min).", action: "Review stoppage logs and verify the main downtime cause; agree a preventive action with maintenance.", owner: "", dueDate: dueDate(14), status: "Not started", kpi: "Downtime minutes at " + downtimeLeader.name },
    { id: "quality", priority: "Medium", issue: defectLeader.name + " records the most rejects (" + defectLeader.rejected + ").", action: "Separate defects by type, confirm root cause and introduce a documented check at the source.", owner: "", dueDate: dueDate(14), status: "Not started", kpi: "Reject count at " + defectLeader.name }
  ];
}

export default function AssemblyLineSimulator() {
  const [mount, setMount] = useState(null);
  const [dashboardNow, setDashboardNow] = useState(() => new Date());
  const [departments, setDepartments] = useState(initialDepartments);
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [productionHistory, setProductionHistory] = useState([]);
  const [departmentIssues, setDepartmentIssues] = useState([]);
  const [issueDraft, setIssueDraft] = useState({ departmentId: "supplier", title: "", rootCause: "", correctiveAction: "", owner: "", dueDate: "", priority: "Medium" });
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [maintenanceDraft, setMaintenanceDraft] = useState({ departmentId: "machine-shop", asset: "", maintenanceType: "Preventive", serviceDescription: "", technician: "", lastServiceDate: "", nextServiceDate: "", priority: "Medium" });
  const [comparisonOlderId, setComparisonOlderId] = useState("");
  const [comparisonNewerId, setComparisonNewerId] = useState("");
  const [productCodeInput, setProductCodeInput] = useState("");
  const [activeProductId, setActiveProductId] = useState("");
  const [departmentDataReady, setDepartmentDataReady] = useState(false);
  const [departmentDataMessage, setDepartmentDataMessage] = useState("Department settings and product records are saved in this browser.");
  const [departmentDataIsSample, setDepartmentDataIsSample] = useState(true);
  const updateDepartment = (id, field, value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const limits = { cycleSeconds:[1,3600], target:[0,100000], actual:[0,100000], downtime:[0,720], rejected:[0,100000], shiftHours:[1,24], breakMinutes:[0,300] };
    const [min,max] = limits[field] || [0,100000];
    setDepartments(current => current.map(item => item.id === id ? { ...item, [field]: clamp(numeric,min,max) } : item));
  };
  const addTrackedProduct = () => {
    const code = productCodeInput.trim();
    if (!code || trackedProducts.some(item => item.code.toLowerCase() === code.toLowerCase())) return;
    const createdAt = new Date().toISOString();
    setTrackedProducts(current => [{ code, createdAt, events: [] }, ...current].slice(0,100));
    setActiveProductId(code);
    setProductCodeInput("");
  };
  const recordDepartmentCompletion = (departmentId, departmentIndex) => {
    const timestamp = new Date().toISOString();
    setTrackedProducts(current => current.map(product => {
      if (product.code !== activeProductId || product.events.length !== departmentIndex) return product;
      return { ...product, events: [...product.events, { departmentId, timestamp }] };
    }));
  };
  const activeTrackedProduct = trackedProducts.find(item => item.code === activeProductId);
  const departmentTotals = departments.reduce((totals, item) => {
    const netSeconds = Math.max(0, item.shiftHours * 3600 - item.breakMinutes * 60 - item.downtime * 60);
    const capacity = item.cycleSeconds > 0 ? Math.floor(netSeconds / item.cycleSeconds) : 0;
    const output = Math.max(0, item.actual - item.rejected);
    return { target: totals.target + item.target, actual: totals.actual + output, rejected: totals.rejected + item.rejected, downtime: totals.downtime + item.downtime, capacity: totals.capacity + capacity, delayed: totals.delayed + Math.max(0,item.target-output) };
  }, { target:0, actual:0, rejected:0, downtime:0, capacity:0, delayed:0 });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("factory-department-operations-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.isSampleData === "boolean") setDepartmentDataIsSample(parsed.isSampleData);
        if (Array.isArray(parsed.maintenanceRecords)) {
          setMaintenanceRecords(parsed.maintenanceRecords.filter(record => record && typeof record.id === "string" && typeof record.departmentId === "string" && initialDepartments.some(department => department.id === record.departmentId) && typeof record.asset === "string" && typeof record.status === "string").slice(0,100));
        }
        if (Array.isArray(parsed.departmentIssues)) {
          setDepartmentIssues(parsed.departmentIssues.filter(issue => issue && typeof issue.id === "string" && typeof issue.departmentId === "string" && initialDepartments.some(department => department.id === issue.departmentId) && typeof issue.title === "string" && typeof issue.status === "string").slice(0,100));
        }
        if (Array.isArray(parsed.productionHistory)) {
          setProductionHistory(parsed.productionHistory.filter(item =>
            item && typeof item.id === "string" && typeof item.savedAt === "string" &&
            Array.isArray(item.departments) && item.departments.length === initialDepartments.length
          ).slice(0,60));
        }
        if (Array.isArray(parsed.departments)) {
          const validById = new Map(parsed.departments.filter(item => item && typeof item.id === "string").map(item => [item.id, item]));
          setDepartments(initialDepartments.map(base => {
            const stored = validById.get(base.id);
            if (!stored) return base;
            const next = { ...base };
            ["cycleSeconds","target","actual","downtime","rejected","shiftHours","breakMinutes"].forEach(field => {
              const value = Number(stored[field]);
              if (Number.isFinite(value)) next[field] = value;
            });
            return next;
          }));
        }
        if (Array.isArray(parsed.trackedProducts)) {
          const validProducts = parsed.trackedProducts.filter(product =>
            product && typeof product.code === "string" && typeof product.createdAt === "string" &&
            Array.isArray(product.events) && product.events.length <= initialDepartments.length &&
            product.events.every((event,index) => event && event.departmentId === initialDepartments[index]?.id && typeof event.timestamp === "string")
          ).slice(0,100);
          setTrackedProducts(validProducts);
          if (typeof parsed.activeProductId === "string" && validProducts.some(product => product.code === parsed.activeProductId)) {
            setActiveProductId(parsed.activeProductId);
          } else if (validProducts[0]) {
            setActiveProductId(validProducts[0].code);
          }
        }
      }
    } catch {
      setDepartmentDataMessage("Could not read saved department data. Current sample values remain available.");
    } finally {
      setDepartmentDataReady(true);
    }
  }, []);

  useEffect(() => {
    if (!departmentDataReady) return;
    try {
      window.localStorage.setItem("factory-department-operations-v1", JSON.stringify({
        departments, trackedProducts, activeProductId, productionHistory, departmentIssues, maintenanceRecords, isSampleData: departmentDataIsSample, savedAt: new Date().toISOString()
      }));
      setDepartmentDataMessage("Saved on this device · department settings and product timestamps will remain after refresh.");
    } catch {
      setDepartmentDataMessage("Browser storage is unavailable or full. Export or record important production data separately.");
    }
  }, [departmentDataReady, departments, trackedProducts, activeProductId, productionHistory, departmentIssues, maintenanceRecords, departmentDataIsSample]);

  const saveProductionSnapshot = () => {
    const savedAt = new Date().toISOString();
    const snapshot = {
      id: savedAt + "-" + Math.random().toString(36).slice(2,8),
      savedAt,
      isSampleData: departmentDataIsSample,
      departments: departments.map(item => ({...item}))
    };
    setProductionHistory(current => [snapshot,...current].slice(0,60));
    setDepartmentDataMessage("Production snapshot saved for " + new Date(savedAt).toLocaleString("en-IN") + ".");
  };

  function exportProductionHistoryCsv() {
    if (!productionHistory.length) {
      setDepartmentDataMessage("No saved production history is available to export yet.");
      return;
    }
    const header = ["SnapshotAt","DataType","DepartmentId","Department","Unit","Target","Processed","GoodOutput","Rejected","YieldPercent","DowntimeMinutes","CycleTimeSeconds","ShiftHours","BreakMinutes"];
    const rows = productionHistory.flatMap(snapshot => snapshot.departments.map(department => {
      const good = Math.max(0,department.actual-department.rejected);
      const yieldRate = department.actual > 0 ? (good/department.actual*100).toFixed(1) : "0.0";
      return [snapshot.savedAt,snapshot.isSampleData?"Illustrative sample":"User entered",department.id,department.name,department.unit,department.target,department.actual,good,department.rejected,yieldRate,department.downtime,department.cycleSeconds,department.shiftHours,department.breakMinutes];
    }));
    const csv = [header,...rows].map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g,'""') + '"' : cell;
    }).join(",")).join("\\n");
    const url = URL.createObjectURL(new Blob(["\\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-daily-production-history.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setDepartmentDataMessage("Production history CSV prepared with " + productionHistory.length + " saved snapshot(s).");
  }

  const compareNewer = productionHistory.find(item => item.id === comparisonNewerId) || productionHistory[0] || null;
  const compareOlder = productionHistory.find(item => item.id === comparisonOlderId) || productionHistory[1] || null;
  const comparisonDepartments = compareNewer && compareOlder
    ? compareNewer.departments.map(current => {
        const previous = compareOlder.departments.find(item => item.id === current.id);
        const good = Math.max(0,current.actual-current.rejected);
        const oldGood = previous ? Math.max(0,previous.actual-previous.rejected) : 0;
        return { id:current.id,name:current.name,unit:current.unit,targetDelta:current.target-(previous?.target ?? 0),goodDelta:good-oldGood,rejectedDelta:current.rejected-(previous?.rejected ?? 0),downtimeDelta:current.downtime-(previous?.downtime ?? 0),yieldDelta:(current.actual>0?good/current.actual*100:0)-(previous?.actual>0?oldGood/previous.actual*100:0) };
      })
    : [];

  const addDepartmentIssue = event => {
    event.preventDefault();
    const title = issueDraft.title.trim();
    if (!title || !issueDraft.rootCause.trim() || !issueDraft.correctiveAction.trim() || !issueDraft.owner.trim() || !issueDraft.dueDate) {
      setDepartmentDataMessage("Complete the issue, root cause, corrective action, owner and due date before saving.");
      return;
    }
    const department = departments.find(item => item.id === issueDraft.departmentId);
    const issue = { ...issueDraft, title, rootCause: issueDraft.rootCause.trim(), correctiveAction: issueDraft.correctiveAction.trim(), owner: issueDraft.owner.trim(), id: "ISS-" + Date.now().toString(36).toUpperCase(), departmentName: department?.name || "", status: "Open", resolutionNotes: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setDepartmentIssues(current => [issue, ...current].slice(0,100));
    setIssueDraft(current => ({ ...current, title: "", rootCause: "", correctiveAction: "", owner: "", dueDate: "" }));
    setDepartmentDataMessage("Issue " + issue.id + " added to the department issue register.");
  };
  const updateDepartmentIssue = (id, changes) => setDepartmentIssues(current => current.map(issue => issue.id === id ? { ...issue, ...changes, updatedAt: new Date().toISOString() } : issue));
  function exportDepartmentIssuesCsv() {
    if (!departmentIssues.length) { setDepartmentDataMessage("No department issues are available to export."); return; }
    const columns = ["IssueId","Department","Issue","RootCause","CorrectiveAction","Owner","DueDate","Priority","Status","ResolutionNotes","CreatedAt","UpdatedAt"];
    const rows = departmentIssues.map(issue => [issue.id, issue.departmentName || departments.find(item => item.id === issue.departmentId)?.name || issue.departmentId, issue.title, issue.rootCause, issue.correctiveAction, issue.owner, issue.dueDate, issue.priority, issue.status, issue.resolutionNotes, issue.createdAt, issue.updatedAt]);
    const csv = [columns,...rows].map(row => row.map(value => { const cell = String(value ?? ""); return /[",\n]/.test(cell) ? '"' + cell.replace(/"/g,'""') + '"' : cell; }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a"); link.href = url; link.download = "factory-department-issue-register.csv"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setDepartmentDataMessage("Department issue register CSV prepared with " + departmentIssues.length + " record(s).");
  }

  const addMaintenanceRecord = event => {
    event.preventDefault();
    if (!maintenanceDraft.asset.trim() || !maintenanceDraft.serviceDescription.trim() || !maintenanceDraft.technician.trim() || !maintenanceDraft.lastServiceDate || !maintenanceDraft.nextServiceDate) {
      setDepartmentDataMessage("Complete the asset, service details, technician and both service dates before saving.");
      return;
    }
    if (maintenanceDraft.nextServiceDate < maintenanceDraft.lastServiceDate) {
      setDepartmentDataMessage("Next service date cannot be earlier than the last service date.");
      return;
    }
    const department = departments.find(item => item.id === maintenanceDraft.departmentId);
    const record = { ...maintenanceDraft, asset: maintenanceDraft.asset.trim(), serviceDescription: maintenanceDraft.serviceDescription.trim(), technician: maintenanceDraft.technician.trim(), id: "MNT-" + Date.now().toString(36).toUpperCase(), departmentName: department?.name || "", status: "Scheduled", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setMaintenanceRecords(current => [record, ...current].slice(0,100));
    setMaintenanceDraft(current => ({ ...current, asset: "", serviceDescription: "", technician: "", lastServiceDate: "", nextServiceDate: "" }));
    setDepartmentDataMessage("Maintenance record " + record.id + " added.");
  };
  const updateMaintenanceRecord = (id, changes) => setMaintenanceRecords(current => current.map(record => record.id === id ? { ...record, ...changes, updatedAt: new Date().toISOString() } : record));
  function exportMaintenanceCsv() {
    if (!maintenanceRecords.length) { setDepartmentDataMessage("No maintenance records are available to export."); return; }
    const columns = ["RecordId","Department","Asset","MaintenanceType","ServiceDescription","Technician","LastServiceDate","NextServiceDate","Priority","Status","CreatedAt","UpdatedAt"];
    const rows = maintenanceRecords.map(record => [record.id, record.departmentName || departments.find(item => item.id === record.departmentId)?.name || record.departmentId, record.asset, record.maintenanceType, record.serviceDescription, record.technician, record.lastServiceDate, record.nextServiceDate, record.priority, record.status, record.createdAt, record.updatedAt]);
    const csv = [columns,...rows].map(row => row.map(value => { const cell = String(value ?? ""); return cell.includes('"') || cell.includes(",") || cell.includes("\n") ? '"' + cell.replace(/"/g,'""') + '"' : cell; }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a"); link.href = url; link.download = "factory-maintenance-register.csv"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setDepartmentDataMessage("Maintenance CSV prepared with " + maintenanceRecords.length + " record(s).");
  }

  const restoreDepartmentSamples = () => {
    setDepartments(initialDepartments);
    setDepartmentDataIsSample(true);
    setTrackedProducts([]);
    setActiveProductId("");
    setProductCodeInput("");
    setDepartmentDataMessage("Illustrative department samples restored. Previous product tracking records were cleared from this browser.");
  };

  const departmentCsvInput = useRef(null);
  function downloadDepartmentClientReport() {
    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[char]);
    const isSample = departmentDataIsSample;
    const departmentRows = departments.map((department,index) => {
      const good = Math.max(0,department.actual-department.rejected);
      const capacity = department.cycleSeconds > 0 ? Math.floor(Math.max(0,department.shiftHours*3600-department.breakMinutes*60-department.downtime*60)/department.cycleSeconds) : 0;
      const yieldRate = department.actual > 0 ? (good/department.actual*100).toFixed(1) : "0.0";
      const gap = good-department.target;
      return "<tr><td>"+(index+1)+"</td><td>"+escapeHtml(department.name)+"</td><td>"+department.target.toLocaleString("en-IN")+"</td><td>"+department.actual.toLocaleString("en-IN")+"</td><td>"+good.toLocaleString("en-IN")+"</td><td>"+department.rejected.toLocaleString("en-IN")+"</td><td>"+yieldRate+"%</td><td>"+capacity.toLocaleString("en-IN")+"</td><td>"+escapeHtml(formatDuration(department.downtime*60))+"</td><td>"+(gap>0?"+":"")+gap.toLocaleString("en-IN")+"</td></tr>";
    }).join("");
    const traceRows = trackedProducts.length ? trackedProducts.flatMap(product => departments.map((department,index) => {
      const event = product.events[index];
      const previous = index===0 ? product.createdAt : product.events[index-1]?.timestamp;
      const elapsed = event && previous ? formatDuration(Math.max(0,Math.floor((new Date(event.timestamp)-new Date(previous))/1000))) : "—";
      return "<tr><td>"+escapeHtml(product.code)+"</td><td>"+escapeHtml(department.name)+"</td><td>"+(event?"Completed":index===product.events.length?"In progress":"Waiting")+"</td><td>"+(event?escapeHtml(new Date(event.timestamp).toLocaleString("en-IN")):"—")+"</td><td>"+elapsed+"</td></tr>";
    })).join("") : "<tr><td colspan='5'>No product traceability records were available when this report was generated.</td></tr>";
    const issueRows = departmentIssues.length ? departmentIssues.map(issue => "<tr><td>"+escapeHtml(issue.id)+"</td><td>"+escapeHtml(issue.departmentName || departments.find(item => item.id === issue.departmentId)?.name || issue.departmentId)+"</td><td>"+escapeHtml(issue.title)+"</td><td>"+escapeHtml(issue.rootCause)+"</td><td>"+escapeHtml(issue.correctiveAction)+"</td><td>"+escapeHtml(issue.owner)+"</td><td>"+escapeHtml(issue.dueDate)+"</td><td>"+escapeHtml(issue.priority)+"</td><td>"+escapeHtml(issue.status)+"</td><td>"+escapeHtml(issue.resolutionNotes)+"</td></tr>").join("") : "<tr><td colspan='10'>No department issues were recorded when this report was generated.</td></tr>";
    const maintenanceRows = maintenanceRecords.length ? maintenanceRecords.map(record => "<tr><td>"+escapeHtml(record.id)+"</td><td>"+escapeHtml(record.departmentName || departments.find(item => item.id === record.departmentId)?.name || record.departmentId)+"</td><td>"+escapeHtml(record.asset)+"</td><td>"+escapeHtml(record.maintenanceType)+"</td><td>"+escapeHtml(record.serviceDescription)+"</td><td>"+escapeHtml(record.technician)+"</td><td>"+escapeHtml(record.lastServiceDate)+"</td><td>"+escapeHtml(record.nextServiceDate)+"</td><td>"+escapeHtml(record.priority)+"</td><td>"+escapeHtml(record.status)+"</td></tr>").join("") : "<tr><td colspan='10'>No maintenance records were available when this report was generated.</td></tr>";
    const status = isSample ? "ILLUSTRATIVE SAMPLE DATA — NOT VERIFIED PLANT RESULTS" : "USER-ENTERED DATA — NOT INDEPENDENTLY VERIFIED";
    const warning = isSample ? "These department figures are illustrative samples. Replace them with verified shift records before presenting operational performance as actual results." : "The department figures were entered by the user and have not been independently verified.";
    const html = [
      "<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Factory Department Client Review</title>",
      "<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1d2c27;margin:0;background:#f3f6f4}.page{max-width:1250px;margin:28px auto;background:#fff;padding:34px}header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:2px solid #dfe8e3;padding-bottom:18px}.eyebrow{font-size:10px;letter-spacing:1.5px;color:#65776e;font-weight:700}h1{font-size:25px;margin:8px 0}.sub{font-size:12px;color:#65736c;line-height:1.5}.status{display:inline-block;margin-top:8px;padding:7px 10px;border-radius:5px;background:#fff3d7;color:#79551a;font-size:10px;font-weight:700}.actions button{border:0;border-radius:6px;padding:10px 14px;background:#174d43;color:#fff;font-weight:700;cursor:pointer}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.metric{border:1px solid #e0e8e3;border-radius:8px;padding:14px}.metric span{display:block;font-size:11px;color:#65736c}.metric strong{display:block;font-size:22px;margin-top:7px}.section{margin-top:24px}h2{font-size:16px;margin:0 0 10px}table{width:100%;border-collapse:collapse;font-size:10px;margin-top:12px}th,td{border:1px solid #dce5df;padding:8px 6px;text-align:left;vertical-align:top}th{background:#edf3ef;font-size:9px}.note{margin-top:18px;padding:13px;background:#fff8e8;border-left:3px solid #d89b27;color:#6b5429;font-size:11px;line-height:1.6}.foot{border-top:1px solid #e1e8e3;margin-top:22px;padding-top:12px;color:#738078;font-size:10px}@media(max-width:760px){.page{margin:0;padding:16px}.metrics{grid-template-columns:repeat(2,1fr)}header{display:block}.actions{margin-top:12px}table{font-size:9px}th,td{padding:5px 4px}}@media print{body{background:#fff}.page{max-width:none;margin:0;padding:8mm}.actions{display:none}thead{display:table-header-group}tr{break-inside:avoid}@page{size:A4 landscape;margin:8mm}}</style></head><body><main class='page'>",
      "<header><div><div class='eyebrow'>FACTORY OPERATIONS / CLIENT REVIEW</div><h1>Nine-Department Production Review</h1><p class='sub'>Daily target, actual output, quality yield, estimated capacity and downtime by department<br>Report generated: "+escapeHtml(new Date().toLocaleString("en-IN"))+"</p><span class='status'>"+status+"</span></div><div class='actions'><button onclick='window.print()'>Print / Save as PDF</button></div></header>",
      "<section class='metrics'><div class='metric'><span>Department target total*</span><strong>"+departmentTotals.target.toLocaleString("en-IN")+"</strong></div><div class='metric'><span>Good output total*</span><strong>"+departmentTotals.actual.toLocaleString("en-IN")+"</strong></div><div class='metric'><span>Rejected / rework records</span><strong>"+departmentTotals.rejected.toLocaleString("en-IN")+"</strong></div><div class='metric'><span>Recorded department downtime</span><strong>"+escapeHtml(formatDuration(departmentTotals.downtime*60))+"</strong></div></section>",
      "<section class='section'><h2>Department-by-department performance</h2><table><thead><tr><th>#</th><th>Department</th><th>Target</th><th>Processed</th><th>Good output</th><th>Rejected</th><th>Yield</th><th>Estimated capacity</th><th>Downtime</th><th>Gap</th></tr></thead><tbody>"+departmentRows+"</tbody></table><p class='sub'>*Department totals combine different units and process stages. They are workload summaries, not unique finished-vehicle counts. Capacity is an estimate based on shift time less breaks and downtime divided by entered cycle time.</p></section>",
      "<section class='section'><h2>Department issue register</h2><p class='sub'>Recorded production issues, causes, corrective actions, owners and closure status.</p><table><thead><tr><th>Issue ID</th><th>Department</th><th>Issue</th><th>Root cause</th><th>Corrective action</th><th>Owner</th><th>Due date</th><th>Priority</th><th>Status</th><th>Resolution notes</th></tr></thead><tbody>"+issueRows+"</tbody></table></section>",
      "<section class='section'><h2>Equipment maintenance register</h2><p class='sub'>Preventive and breakdown maintenance history, assigned technicians and upcoming service dates.</p><table><thead><tr><th>Record ID</th><th>Department</th><th>Equipment / asset</th><th>Type</th><th>Service details</th><th>Technician</th><th>Last service</th><th>Next service</th><th>Priority</th><th>Status</th></tr></thead><tbody>"+maintenanceRows+"</tbody></table></section>",
      "<section class='section'><h2>Product and chassis traceability</h2><p class='sub'>Operator-recorded department completion timestamps and elapsed time between stages.</p><table><thead><tr><th>Product / chassis / batch ID</th><th>Department</th><th>Status</th><th>Completion timestamp</th><th>Stage elapsed time</th></tr></thead><tbody>"+traceRows+"</tbody></table></section>",
      "<div class='note'><b>Data quality and limitations:</b> "+warning+" Product timestamps are recorded manually when an operator selects “Record completion”; this prototype is not connected to machine controllers, barcode scanners or an ERP/MES system. Confirm reporting date, shift, units and source records with the factory data owner before client sign-off.</div>",
      "<div class='foot'>Prepared from the current browser dashboard data · "+escapeHtml(new Date().toLocaleDateString("en-IN"))+"</div></main></body></html>"
    ].join("");
    const url = URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-nine-department-client-review.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setDepartmentDataMessage("Nine-department client review report prepared with current production and product traceability records.");
  }

  function exportProductTraceabilityCsv() {
    if (!trackedProducts.length) {
      setDepartmentDataMessage("No product traceability records are available to export yet.");
      return;
    }
    const columns = ["ProductId","ProductStartedAt","DepartmentOrder","DepartmentId","Department","StageStatus","StageCompletedAt","StageElapsedSeconds","ProductElapsedSeconds","ExportedAt"];
    const exportedAt = new Date().toISOString();
    const rows = trackedProducts.flatMap(product => departments.map((department,index) => {
      const event = product.events[index];
      const previous = index === 0 ? product.createdAt : product.events[index-1]?.timestamp;
      const stageElapsed = event && previous ? Math.max(0,Math.floor((new Date(event.timestamp)-new Date(previous))/1000)) : "";
      const productElapsed = Math.max(0,Math.floor(((event ? new Date(event.timestamp) : dashboardNow)-new Date(product.createdAt))/1000));
      return [product.code,product.createdAt,index+1,department.id,department.name,event?"Completed":index===product.events.length?"In progress":"Waiting",event?.timestamp || "",stageElapsed,productElapsed,exportedAt];
    }));
    const csv = [columns,...rows].map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\n]/.test(cell) ? '"' + cell.replace(/"/g,'""') + '"' : cell;
    }).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-product-traceability.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setDepartmentDataMessage("Exported " + trackedProducts.length + " product journey record(s), including department timestamps and elapsed times.");
  }

  function exportDepartmentCsv() {
    const columns = ["DepartmentId","Department","Target","Actual","Rejected","CycleTimeSeconds","DowntimeMinutes","ShiftHours","BreakMinutes"];
    const rows = departments.map(item => [item.id,item.name,item.target,item.actual,item.rejected,item.cycleSeconds,item.downtime,item.shiftHours,item.breakMinutes]);
    const csv = [columns,...rows].map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\n]/.test(cell) ? '"' + cell.replace(/"/g,'""') + '"' : cell;
    }).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-department-production.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setDepartmentDataMessage("Exported all nine department settings and daily figures to CSV.");
  }

  async function importDepartmentCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100 * 1024) throw new Error("CSV is too large. Please upload a file smaller than 100 KB.");
      const source = (await file.text()).replace(/^\uFEFF/,"");
      const rows = [];
      let row = [], cell = "", quoted = false;
      for (let index=0; index<source.length; index++) {
        const char = source[index];
        if (quoted) {
          if (char === '"' && source[index+1] === '"') { cell += '"'; index++; }
          else if (char === '"') quoted = false;
          else cell += char;
        } else if (char === '"' && cell === "") quoted = true;
        else if (char === ",") { row.push(cell.trim()); cell = ""; }
        else if (char === "\n" || char === "\r") {
          if (char === "\r" && source[index+1] === "\n") index++;
          row.push(cell.trim()); cell = "";
          if (row.some(value => value !== "")) rows.push(row);
          row = [];
        } else cell += char;
      }
      if (quoted) throw new Error("CSV contains an unclosed quoted value.");
      row.push(cell.trim());
      if (row.some(value => value !== "")) rows.push(row);
      if (rows.length < 2) throw new Error("CSV must contain a header and at least one department row.");
      const headers = rows[0].map(value => value.replace(/^\uFEFF/,"").trim());
      const required = ["DepartmentId","Target","Actual","Rejected","CycleTimeSeconds","DowntimeMinutes","ShiftHours","BreakMinutes"];
      const positions = Object.fromEntries(required.map(name => [name,headers.indexOf(name)]));
      const missing = required.filter(name => positions[name] < 0);
      if (missing.length) throw new Error("Missing required CSV columns: " + missing.join(", "));
      const limits = {Target:[0,100000],Actual:[0,100000],Rejected:[0,100000],CycleTimeSeconds:[1,3600],DowntimeMinutes:[0,720],ShiftHours:[1,24],BreakMinutes:[0,300]};
      const importedById = new Map();
      rows.slice(1).forEach((values,index) => {
        const id = values[positions.DepartmentId];
        if (!initialDepartments.some(item => item.id === id)) throw new Error("Row " + (index+2) + " has an unknown DepartmentId: " + (id || "(blank)"));
        if (importedById.has(id)) throw new Error("Department " + id + " appears more than once.");
        const fields = {};
        Object.entries(limits).forEach(([field,[min,max]]) => {
          const raw = values[positions[field]];
          const number = Number(raw);
          if (raw === "" || !Number.isFinite(number) || number < min || number > max) {
            throw new Error("Row " + (index+2) + ": " + field + " must be between " + min + " and " + max + ".");
          }
          fields[({Target:"target",Actual:"actual",Rejected:"rejected",CycleTimeSeconds:"cycleSeconds",DowntimeMinutes:"downtime",ShiftHours:"shiftHours",BreakMinutes:"breakMinutes"})[field]] = number;
        });
        importedById.set(id,fields);
      });
      setDepartments(current => current.map(item => importedById.has(item.id) ? {...item,...importedById.get(item.id)} : item));
      setDepartmentDataIsSample(false);
      setDepartmentDataMessage("Imported " + importedById.size + " department row(s) from " + file.name + ". Departments omitted from the CSV kept their existing values.");
    } catch (error) {
      setDepartmentDataMessage(error.message || "Could not import department CSV. Existing values were not changed.");
    } finally {
      event.target.value = "";
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => setDashboardNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { setMount(document.getElementById("lineSimulatorMount")); }, []);
  const [stations, setStations] = useState(initialStations);
  const [weeklyProduction, setWeeklyProduction] = useState(initialWeeklyProduction);
  const [stationPerformance, setStationPerformance] = useState(initialStationPerformance);
  const [stationDataMessage, setStationDataMessage] = useState("Illustrative station-level sample · upload a station CSV to replace it.");
  const [improvementActions, setImprovementActions] = useState(() => buildImprovementActions(initialStationPerformance));
  const [actionExportMessage, setActionExportMessage] = useState("");
  useEffect(() => { setImprovementActions(buildImprovementActions(stationPerformance)); setActionExportMessage(""); }, [stationPerformance]);
  const stationCsvInput = useRef(null);
  const [selectedProductionDay, setSelectedProductionDay] = useState("Monday");
  const [weeklyDataMessage, setWeeklyDataMessage] = useState("Illustrative sample data · replace with your own weekly CSV when available.");
  const weeklyCsvInput = useRef(null);
  const [shiftHours, setShiftHours] = useState(8);
  const [breakMinutes, setBreakMinutes] = useState(40);
  const [availability, setAvailability] = useState(90);
  const [yieldRate, setYieldRate] = useState(97);
  const [target, setTarget] = useState(350);
  const [chartEditMode, setChartEditMode] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [showImprovementPlanner, setShowImprovementPlanner] = useState(false);
  const [proposedCycleTimes, setProposedCycleTimes] = useState(initialStations.map(station => station.seconds));
  const [savedScenario, setSavedScenario] = useState(null);
  const [scenarioLibrary, setScenarioLibrary] = useState([]);
  const [scenarioLibraryReady, setScenarioLibraryReady] = useState(false);
  const [pinnedScenarioName, setPinnedScenarioName] = useState("");
  const [selectedScenarioNames, setSelectedScenarioNames] = useState([]);
  const [scenarioName, setScenarioName] = useState("Baseline improvement");
  const [scenarioSearch, setScenarioSearch] = useState("");
  const [scenarioSort, setScenarioSort] = useState("recent");
  const [scenarioBaselineFilter, setScenarioBaselineFilter] = useState("all");
  const [renamingScenario, setRenamingScenario] = useState("");
  const [renameScenarioValue, setRenameScenarioValue] = useState("");
  const [pendingDeleteScenario, setPendingDeleteScenario] = useState("");
  const [scenarioStorageReady, setScenarioStorageReady] = useState(false);
  const [scenarioSaveMessage, setScenarioSaveMessage] = useState("");
  const scenarioFileInput = useRef(null);
  const scenarioLibraryFileInput = useRef(null);

  useEffect(() => {
    try {
      setPinnedScenarioName(window.localStorage.getItem("factory-improvement-pinned-scenario") || "");
    } catch {
      // Pinning is optional when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      const rawLibrary = window.localStorage.getItem("factory-improvement-scenarios");
      if (rawLibrary) {
        const parsedLibrary = JSON.parse(rawLibrary);
        if (Array.isArray(parsedLibrary)) {
          const validEntries = parsedLibrary
            .filter(item => {
              if (!item || typeof item.name !== "string" || !item.name.trim() ||
                item.name.trim().length > 48 || !isValidSavedScenario(item.snapshot)) return false;
              const version = item.snapshot.version ?? 1;
              if (version === 1) return item.snapshot.stationNames === undefined;
              return version === 2 &&
                Array.isArray(item.snapshot.stationNames) &&
                item.snapshot.stationNames.length === initialStations.length &&
                item.snapshot.stationNames.every((name, index) => name === initialStations[index].name);
            })
            .map(item => ({
              ...item,
              name: item.name.trim(),
              snapshot: item.snapshot.version === 2
                ? item.snapshot
                : { ...item.snapshot, version: 2, stationNames: initialStations.map(station => station.name) }
            }));
          const uniqueEntries = new Map();
          validEntries.forEach(item => uniqueEntries.set(item.name.toLowerCase(), item));
          const normalized = [...uniqueEntries.values()].slice(-10);
          setScenarioLibrary(normalized);
          if (JSON.stringify(parsedLibrary) !== JSON.stringify(normalized)) {
            try {
              window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(normalized));
              if (validEntries.length !== uniqueEntries.size) {
                setScenarioSaveMessage("Cleaned duplicate scenario names in the saved library. The most recently stored entry for each name was kept.");
              }
            } catch {
              setScenarioSaveMessage("Loaded valid scenarios, but could not clean the saved library in browser storage.");
            }
          }
        }
      }
    } catch {
      // Named scenario library is optional when browser storage is unavailable.
    } finally {
      setScenarioLibraryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!scenarioLibraryReady || !pinnedScenarioName || scenarioLibrary.some(item => item.name === pinnedScenarioName)) return;
    try {
      window.localStorage.removeItem("factory-improvement-pinned-scenario");
    } catch {
      // The stale pin is ignored even if browser storage cannot be updated.
    }
    setPinnedScenarioName("");
    setScenarioSaveMessage("The saved baseline no longer exists in the scenario library, so its pin was cleared.");
  }, [scenarioLibraryReady, scenarioLibrary, pinnedScenarioName]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("factory-improvement-scenario");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidSavedScenario(parsed)) {
          setSavedScenario(parsed);
        } else {
          setScenarioSaveMessage("A saved scenario was found but its data is incomplete or invalid. Save a new scenario to replace it.");
        }
      }
    } catch {
      // Keep scenario saving optional when browser storage is unavailable.
    }
    setScenarioStorageReady(true);
  }, []);

  function saveImprovementScenario() {
    const snapshot = {
      cycleTimes: proposedCycleTimes,
      target,
      shiftHours,
      breakMinutes,
      availability,
      yieldRate,
      savedAt: new Date().toISOString()
    };
    try {
      window.localStorage.setItem("factory-improvement-scenario", JSON.stringify(snapshot));
      setSavedScenario(snapshot);
      setScenarioSaveMessage("Scenario saved on this device. It will be available in this browser.");
    } catch {
      setScenarioSaveMessage("Could not save this scenario. Browser storage may be disabled or unavailable.");
    }
  }

  function saveNamedScenario() {
    const name = scenarioName.trim();
    if (!name) {
      setScenarioSaveMessage("Enter a name before saving this scenario.");
      return;
    }
    if (name.length > 48) {
      setScenarioSaveMessage("Scenario names must be 48 characters or fewer.");
      return;
    }
    const existing = scenarioLibrary.some(item => item.name.toLowerCase() === name.toLowerCase());
    if (!existing && scenarioLibrary.length >= 10) {
      setScenarioSaveMessage("The scenario library is full (10 of 10). Delete an existing scenario before saving a new one, or use the same name to update it.");
      return;
    }
    const snapshot = { version: 2, stationNames: initialStations.map(station => station.name), cycleTimes: [...proposedCycleTimes], target, shiftHours, breakMinutes, availability, yieldRate, savedAt: new Date().toISOString() };
    const next = [...scenarioLibrary.filter(item => item.name.toLowerCase() !== name.toLowerCase()), { name, snapshot }];
    try {
      window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
      setScenarioLibrary(next);
      setScenarioSaveMessage(existing ? `“${name}” updated in the named scenario library.` : `“${name}” saved to the named scenario library on this device.`);
    } catch {
      setScenarioSaveMessage("Could not save the named scenario. Browser storage may be unavailable.");
    }
  }

  async function copyVisibleScenarioSummary() {
    if (visibleScenarioLibrary.length === 0) {
      setScenarioSaveMessage("No visible scenarios to copy. Clear the search or save a scenario first.");
      return;
    }
    const projections = visibleScenarioLibrary.map(item => ({ item, projection: getScenarioProjection(item.snapshot) }));
    const averageAttainment = projections.reduce((total, entry) => total + entry.projection.attainmentPercent, 0) / projections.length;
    const onTarget = projections.filter(entry => entry.projection.gap >= 0).length;
    const lines = [
      "Factory saved scenario overview",
      `Scenarios included: ${projections.length}`,
      `Average target attainment: ${averageAttainment.toFixed(1)}%`,
      `Meeting target: ${onTarget} / ${projections.length}`,
      `Below target: ${projections.length - onTarget}`,
      ...(pinnedScenarioProjection ? (() => {
        const comparisons = projections.filter(entry => entry.item.name !== pinnedScenarioName).map(entry => {
          const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate"]
            .every(key => entry.item.snapshot[key] === pinnedScenario.snapshot[key]);
          const normalized = getScenarioProjection({
            ...entry.item.snapshot,
            shiftHours: pinnedScenario.snapshot.shiftHours,
            breakMinutes: pinnedScenario.snapshot.breakMinutes,
            availability: pinnedScenario.snapshot.availability,
            yieldRate: pinnedScenario.snapshot.yieldRate
          });
          return { ...entry, sameAssumptions, normalizedDelta: normalized.good - pinnedScenarioProjection.good };
        });
        const fair = comparisons.filter(entry => entry.sameAssumptions);
        const above = fair.filter(entry => entry.projection.good > pinnedScenarioProjection.good).length;
        const averageDelta = fair.length
          ? fair.reduce((total, entry) => total + entry.projection.good - pinnedScenarioProjection.good, 0) / fair.length
          : null;
        return [
          `Pinned baseline: ${pinnedScenario.name} (${pinnedScenarioProjection.good} good vehicles/shift)`,
          `Outperforming baseline (like-for-like): ${above} / ${fair.length}`,
          `Average output difference (like-for-like): ${averageDelta === null ? "N/A — no matching assumptions" : `${averageDelta > 0 ? "+" : ""}${averageDelta.toFixed(1)} vehicles/shift`}`,
          `Scenarios with different assumptions: ${comparisons.length - fair.length} (excluded from fair average)`,
          ...comparisons.filter(entry => !entry.sameAssumptions).map(entry => `Normalized cycle-only difference — ${entry.item.name}: ${entry.normalizedDelta > 0 ? "+" : ""}${entry.normalizedDelta} vehicles/shift under baseline assumptions`)
        ];
      })() : ["Pinned baseline: none"]),
      "",
      "Scenario details",
      ...projections.map(({ item, projection }) => `${item.name}: ${projection.good} good vehicles/shift; target ${item.snapshot.target}; attainment ${projection.attainmentPercent.toFixed(1)}%; ${projection.gap >= 0 ? `${projection.gap} above target` : `${Math.abs(projection.gap)} below target`}; bottleneck ${projection.bottleneckName} (${projection.bottleneck}s)`)
    ].join("\n");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(lines);
      setScenarioSaveMessage(`Copied overview for ${projections.length} visible scenario(s).`);
    } catch {
      setScenarioSaveMessage("Could not copy automatically. Use Export library CSV or JSON instead.");
    }
  }

  function exportScenarioLibraryCsv() {
    if (scenarioLibrary.length === 0) {
      setScenarioSaveMessage("There are no named scenarios to export.");
      return;
    }
    const baselineProjection = pinnedScenario ? getScenarioProjection(pinnedScenario.snapshot) : null;
    const sameProductionAssumptions = (left, right) =>
      left.shiftHours === right.shiftHours &&
      left.breakMinutes === right.breakMinutes &&
      left.availability === right.availability &&
      left.yieldRate === right.yieldRate;
    const rows = [
      ["Factory scenario library comparison"],
      ["Pinned baseline", pinnedScenario?.name || "None", "Baseline output (good vehicles / shift)", baselineProjection?.good ?? "N/A"],
      ["Scenario", "Saved at", "Good vehicles / shift", "Target", "Target attainment (%)", "Vehicles above / below target", "Target status", "Bottleneck station", "Bottleneck cycle (sec)", "Shift hours", "Break minutes", "Availability (%)", "Quality yield (%)", "Baseline output delta (vehicles / shift)", "Baseline comparison", "Production assumptions match baseline", ...initialStations.map(station => station.name + " cycle (sec)")],
      ...scenarioLibrary.map(item => {
        const projection = getScenarioProjection(item.snapshot);
        const isBaseline = item.name === pinnedScenarioName && baselineProjection;
        const assumptionsMatch = baselineProjection && sameProductionAssumptions(item.snapshot, pinnedScenario.snapshot);
        const baselineDelta = baselineProjection ? projection.good - baselineProjection.good : "";
        return [
          item.name,
          item.snapshot.savedAt,
          projection.good,
          item.snapshot.target,
          Number(projection.attainmentPercent.toFixed(1)),
          projection.gap,
          projection.gap >= 0 ? "Target achieved" : "Below target",
          projection.bottleneckName,
          projection.bottleneck,
          item.snapshot.shiftHours,
          item.snapshot.breakMinutes,
          item.snapshot.availability,
          item.snapshot.yieldRate,
          baselineDelta,
          !baselineProjection ? "No pinned baseline" : isBaseline ? "Pinned baseline" : baselineDelta > 0 ? "Above baseline" : baselineDelta < 0 ? "Below baseline" : "Equal output",
          !baselineProjection ? "N/A" : assumptionsMatch ? "Yes" : "No",
          ...item.snapshot.cycleTimes
        ];
      })
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-scenario-library.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(pinnedScenario ? "Exported all named scenarios with pinned-baseline output deltas and an assumptions-match check to CSV." : "Exported all named scenarios. Pin a baseline to include baseline comparison columns.");
  }

  function exportScenarioLibraryJson() {
    const payload = { version: 1, type: "factory-scenario-library", exportedAt: new Date().toISOString(), pinnedBaselineName: pinnedScenarioName || null, scenarios: scenarioLibrary };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-scenario-library.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage("Named scenario library exported. Keep this JSON file as a backup or import it in another browser.");
  }

  async function importScenarioLibraryJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100 * 1024) throw new Error("Library file is too large");
      const parsed = JSON.parse(await file.text());
      if (parsed?.version !== 1 || parsed?.type !== "factory-scenario-library" || !Array.isArray(parsed.scenarios)) throw new Error("Unsupported library format");
      const validEntries = parsed.scenarios
        .filter(item => {
          if (!item || typeof item.name !== "string" || !item.name.trim() || item.name.trim().length > 48 || !isValidSavedScenario(item.snapshot)) return false;
          const snapshotVersion = item.snapshot.version ?? 1;
          if (snapshotVersion === 1) return item.snapshot.stationNames === undefined;
          return snapshotVersion === 2 &&
            Array.isArray(item.snapshot.stationNames) &&
            item.snapshot.stationNames.length === initialStations.length &&
            item.snapshot.stationNames.every((name, index) => name === initialStations[index].name);
        })
        .map(item => ({
          name: item.name.trim(),
          snapshot: item.snapshot.version === 2
            ? item.snapshot
            : { ...item.snapshot, version: 2, stationNames: initialStations.map(station => station.name) }
        }));
      const invalidCount = parsed.scenarios.length - validEntries.length;
      const uniqueEntries = new Map();
      validEntries.forEach(item => uniqueEntries.set(item.name.toLowerCase(), item));
      const duplicateCount = validEntries.length - uniqueEntries.size;
      const valid = [...uniqueEntries.values()];
      if (valid.length === 0) throw new Error("No valid scenarios found");
      const merged = [...scenarioLibrary];
      valid.forEach(item => { const index = merged.findIndex(entry => entry.name.toLowerCase() === item.name.toLowerCase()); if (index >= 0) merged[index] = item; else merged.push(item); });
      if (merged.length > 10) {
        setScenarioSaveMessage(`Import would create ${merged.length} named scenarios, but the library limit is 10. Delete ${merged.length - 10} existing scenario(s), then import again.`);
        return;
      }
      const next = merged;
      const hasPinnedBaselineField = Object.prototype.hasOwnProperty.call(parsed, "pinnedBaselineName");
      const importedPinEntry = typeof parsed.pinnedBaselineName === "string"
        ? valid.find(item => item.name.toLowerCase() === parsed.pinnedBaselineName.trim().toLowerCase())
        : null;
      const importedPin = importedPinEntry
        ? next.find(item => item.name.toLowerCase() === importedPinEntry.name.toLowerCase())
        : null;
      const previousLibrary = window.localStorage.getItem("factory-improvement-scenarios");
      const previousPin = window.localStorage.getItem("factory-improvement-pinned-scenario");
      try {
        window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
        if (hasPinnedBaselineField) {
          if (importedPin) window.localStorage.setItem("factory-improvement-pinned-scenario", importedPin.name);
          else window.localStorage.removeItem("factory-improvement-pinned-scenario");
        }
      } catch (storageError) {
        try {
          if (previousLibrary === null) window.localStorage.removeItem("factory-improvement-scenarios");
          else window.localStorage.setItem("factory-improvement-scenarios", previousLibrary);
          if (previousPin === null) window.localStorage.removeItem("factory-improvement-pinned-scenario");
          else window.localStorage.setItem("factory-improvement-pinned-scenario", previousPin);
        } catch {
          // Best-effort rollback if browser storage becomes unavailable mid-import.
        }
        throw storageError;
      }
      setScenarioLibrary(next);
      setSelectedScenarioNames(current => current.filter(name => next.some(item => item.name === name)));
      if (hasPinnedBaselineField) setPinnedScenarioName(importedPin?.name || "");
      const pinNotice = typeof parsed.pinnedBaselineName === "string" && !importedPin
        ? " The backup's pinned baseline was not restored because that scenario was not valid in the imported file; the previous pin was cleared."
        : importedPin ? ` “${importedPin.name}” was restored as the pinned baseline.`
        : hasPinnedBaselineField ? " The backup contained no pinned baseline, so the previous pin was cleared." : "";
      const importDetails = [`Imported ${valid.length} unique scenario(s)`, duplicateCount ? `${duplicateCount} duplicate name(s) consolidated (last entry kept)` : "", invalidCount ? `${invalidCount} invalid entr${invalidCount === 1 ? "y" : "ies"} skipped` : ""].filter(Boolean).join(". ");
      setScenarioSaveMessage(importDetails + ". Matching names were updated; no existing scenarios were removed." + pinNotice);
    } catch {
      setScenarioSaveMessage("Library import failed. Choose a valid scenario-library JSON exported by this planner; files must match the current station layout.");
    } finally { event.target.value = ""; }
  }

  function toggleScenarioComparison(name, checked) {
    setSelectedScenarioNames(current => {
      if (!checked) return current.filter(item => item !== name);
      if (current.length >= 2) return [current[1], name];
      return [...current, name];
    });
  }

  async function copyNamedScenarioSummary(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be copied.");
      return;
    }
    const snapshot = item.snapshot;
    const projection = getScenarioProjection(snapshot);
    const lines = [
      "Factory improvement scenario",
      `Scenario: ${item.name}`,
      `Saved: ${new Date(snapshot.savedAt).toLocaleString()}`,
      `Projected good output: ${projection.good} vehicles / shift`,
      `Shift target: ${snapshot.target} vehicles / shift`,
      `Target status: ${projection.gap >= 0 ? "Achieved" : "Below target"}`,
      `Target attainment: ${projection.attainmentPercent.toFixed(1)}%`,
      `Target gap: ${projection.gap > 0 ? "+" : ""}${projection.gap} vehicles`,
      `Bottleneck: ${projection.bottleneckName} (${projection.bottleneck}s)`,
      `Shift assumptions: ${snapshot.shiftHours}h; breaks ${snapshot.breakMinutes} min; availability ${snapshot.availability}%; quality yield ${snapshot.yieldRate}%`,
      "",
      "Station cycle times",
      ...initialStations.map((station, index) => `${station.name}: ${snapshot.cycleTimes[index]} seconds`),
      "",
      "Planning estimate only. Validate against actual factory production data."
    ].join("\\n");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(lines);
      setScenarioSaveMessage(`Copied “${item.name}” summary. You can paste it into a report or message.`);
    } catch {
      setScenarioSaveMessage("Could not copy automatically. Use Export Markdown, CSV or report instead.");
    }
  }

  function exportNamedScenarioJson(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be exported.");
      return;
    }
    const blob = new Blob([JSON.stringify(item.snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "factory-scenario";
    link.href = url;
    link.download = `${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported “${item.name}” as an individual scenario JSON. You can import it using Import JSON.`);
  }

  function exportNamedScenarioCsv(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be exported.");
      return;
    }
    const snapshot = item.snapshot;
    const projection = getScenarioProjection(snapshot);
    const netMinutes = Math.max(0, snapshot.shiftHours * 60 - snapshot.breakMinutes);
    const idealCapacity = projection.bottleneck > 0 ? Math.floor(netMinutes * 60 / projection.bottleneck) : 0;
    const availableCapacity = Math.floor(idealCapacity * snapshot.availability / 100);
    const requiredAvailable = snapshot.target > 0 && snapshot.yieldRate > 0
      ? Math.ceil(snapshot.target / (snapshot.yieldRate / 100)) : 0;
    const requiredIdeal = requiredAvailable > 0 && snapshot.availability > 0
      ? Math.ceil(requiredAvailable / (snapshot.availability / 100)) : 0;
    const requiredCycle = requiredIdeal > 0 ? Math.floor(netMinutes * 60 / requiredIdeal) : 0;
    const targetFeasible = snapshot.target === 0 || (requiredCycle >= 20 && snapshot.availability > 0 && snapshot.yieldRate > 0);
    const rows = [
      ["Factory improvement scenario", item.name],
      ["Saved at", snapshot.savedAt],
      ["Good vehicles / shift", projection.good],
      ["Ideal capacity (vehicles / shift)", idealCapacity],
      ["Available capacity (vehicles / shift)", availableCapacity],
      ["Net production time (minutes)", netMinutes],
      ["Target", snapshot.target],
      ["Target attainment (%)", Number(projection.attainmentPercent.toFixed(1))],
      ["Target takt before losses (seconds)", snapshot.target > 0 ? Number((netMinutes * 60 / snapshot.target).toFixed(1)) : "N/A"],
      ["Required cycle after availability and quality losses (seconds)", snapshot.target > 0 && targetFeasible ? requiredCycle : "Not feasible / no target"],
      ["Target pace feasibility", snapshot.target === 0 ? "No target selected" : targetFeasible ? "Feasible within 20-second minimum" : "Not feasible within 20-second minimum"],
      ["Vehicles above / below target", projection.gap],
      ["Target status", projection.gap >= 0 ? "Target achieved" : "Below target"],
      ["Bottleneck station", projection.bottleneckName],
      ["Bottleneck cycle (sec)", projection.bottleneck],
      ["Shift hours", item.snapshot.shiftHours],
      ["Break minutes", item.snapshot.breakMinutes],
      ["Availability (%)", item.snapshot.availability],
      ["Quality yield (%)", item.snapshot.yieldRate],
      [],
      ["Station", "Cycle time (seconds)"],
      ...initialStations.map((station, index) => [station.name, item.snapshot.cycleTimes[index]])
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "factory-scenario";
    link.href = url;
    link.download = `${safeName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported “${item.name}” with production assumptions and all station cycle times as CSV.`);
  }



  function exportNamedScenarioMarkdown(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be exported.");
      return;
    }
    const snapshot = item.snapshot;
    const projection = getScenarioProjection(snapshot);
    const netMinutes = Math.max(0, snapshot.shiftHours * 60 - snapshot.breakMinutes);
    const idealCapacity = projection.bottleneck > 0 ? Math.floor(netMinutes * 60 / projection.bottleneck) : 0;
    const availableCapacity = Math.floor(idealCapacity * snapshot.availability / 100);
    const requiredAvailable = snapshot.target > 0 && snapshot.yieldRate > 0 ? Math.ceil(snapshot.target / (snapshot.yieldRate / 100)) : 0;
    const requiredIdeal = requiredAvailable > 0 && snapshot.availability > 0 ? Math.ceil(requiredAvailable / (snapshot.availability / 100)) : 0;
    const requiredCycle = requiredIdeal > 0 ? Math.floor(netMinutes * 60 / requiredIdeal) : 0;
    const targetFeasible = snapshot.target === 0 || (requiredCycle >= 20 && snapshot.availability > 0 && snapshot.yieldRate > 0);
    const safeCell = value => String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    const rows = initialStations.map((station, index) =>
      `| ${safeCell(station.name)} | ${snapshot.cycleTimes[index]} s |`
    );
    const markdown = [
      `# ${safeCell(item.name)}`,
      "",
      `- Report type: Factory improvement scenario`,
      `- Saved: ${new Date(snapshot.savedAt).toLocaleString()}`,
      "",
      "## Production projection",
      "",
      `- Good vehicles per shift: **${projection.good.toLocaleString("en-IN")}**`,
      `- Shift target: **${snapshot.target.toLocaleString("en-IN")}**`,
      `- Target status: **${projection.gap >= 0 ? "Achieved" : "Below target"}**`,
      `- Target attainment: **${projection.attainmentPercent.toFixed(1)}%**`,
      `- Target gap: **${projection.gap > 0 ? "+" : ""}${projection.gap} vehicles**`,
      `- Ideal capacity: **${idealCapacity} vehicles**`,
      `- Available capacity: **${availableCapacity} vehicles**`,
      `- Net production time: **${netMinutes} minutes**`,
      `- Target takt before losses: **${snapshot.target > 0 ? (netMinutes * 60 / snapshot.target).toFixed(1) + " seconds" : "Not set"}**`,
      `- Required cycle after availability and quality losses: **${snapshot.target > 0 && targetFeasible ? requiredCycle + " seconds" : "Not feasible / no target"}**`,
      `- Target pace feasibility: **${snapshot.target === 0 ? "No target selected" : targetFeasible ? "Feasible within 20-second minimum" : "Not feasible within 20-second minimum"}**`,
      `- Bottleneck station: **${safeCell(projection.bottleneckName)}**`,
      `- Bottleneck cycle time: **${projection.bottleneck} seconds**`,
      "",
      "## Operating assumptions",
      "",
      "| Setting | Value |",
      "|---|---:|",
      `| Shift hours | ${snapshot.shiftHours} |`,
      `| Break minutes | ${snapshot.breakMinutes} |`,
      `| Availability | ${snapshot.availability}% |`,
      `| Quality yield | ${snapshot.yieldRate}% |`,
      "",
      "## Station cycle times",
      "",
      "| Station | Cycle time |",
      "|---|---:|",
      ...rows,
      "",
      "> Educational planning estimate only. Validate projections against actual factory production data before making operational decisions."
    ].join("\n");
    const blob = new Blob(["\uFEFF", markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "factory-scenario";
    link.href = url;
    link.download = `${safeName}-report.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported “${item.name}” as a Markdown scenario report.`);
  }

  function exportNamedScenarioHtml(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be exported.");
      return;
    }
    const snapshot = item.snapshot;
    const projection = getScenarioProjection(snapshot);
    const netMinutes = Math.max(0, snapshot.shiftHours * 60 - snapshot.breakMinutes);
    const idealCapacity = projection.bottleneck > 0 ? Math.floor(netMinutes * 60 / projection.bottleneck) : 0;
    const availableCapacity = Math.floor(idealCapacity * snapshot.availability / 100);
    const requiredAvailable = snapshot.target > 0 && snapshot.yieldRate > 0 ? Math.ceil(snapshot.target / (snapshot.yieldRate / 100)) : 0;
    const requiredIdeal = requiredAvailable > 0 && snapshot.availability > 0 ? Math.ceil(requiredAvailable / (snapshot.availability / 100)) : 0;
    const requiredCycle = requiredIdeal > 0 ? Math.floor(netMinutes * 60 / requiredIdeal) : 0;
    const targetFeasible = snapshot.target === 0 || (requiredCycle >= 20 && snapshot.availability > 0 && snapshot.yieldRate > 0);
    const escapeHtml = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const stationRows = initialStations.map((station, index) => `<tr><th scope="row">${escapeHtml(station.name)}</th><td>${snapshot.cycleTimes[index]} s</td></tr>`).join("");
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(item.name)} · Factory scenario</title>
<style>
:root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172b3a;background:#f4f7f8}
body{margin:0;padding:32px 16px}.report{max-width:820px;margin:auto;background:#fff;border:1px solid #dce5e8;border-radius:16px;padding:clamp(20px,4vw,40px);box-shadow:0 8px 28px #17334412}
h1{font-size:clamp(24px,4vw,34px);margin:0 0 8px;overflow-wrap:anywhere}h2{font-size:19px;margin:30px 0 12px;color:#245c62}
.meta,.notice{color:#526672;font-size:14px;line-height:1.6}.notice{padding:12px 14px;background:#f0f6f6;border-radius:9px;margin:18px 0}
.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.metric{border:1px solid #dce5e8;border-radius:12px;padding:16px}.metric span{display:block;color:#60727b;font-size:13px}.metric strong{display:block;font-size:25px;margin-top:6px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:11px 9px;border-bottom:1px solid #e5ecee}.print{border:0;background:#245c62;color:white;border-radius:8px;padding:10px 16px;font:inherit;cursor:pointer;margin:0 0 20px}
.table-wrap{overflow-x:auto}.foot{margin-top:28px;color:#667780;font-size:12px}
@media(max-width:600px){body{padding:12px 8px}.report{padding:18px 14px}.cards{grid-template-columns:1fr}}
@media print{body{padding:0;background:white}.report{border:0;box-shadow:none;max-width:none;padding:0}.print{display:none}h2{break-after:avoid}tr{break-inside:avoid}}
</style></head><body><main class="report">
<button class="print" type="button" onclick="window.print()">Print report</button>
<h1>${escapeHtml(item.name)}</h1>
<p class="meta">Factory improvement scenario · Saved ${escapeHtml(new Date(snapshot.savedAt).toLocaleString())}</p>
<div class="notice">${projection.gap >= 0 ? `Target achieved: ${projection.gap} good vehicles above the shift target.` : `Projected output is ${Math.abs(projection.gap)} good vehicles below the shift target.`}</div>
<div class="cards">
<div class="metric"><span>Projected good vehicles / shift</span><strong>${projection.good.toLocaleString("en-IN")}</strong></div>
<div class="metric"><span>Production target / shift</span><strong>${snapshot.target.toLocaleString("en-IN")}</strong></div>
<div class="metric"><span>Target attainment</span><strong>${projection.attainmentPercent.toFixed(1)}%</strong></div>
<div class="metric"><span>Bottleneck station</span><strong style="font-size:19px">${escapeHtml(projection.bottleneckName)}</strong></div>
<div class="metric"><span>Bottleneck cycle time</span><strong>${projection.bottleneck} s</strong></div>
<div class="metric"><span>Ideal capacity</span><strong>${idealCapacity}</strong></div>
<div class="metric"><span>Available capacity</span><strong>${availableCapacity}</strong></div>
<div class="metric"><span>Net production time</span><strong>${netMinutes} min</strong></div>
<div class="metric"><span>Target takt before losses</span><strong>${snapshot.target > 0 ? (netMinutes * 60 / snapshot.target).toFixed(1) + " s" : "N/A"}</strong></div>
<div class="metric"><span>Required cycle after losses</span><strong style="font-size:19px">${snapshot.target > 0 && targetFeasible ? requiredCycle + " s" : "Not feasible"}</strong></div>
<div class="metric"><span>Target pace feasibility</span><strong style="font-size:17px">${snapshot.target === 0 ? "No target" : targetFeasible ? "Feasible" : "Not feasible"}</strong></div>
</div>
<h2>Operating assumptions</h2><div class="table-wrap"><table><tbody>
<tr><th>Shift hours</th><td>${snapshot.shiftHours}</td></tr><tr><th>Break minutes</th><td>${snapshot.breakMinutes}</td></tr>
<tr><th>Availability</th><td>${snapshot.availability}%</td></tr><tr><th>Quality yield</th><td>${snapshot.yieldRate}%</td></tr>
</tbody></table></div>
<h2>Station cycle times</h2><div class="table-wrap"><table><thead><tr><th>Station</th><th>Cycle time</th></tr></thead><tbody>${stationRows}</tbody></table></div>
<p class="foot">Educational planning estimate only. Validate projections against actual factory production data before making operational decisions.</p>
</main></body></html>`;
    const blob = new Blob(["\\uFEFF", html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "factory-scenario";
    link.href = url;
    link.download = `${safeName}-report.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported “${item.name}” as a standalone HTML scenario report.`);
  }

  function exportScenarioComparisonCsv(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before exporting their comparison.");
      return;
    }
    const firstProjection = getScenarioProjection(first.snapshot);
    const secondProjection = getScenarioProjection(second.snapshot);
    const normalizedFirst = getScenarioProjection({ ...first.snapshot, shiftHours: first.snapshot.shiftHours, breakMinutes: first.snapshot.breakMinutes, availability: first.snapshot.availability, yieldRate: first.snapshot.yieldRate, target: first.snapshot.target });
    const normalizedSecond = getScenarioProjection({ ...second.snapshot, shiftHours: first.snapshot.shiftHours, breakMinutes: first.snapshot.breakMinutes, availability: first.snapshot.availability, yieldRate: first.snapshot.yieldRate, target: first.snapshot.target });
    const rows = [
      ["Factory scenario comparison"],
      ["Metric", first.name, second.name, "Second minus first"],
      ["Good vehicles / shift", firstProjection.good, secondProjection.good, secondProjection.good - firstProjection.good],
      ["Target", first.snapshot.target, second.snapshot.target, second.snapshot.target - first.snapshot.target],
      ["Target gap", firstProjection.gap, secondProjection.gap, secondProjection.gap - firstProjection.gap],
      ["Target attainment (%)", Number(firstProjection.attainmentPercent.toFixed(1)), Number(secondProjection.attainmentPercent.toFixed(1)), Number((secondProjection.attainmentPercent - firstProjection.attainmentPercent).toFixed(1))],
      ["Ideal capacity (vehicles / shift)", getScenarioCapacityMetrics(first.snapshot, firstProjection).ideal, getScenarioCapacityMetrics(second.snapshot, secondProjection).ideal, getScenarioCapacityMetrics(second.snapshot, secondProjection).ideal - getScenarioCapacityMetrics(first.snapshot, firstProjection).ideal],
      ["Available capacity (vehicles / shift)", getScenarioCapacityMetrics(first.snapshot, firstProjection).available, getScenarioCapacityMetrics(second.snapshot, secondProjection).available, getScenarioCapacityMetrics(second.snapshot, secondProjection).available - getScenarioCapacityMetrics(first.snapshot, firstProjection).available],
      ["Net production time (minutes)", getScenarioCapacityMetrics(first.snapshot, firstProjection).netMinutes, getScenarioCapacityMetrics(second.snapshot, secondProjection).netMinutes, getScenarioCapacityMetrics(second.snapshot, secondProjection).netMinutes - getScenarioCapacityMetrics(first.snapshot, firstProjection).netMinutes],
      ["Required cycle after losses (seconds)", getScenarioCapacityMetrics(first.snapshot, firstProjection).feasible ? getScenarioCapacityMetrics(first.snapshot, firstProjection).requiredCycle : "Not feasible", getScenarioCapacityMetrics(second.snapshot, secondProjection).feasible ? getScenarioCapacityMetrics(second.snapshot, secondProjection).requiredCycle : "Not feasible", ""],
      ["Target pace feasibility", first.snapshot.target === 0 ? "No target" : getScenarioCapacityMetrics(first.snapshot, firstProjection).feasible ? "Feasible" : "Not feasible", second.snapshot.target === 0 ? "No target" : getScenarioCapacityMetrics(second.snapshot, secondProjection).feasible ? "Feasible" : "Not feasible", ""],
      ["Bottleneck station", firstProjection.bottleneckName, secondProjection.bottleneckName, ""],
      ["Bottleneck cycle (sec)", firstProjection.bottleneck, secondProjection.bottleneck, secondProjection.bottleneck - firstProjection.bottleneck],
      ["Shift hours", first.snapshot.shiftHours, second.snapshot.shiftHours, second.snapshot.shiftHours - first.snapshot.shiftHours],
      ["Break minutes", first.snapshot.breakMinutes, second.snapshot.breakMinutes, second.snapshot.breakMinutes - first.snapshot.breakMinutes],
      ["Availability (%)", first.snapshot.availability, second.snapshot.availability, second.snapshot.availability - first.snapshot.availability],
      ["Quality yield (%)", first.snapshot.yieldRate, second.snapshot.yieldRate, second.snapshot.yieldRate - first.snapshot.yieldRate],
      ["Operating assumptions match", ["shiftHours", "breakMinutes", "availability", "yieldRate"].every(key => first.snapshot[key] === second.snapshot[key]) ? "Yes" : "No", "", ""],
      ["Normalized comparison conditions", `${first.snapshot.shiftHours}h shift; ${first.snapshot.breakMinutes} min breaks; ${first.snapshot.availability}% availability; ${first.snapshot.yieldRate}% quality`, "Applied to both scenarios", ""],
      ["Normalized good vehicles / shift (first scenario conditions)", normalizedFirst.good, normalizedSecond.good, normalizedSecond.good - normalizedFirst.good],
      [],
      ["Station cycle-time comparison (seconds)", first.name, second.name, "Second minus first"],
      ...initialStations.map((station, index) => [station.name, first.snapshot.cycleTimes[index], second.snapshot.cycleTimes[index], second.snapshot.cycleTimes[index] - first.snapshot.cycleTimes[index]])
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFirst = first.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-a";
    const safeSecond = second.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-b";
    link.href = url;
    link.download = `factory-comparison-${safeFirst}-vs-${safeSecond}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    setScenarioSaveMessage(`Exported the comparison between “${first.name}” and “${second.name}” as CSV.`);
  }

  async function copyScenarioComparisonSummary(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before copying their comparison.");
      return;
    }
    const firstProjection = getScenarioProjection(first.snapshot);
    const secondProjection = getScenarioProjection(second.snapshot);
    const commonConditions = {
      shiftHours: first.snapshot.shiftHours,
      breakMinutes: first.snapshot.breakMinutes,
      availability: first.snapshot.availability,
      yieldRate: first.snapshot.yieldRate,
      target: first.snapshot.target
    };
    const normalizedFirst = getScenarioProjection({ ...first.snapshot, ...commonConditions });
    const normalizedSecond = getScenarioProjection({ ...second.snapshot, ...commonConditions });
    const difference = secondProjection.good - firstProjection.good;
    const normalizedDifference = normalizedSecond.good - normalizedFirst.good;
    const lines = [
      "FACTORY SCENARIO COMPARISON",
      `First scenario: ${first.name}`,
      `Second scenario: ${second.name}`,
      "",
      `Projected good vehicles/shift: ${firstProjection.good} vs ${secondProjection.good}`,
      `Overall difference (second minus first): ${difference > 0 ? "+" : ""}${difference}`,
      `Normalized output using first scenario conditions: ${normalizedFirst.good} vs ${normalizedSecond.good}`,
      `Cycle-time-only difference: ${normalizedDifference > 0 ? "+" : ""}${normalizedDifference}`,
      "",
      `First bottleneck: ${firstProjection.bottleneckName} (${firstProjection.bottleneck}s)`,
      `Second bottleneck: ${secondProjection.bottleneckName} (${secondProjection.bottleneck}s)`,
      `Same operating assumptions: ${["shiftHours", "breakMinutes", "availability", "yieldRate"].every(key => first.snapshot[key] === second.snapshot[key]) ? "Yes" : "No"}`,
      `Shared conditions for normalized comparison: ${commonConditions.shiftHours}h shift, ${commonConditions.breakMinutes} min breaks, ${commonConditions.availability}% availability, ${commonConditions.yieldRate}% quality yield, target ${commonConditions.target}`,
      "",
      "STATION CYCLE TIMES (SECONDS)",
      ...initialStations.map((station, index) => `${station.name}: ${first.snapshot.cycleTimes[index]}s -> ${second.snapshot.cycleTimes[index]}s (${second.snapshot.cycleTimes[index] - first.snapshot.cycleTimes[index] > 0 ? "+" : ""}${second.snapshot.cycleTimes[index] - first.snapshot.cycleTimes[index]}s)`)
    ];
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(lines.join("\\n"));
      setScenarioSaveMessage("Scenario comparison summary copied. You can paste it into a report or message.");
    } catch {
      setScenarioSaveMessage("Could not copy the comparison summary. Use Export comparison CSV or JSON instead.");
    }
  }

  function exportScenarioComparisonJson(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before exporting their comparison.");
      return;
    }
    const firstProjection = getScenarioProjection(first.snapshot);
    const secondProjection = getScenarioProjection(second.snapshot);
    const sharedConditions = {
      shiftHours: first.snapshot.shiftHours,
      breakMinutes: first.snapshot.breakMinutes,
      availability: first.snapshot.availability,
      yieldRate: first.snapshot.yieldRate,
      target: first.snapshot.target
    };
    const normalizedFirst = getScenarioProjection({ ...first.snapshot, ...sharedConditions });
    const normalizedSecond = getScenarioProjection({ ...second.snapshot, ...sharedConditions });
    const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate"].every(key => first.snapshot[key] === second.snapshot[key]);
    const payload = {
      version: 1,
      type: "factory-scenario-comparison",
      exportedAt: new Date().toISOString(),
      comparisonOrder: "second-minus-first",
      sameOperatingAssumptions: sameAssumptions,
      scenarios: [
        { name: first.name, snapshot: first.snapshot, projection: firstProjection },
        { name: second.name, snapshot: second.snapshot, projection: secondProjection }
      ],
      normalizedComparison: {
        conditionsFromScenario: first.name,
        conditions: sharedConditions,
        firstGoodVehiclesPerShift: normalizedFirst.good,
        secondGoodVehiclesPerShift: normalizedSecond.good,
        differenceGoodVehiclesPerShift: normalizedSecond.good - normalizedFirst.good
      },
      stationCycleDifferences: initialStations.map((station, index) => ({
        station: station.name,
        firstCycleSeconds: first.snapshot.cycleTimes[index],
        secondCycleSeconds: second.snapshot.cycleTimes[index],
        differenceSeconds: second.snapshot.cycleTimes[index] - first.snapshot.cycleTimes[index]
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFirst = first.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-a";
    const safeSecond = second.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-b";
    link.href = url;
    link.download = `factory-comparison-${safeFirst}-vs-${safeSecond}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported the structured comparison between “${first.name}” and “${second.name}” as JSON.`);
  }


  function exportScenarioComparisonMarkdown(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before exporting their comparison.");
      return;
    }
    const firstProjection = getScenarioProjection(first.snapshot);
    const secondProjection = getScenarioProjection(second.snapshot);
    const conditions = {
      shiftHours: first.snapshot.shiftHours,
      breakMinutes: first.snapshot.breakMinutes,
      availability: first.snapshot.availability,
      yieldRate: first.snapshot.yieldRate,
      target: first.snapshot.target
    };
    const normalizedFirst = getScenarioProjection({ ...first.snapshot, ...conditions });
    const normalizedSecond = getScenarioProjection({ ...second.snapshot, ...conditions });
    const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate"].every(key => first.snapshot[key] === second.snapshot[key]);
    const safeCell = value => String(value).replace(/\\|/g, "\\\\|").replace(/\\r?\\n/g, " ");
    const rows = initialStations.map((station, index) => {
      const a = first.snapshot.cycleTimes[index];
      const b = second.snapshot.cycleTimes[index];
      const delta = b - a;
      return `| ${safeCell(station.name)} | ${a} s | ${b} s | ${delta > 0 ? "+" : ""}${delta} s |`;
    });
    const markdown = [
      "# Factory Scenario Comparison",
      "",
      `- Exported: ${new Date().toLocaleString()}`,
      `- Scenario A: **${safeCell(first.name)}**`,
      `- Scenario B: **${safeCell(second.name)}**`,
      `- Assumptions: ${sameAssumptions ? "Like-for-like" : "Different operating assumptions"}`,
      "",
      "## Production summary",
      "",
      "| Metric | Scenario A | Scenario B | B − A |",
      "|---|---:|---:|---:|",
      `| Good vehicles / shift | ${firstProjection.good} | ${secondProjection.good} | ${secondProjection.good - firstProjection.good > 0 ? "+" : ""}${secondProjection.good - firstProjection.good} |`,
      `| Target | ${first.snapshot.target} | ${second.snapshot.target} | ${second.snapshot.target - first.snapshot.target} |`,
      `| Target gap | ${firstProjection.good - first.snapshot.target} | ${secondProjection.good - second.snapshot.target} | ${(secondProjection.good - second.snapshot.target) - (firstProjection.good - first.snapshot.target)} |`,
      `| Target attainment | ${firstProjection.attainmentPercent.toFixed(1)}% | ${secondProjection.attainmentPercent.toFixed(1)}% | ${(secondProjection.attainmentPercent - firstProjection.attainmentPercent).toFixed(1)} pp |`,
      `| Ideal capacity | ${getScenarioCapacityMetrics(first.snapshot, firstProjection).ideal} | ${getScenarioCapacityMetrics(second.snapshot, secondProjection).ideal} | ${getScenarioCapacityMetrics(second.snapshot, secondProjection).ideal - getScenarioCapacityMetrics(first.snapshot, firstProjection).ideal} |`,
      `| Available capacity | ${getScenarioCapacityMetrics(first.snapshot, firstProjection).available} | ${getScenarioCapacityMetrics(second.snapshot, secondProjection).available} | ${getScenarioCapacityMetrics(second.snapshot, secondProjection).available - getScenarioCapacityMetrics(first.snapshot, firstProjection).available} |`,
      `| Required cycle after losses | ${getScenarioCapacityMetrics(first.snapshot, firstProjection).feasible ? getScenarioCapacityMetrics(first.snapshot, firstProjection).requiredCycle + " s" : "Not feasible"} | ${getScenarioCapacityMetrics(second.snapshot, secondProjection).feasible ? getScenarioCapacityMetrics(second.snapshot, secondProjection).requiredCycle + " s" : "Not feasible"} | — |`,
      `| Target pace feasibility | ${first.snapshot.target === 0 ? "No target" : getScenarioCapacityMetrics(first.snapshot, firstProjection).feasible ? "Feasible" : "Not feasible"} | ${second.snapshot.target === 0 ? "No target" : getScenarioCapacityMetrics(second.snapshot, secondProjection).feasible ? "Feasible" : "Not feasible"} | — |`,
      `| Bottleneck cycle | ${firstProjection.bottleneck} s | ${secondProjection.bottleneck} s | ${secondProjection.bottleneck - firstProjection.bottleneck} s |`,
      "",
      "## Operating assumptions",
      "",
      "| Setting | Scenario A | Scenario B |",
      "|---|---:|---:|",
      `| Shift hours | ${first.snapshot.shiftHours} | ${second.snapshot.shiftHours} |`,
      `| Break minutes | ${first.snapshot.breakMinutes} | ${second.snapshot.breakMinutes} |`,
      `| Availability | ${first.snapshot.availability}% | ${second.snapshot.availability}% |`,
      `| Quality yield | ${first.snapshot.yieldRate}% | ${second.snapshot.yieldRate}% |`,
      "",
      "## Cycle-time-only comparison",
      "",
      `Both scenarios recalculated using Scenario A conditions (${conditions.shiftHours} h shift, ${conditions.breakMinutes} min breaks, ${conditions.availability}% availability, ${conditions.yieldRate}% quality yield).`,
      "",
      `- Scenario A normalized output: **${normalizedFirst.good} good vehicles/shift**`,
      `- Scenario B normalized output: **${normalizedSecond.good} good vehicles/shift**`,
      `- Normalized difference (B − A): **${normalizedSecond.good - normalizedFirst.good > 0 ? "+" : ""}${normalizedSecond.good - normalizedFirst.good} vehicles/shift**`,
      "",
      "## Station cycle-time details",
      "",
      "| Station | Scenario A | Scenario B | B − A |",
      "|---|---:|---:|---:|",
      ...rows,
      "",
      "> Educational planning estimate. Validate projections against actual factory production data."
    ].join("\\n");
    const blob = new Blob(["\\uFEFF", markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFirst = first.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-a";
    const safeSecond = second.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-b";
    link.href = url;
    link.download = `factory-comparison-${safeFirst}-vs-${safeSecond}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported the comparison between “${first.name}” and “${second.name}” as a Markdown report.`);
  }


  function exportScenarioComparisonHtml(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before exporting their comparison.");
      return;
    }
    const a = first.snapshot;
    const b = second.snapshot;
    const projectionA = getScenarioProjection(a);
    const projectionB = getScenarioProjection(b);
    const capacityA = getScenarioCapacityMetrics(a, projectionA);
    const capacityB = getScenarioCapacityMetrics(b, projectionB);
    const conditions = { shiftHours: a.shiftHours, breakMinutes: a.breakMinutes, availability: a.availability, yieldRate: a.yieldRate, target: a.target };
    const normalizedA = getScenarioProjection({ ...a, ...conditions });
    const normalizedB = getScenarioProjection({ ...b, ...conditions });
    const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate"].every(key => a[key] === b[key]);
    const escapeHtml = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const signed = value => `${value > 0 ? "+" : ""}${value}`;
    const stationRows = initialStations.map((station, index) => {
      const delta = b.cycleTimes[index] - a.cycleTimes[index];
      return `<tr><th scope="row">${escapeHtml(station.name)}</th><td>${a.cycleTimes[index]} s</td><td>${b.cycleTimes[index]} s</td><td class="${delta < 0 ? "better" : delta > 0 ? "worse" : ""}">${signed(delta)} s</td></tr>`;
    }).join("");
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factory scenario comparison</title>
<style>
:root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172b3a;background:#f4f7f8}
body{margin:0;padding:32px 16px}.report{max-width:960px;margin:auto;background:#fff;border:1px solid #dce5e8;border-radius:16px;padding:clamp(20px,4vw,40px);box-shadow:0 8px 28px #17334412}
h1{font-size:clamp(24px,4vw,34px);margin:0 0 8px}h2{font-size:19px;margin:30px 0 12px;color:#245c62}
.meta,.notice{color:#526672;font-size:14px;line-height:1.6}.notice{padding:12px 14px;background:#f0f6f6;border-radius:9px;margin:18px 0}
.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.metric{border:1px solid #dce5e8;border-radius:12px;padding:16px}.metric span{display:block;color:#60727b;font-size:13px}.metric strong{display:block;font-size:25px;margin-top:6px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:11px 9px;border-bottom:1px solid #e5ecee}thead th{background:#f2f6f7;color:#405661}.better{color:#087b62;font-weight:700}.worse{color:#b4533c;font-weight:700}
.table-wrap{overflow-x:auto}.foot{margin-top:28px;color:#667780;font-size:12px}.print{border:0;background:#245c62;color:white;border-radius:8px;padding:10px 16px;font:inherit;cursor:pointer;margin:0 0 20px}
@media(max-width:600px){body{padding:12px 8px}.report{padding:18px 14px}.cards{grid-template-columns:1fr}table{min-width:520px}}
@media print{body{padding:0;background:white}.report{border:0;box-shadow:none;max-width:none;padding:0}.print{display:none}h2{break-after:avoid}tr{break-inside:avoid}}
</style>
</head>
<body><main class="report">
<button class="print" type="button" onclick="window.print()">Print report</button>
<h1>Factory Scenario Comparison</h1>
<p class="meta">Exported ${escapeHtml(new Date().toLocaleString())}<br>Scenario A: <strong>${escapeHtml(first.name)}</strong> · Scenario B: <strong>${escapeHtml(second.name)}</strong></p>
<div class="notice">${sameAssumptions ? "Like-for-like comparison: both scenarios use the same operating assumptions." : "Different operating assumptions detected. The overall output difference includes changes to shift time, breaks, availability, quality yield or target."}</div>
<h2>Production summary</h2>
<div class="cards">
<div class="metric"><span>${escapeHtml(first.name)} · Good vehicles / shift</span><strong>${projectionA.good.toLocaleString("en-IN")}</strong></div>
<div class="metric"><span>${escapeHtml(second.name)} · Good vehicles / shift</span><strong>${projectionB.good.toLocaleString("en-IN")}</strong></div>
</div>
<div class="table-wrap"><table><thead><tr><th>Metric</th><th>Scenario A</th><th>Scenario B</th><th>B − A</th></tr></thead><tbody>
<tr><th>Good vehicles / shift</th><td>${projectionA.good}</td><td>${projectionB.good}</td><td>${signed(projectionB.good-projectionA.good)}</td></tr>
<tr><th>Target</th><td>${a.target}</td><td>${b.target}</td><td>${signed(b.target-a.target)}</td></tr>
<tr><th>Target gap</th><td>${projectionA.good-a.target}</td><td>${projectionB.good-b.target}</td><td>${signed((projectionB.good-b.target)-(projectionA.good-a.target))}</td></tr>
<tr><th>Target attainment</th><td>${projectionA.attainmentPercent.toFixed(1)}%</td><td>${projectionB.attainmentPercent.toFixed(1)}%</td><td>${signed(Number((projectionB.attainmentPercent-projectionA.attainmentPercent).toFixed(1)))} percentage points</td></tr>
<tr><th>Ideal capacity</th><td>${capacityA.ideal}</td><td>${capacityB.ideal}</td><td>${signed(capacityB.ideal-capacityA.ideal)}</td></tr>
<tr><th>Available capacity</th><td>${capacityA.available}</td><td>${capacityB.available}</td><td>${signed(capacityB.available-capacityA.available)}</td></tr>
<tr><th>Net production time</th><td>${capacityA.netMinutes} min</td><td>${capacityB.netMinutes} min</td><td>${signed(capacityB.netMinutes-capacityA.netMinutes)} min</td></tr>
<tr><th>Target takt (before losses)</th><td>${capacityA.taktSeconds.toFixed(1)} s</td><td>${capacityB.taktSeconds.toFixed(1)} s</td><td>${signed(Number((capacityB.taktSeconds-capacityA.taktSeconds).toFixed(1)))} s</td></tr>
<tr><th>Required bottleneck cycle after losses</th><td>${capacityA.requiredCycle || "N/A"} s</td><td>${capacityB.requiredCycle || "N/A"} s</td><td>${capacityA.requiredCycle && capacityB.requiredCycle ? signed(capacityB.requiredCycle-capacityA.requiredCycle)+" s" : "N/A"}</td></tr>
<tr><th>Target pace feasibility (20 s minimum)</th><td>${capacityA.feasible ? "Feasible" : "Not feasible"}</td><td>${capacityB.feasible ? "Feasible" : "Not feasible"}</td><td>—</td></tr>
<tr><th>Bottleneck cycle</th><td>${projectionA.bottleneck} s</td><td>${projectionB.bottleneck} s</td><td>${signed(projectionB.bottleneck-projectionA.bottleneck)} s</td></tr>
</tbody></table></div>
<h2>Operating assumptions</h2>
<div class="table-wrap"><table><thead><tr><th>Setting</th><th>Scenario A</th><th>Scenario B</th></tr></thead><tbody>
<tr><th>Shift hours</th><td>${a.shiftHours}</td><td>${b.shiftHours}</td></tr>
<tr><th>Break minutes</th><td>${a.breakMinutes}</td><td>${b.breakMinutes}</td></tr>
<tr><th>Availability</th><td>${a.availability}%</td><td>${b.availability}%</td></tr>
<tr><th>Quality yield</th><td>${a.yieldRate}%</td><td>${b.yieldRate}%</td></tr>
</tbody></table></div>
<h2>Cycle-time-only comparison</h2>
<p class="meta">Both scenarios recalculated using Scenario A conditions: ${conditions.shiftHours} h shift, ${conditions.breakMinutes} min breaks, ${conditions.availability}% availability and ${conditions.yieldRate}% quality yield.</p>
<div class="cards">
<div class="metric"><span>Scenario A normalized output</span><strong>${normalizedA.good.toLocaleString("en-IN")}</strong></div>
<div class="metric"><span>Scenario B normalized output</span><strong>${normalizedB.good.toLocaleString("en-IN")}</strong></div>
</div>
<p><strong>Normalized difference (B − A): ${signed(normalizedB.good-normalizedA.good)} good vehicles / shift</strong></p>
<h2>Station cycle-time details</h2>
<div class="table-wrap"><table><thead><tr><th>Station</th><th>Scenario A</th><th>Scenario B</th><th>B − A</th></tr></thead><tbody>${stationRows}</tbody></table></div>
<p class="foot">Educational planning estimate only. Validate projections against actual factory production data before making operational decisions.</p>
</main></body></html>`;
    const blob = new Blob(["\\uFEFF", html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFirst = first.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-a";
    const safeSecond = second.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-b";
    link.href = url;
    link.download = `factory-comparison-${safeFirst}-vs-${safeSecond}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported the comparison between “${first.name}” and “${second.name}” as a standalone HTML report.`);
  }

  function togglePinnedScenario(name) {
    const nextName = pinnedScenarioName === name ? "" : name;
    try {
      if (nextName) window.localStorage.setItem("factory-improvement-pinned-scenario", nextName);
      else window.localStorage.removeItem("factory-improvement-pinned-scenario");
      setPinnedScenarioName(nextName);
      setScenarioSaveMessage(nextName ? `“${name}” pinned as the baseline scenario.` : "Baseline scenario pin cleared.");
    } catch {
      setScenarioSaveMessage("Could not save the baseline pin in this browser.");
    }
  }

  function loadNamedScenario(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) return;
    const snapshot = item.snapshot;
    setProposedCycleTimes([...snapshot.cycleTimes]);
    setShiftHours(snapshot.shiftHours);
    setBreakMinutes(snapshot.breakMinutes);
    setAvailability(snapshot.availability);
    setYieldRate(snapshot.yieldRate);
    setTarget(snapshot.target);
    setScenarioSaveMessage(`Loaded “${item.name}”. Review the projection before saving changes.`);
  }

  function renameNamedScenario(oldName) {
    const nextName = renameScenarioValue.trim();
    if (!nextName) {
      setScenarioSaveMessage("Enter a name before renaming this scenario.");
      return;
    }
    if (nextName.length > 48) {
      setScenarioSaveMessage("Scenario names must be 48 characters or fewer.");
      return;
    }
    if (scenarioLibrary.some(item => item.name.toLowerCase() === nextName.toLowerCase() && item.name !== oldName)) {
      setScenarioSaveMessage("A scenario with that name already exists. Choose a different name.");
      return;
    }
    const next = scenarioLibrary.map(item => item.name === oldName ? { ...item, name: nextName } : item);
    const renamingPinnedBaseline = pinnedScenarioName === oldName;
    let previousLibrary;
    let previousPin;
    try {
      previousLibrary = window.localStorage.getItem("factory-improvement-scenarios");
      previousPin = window.localStorage.getItem("factory-improvement-pinned-scenario");
      try {
        window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
        if (renamingPinnedBaseline) window.localStorage.setItem("factory-improvement-pinned-scenario", nextName);
      } catch (storageError) {
        try {
          if (previousLibrary === null) window.localStorage.removeItem("factory-improvement-scenarios");
          else window.localStorage.setItem("factory-improvement-scenarios", previousLibrary);
          if (previousPin === null) window.localStorage.removeItem("factory-improvement-pinned-scenario");
          else window.localStorage.setItem("factory-improvement-pinned-scenario", previousPin);
        } catch {
          // Best-effort rollback if browser storage becomes unavailable mid-rename.
        }
        throw storageError;
      }
      setScenarioLibrary(next);
      if (renamingPinnedBaseline) setPinnedScenarioName(nextName);
      setSelectedScenarioNames(current => current.map(name => name === oldName ? nextName : name));
      setScenarioName(current => current === oldName ? nextName : current);
      setRenamingScenario("");
      setRenameScenarioValue("");
      setScenarioSaveMessage(`Renamed “${oldName}” to “${nextName}”.`);
    } catch {
      setScenarioSaveMessage("Could not rename this scenario. Browser storage may be unavailable.");
    }
  }

  function duplicateNamedScenario(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) return;
    if (scenarioLibrary.length >= 10) {
      setScenarioSaveMessage("The scenario library is full. Delete a scenario before creating a duplicate.");
      return;
    }
    const baseName = `Copy of ${item.name}`.slice(0, 48);
    let duplicateName = baseName;
    let suffix = 2;
    while (scenarioLibrary.some(entry => entry.name.toLowerCase() === duplicateName.toLowerCase())) {
      const ending = ` (${suffix})`;
      duplicateName = `${baseName.slice(0, 48 - ending.length)}${ending}`;
      suffix += 1;
    }
    const duplicate = {
      name: duplicateName,
      snapshot: { ...item.snapshot, cycleTimes: [...item.snapshot.cycleTimes], savedAt: new Date().toISOString() }
    };
    const next = [...scenarioLibrary, duplicate];
    try {
      window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
      setScenarioLibrary(next);
      setScenarioName(duplicateName);
      setScenarioSaveMessage(`Created “${duplicateName}”. You can load it and adjust its settings independently.`);
    } catch {
      setScenarioSaveMessage("Could not duplicate this scenario. Browser storage may be unavailable.");
    }
  }

  function deleteNamedScenario(name) {
    const next = scenarioLibrary.filter(item => item.name !== name);
    const deletingPinnedBaseline = pinnedScenarioName === name;
    const previousLibrary = window.localStorage.getItem("factory-improvement-scenarios");
    const previousPin = window.localStorage.getItem("factory-improvement-pinned-scenario");
    try {
      try {
        window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
        if (deletingPinnedBaseline) window.localStorage.removeItem("factory-improvement-pinned-scenario");
      } catch (storageError) {
        try {
          if (previousLibrary === null) window.localStorage.removeItem("factory-improvement-scenarios");
          else window.localStorage.setItem("factory-improvement-scenarios", previousLibrary);
          if (previousPin === null) window.localStorage.removeItem("factory-improvement-pinned-scenario");
          else window.localStorage.setItem("factory-improvement-pinned-scenario", previousPin);
        } catch {
          // Best-effort rollback if browser storage becomes unavailable mid-delete.
        }
        throw storageError;
      }
      setScenarioLibrary(next);
      if (deletingPinnedBaseline) setPinnedScenarioName("");
      setSelectedScenarioNames(current => current.filter(item => item !== name));
      setPendingDeleteScenario("");
      setScenarioSaveMessage(`“${name}” removed from the named scenario library.`);
    } catch {
      setScenarioSaveMessage("Could not update the named scenario library.");
    }
  }

  async function copyScenarioSummary() {
    const lines = [
      "Factory line improvement scenario",
      `Projected good output: ${improvement.good} vehicles / shift`,
      `Current output: ${result.goodUnits} vehicles / shift`,
      `Change vs current: ${improvement.gain > 0 ? "+" : ""}${improvement.gain} vehicles / shift`,
      `Target: ${target} vehicles / shift — ${improvement.meetsTarget ? "Achieved" : `Short by ${Math.abs(improvement.targetGap)}`}`,
      `Projected bottleneck: ${improvement.bottleneckName} (${improvement.bottleneck}s)`,
      `Shift: ${shiftHours}h; break: ${breakMinutes} min; availability: ${availability}%; quality yield: ${yieldRate}%`,
      "",
      "Station cycle times (current → proposed)",
      ...stations.map((station, index) => `${station.name}: ${station.seconds}s → ${proposedCycleTimes[index] ?? station.seconds}s`)
    ].join("\n");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(lines);
      setScenarioSaveMessage("Scenario summary copied. You can paste it into a report or message.");
    } catch {
      setScenarioSaveMessage("Could not copy automatically. Use Export scenario CSV or Export JSON instead.");
    }
  }

  function exportScenarioJson() {
    const snapshot = { version: 2, stationNames: initialStations.map(station => station.name), cycleTimes: proposedCycleTimes, target, shiftHours, breakMinutes, availability, yieldRate, savedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-improvement-scenario.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage("Scenario JSON exported. You can import this file on another device.");
  }

  async function importScenarioJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100 * 1024) throw new Error("Scenario file is too large");
      const parsed = JSON.parse(await file.text());
      if (parsed?.version !== 1 && parsed?.version !== 2) throw new Error("Unsupported scenario version");
      if (parsed.version === 2 && (!Array.isArray(parsed.stationNames) ||
        parsed.stationNames.length !== initialStations.length ||
        !parsed.stationNames.every((name, index) => name === initialStations[index].name))) {
        throw new Error("Station layout does not match");
      }
      if (!isValidSavedScenario(parsed)) throw new Error("Invalid scenario format");
      setProposedCycleTimes([...parsed.cycleTimes]);
      setShiftHours(parsed.shiftHours);
      setBreakMinutes(parsed.breakMinutes);
      setAvailability(parsed.availability);
      setYieldRate(parsed.yieldRate);
      setTarget(parsed.target);
      setScenarioSaveMessage("Scenario imported. Review the projection, then choose Save scenario to keep it in this browser.");
    } catch {
      setScenarioSaveMessage("Import failed. Use a version 1 or 2 scenario JSON exported from this planner, with matching station names and valid settings.");
    } finally {
      event.target.value = "";
    }
  }

  function loadImprovementScenario() {
    if (!savedScenario) return;
    setProposedCycleTimes([...savedScenario.cycleTimes]);
    // Restore the assumptions saved with the scenario so its projection is reproducible.
    setShiftHours(clamp(Number(savedScenario.shiftHours) || 8, 4, 12));
    setBreakMinutes(clamp(Number(savedScenario.breakMinutes) || 0, 0, 120));
    setAvailability(clamp(Number(savedScenario.availability) || 90, 50, 100));
    setYieldRate(clamp(Number(savedScenario.yieldRate) || 97, 70, 100));
    setTarget(clamp(Number(savedScenario.target) || 350, 50, 700));
  }

  function clearImprovementScenario() {
    try { window.localStorage.removeItem("factory-improvement-scenario"); } catch {}
    setSavedScenario(null);
    setScenarioSaveMessage("Saved scenario cleared from this device.");
  }
  const [chartVisibility, setChartVisibility] = useState({ radar: true, capacity: true, ratios: true, losses: true });
  const [chartTitles, setChartTitles] = useState({
    radar: "Station cycle times",
    capacity: "Capacity indicators",
    ratios: "Availability & quality yield",
    losses: "Where does capacity go?"
  });
  const defaultChartTitles = {
    radar: "Station cycle times",
    capacity: "Capacity indicators",
    ratios: "Availability & quality yield",
    losses: "Where does capacity go?"
  };
  const [chartSettingsLoaded, setChartSettingsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("factory-chart-preferences");
      if (saved) {
        const preferences = JSON.parse(saved);
        if (preferences.visibility && typeof preferences.visibility === "object") {
          setChartVisibility(current => ({ ...current, ...preferences.visibility }));
        }
        if (preferences.titles && typeof preferences.titles === "object") {
          setChartTitles(current => ({ ...current, ...preferences.titles }));
        }
      }
    } catch {
      // Keep the default chart preferences if saved browser data is unavailable.
    }
    setChartSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!chartSettingsLoaded) return;
    try {
      window.localStorage.setItem("factory-chart-preferences", JSON.stringify({
        visibility: chartVisibility,
        titles: chartTitles
      }));
    } catch {
      // Chart editing remains available for this visit if storage is blocked.
    }
  }, [chartSettingsLoaded, chartVisibility, chartTitles]);

  const result = useMemo(() => {
    const bottleneck = Math.max(...stations.map(station => station.seconds));
    const netMinutes = Math.max(0, shiftHours * 60 - breakMinutes);
    const ideal = bottleneck > 0 ? Math.floor(netMinutes * 60 / bottleneck) : 0;
    const available = Math.floor(ideal * availability / 100);
    const goodUnits = Math.floor(available * yieldRate / 100);
    return {
      bottleneck,
      bottleneckName: stations.find(station => station.seconds === bottleneck)?.name || "—",
      netMinutes,
      ideal,
      available,
      goodUnits,
      gap: goodUnits - target,
      hourly: netMinutes > 0 ? goodUnits / (netMinutes / 60) : 0,
      taktSeconds: target > 0 ? netMinutes * 60 / target : 0,
      requiredGoodOutputCycle: target > 0 && availability > 0 && yieldRate > 0
        ? Math.floor(netMinutes * 60 / Math.ceil(Math.ceil(target / (yieldRate / 100)) / (availability / 100)))
        : 0,
      targetPaceFeasible: target === 0 || (netMinutes > 0 && availability > 0 && yieldRate > 0 &&
        Math.floor(netMinutes * 60 / Math.ceil(Math.ceil(target / (yieldRate / 100)) / (availability / 100))) >= 20)
    };
  }, [stations, shiftHours, breakMinutes, availability, yieldRate, target]);

  const improvement = useMemo(() => {
    const proposedBottleneck = Math.max(...proposedCycleTimes);
    const proposedIdeal = proposedBottleneck > 0 ? Math.floor(result.netMinutes * 60 / proposedBottleneck) : 0;
    const proposedAvailable = Math.floor(proposedIdeal * availability / 100);
    const proposedGood = Math.floor(proposedAvailable * yieldRate / 100);
    const requiredAvailable = target > 0 ? Math.ceil(target / (yieldRate / 100)) : 0;
    const requiredIdeal = target > 0 ? Math.ceil(requiredAvailable / (availability / 100)) : 0;
    const requiredCycle = requiredIdeal > 0 ? Math.floor(result.netMinutes * 60 / requiredIdeal) : 180;
    return {
      bottleneck: proposedBottleneck,
      bottleneckName: stations[proposedCycleTimes.indexOf(proposedBottleneck)]?.name || "—",
      ideal: proposedIdeal,
      good: proposedGood,
      gain: proposedGood - result.goodUnits,
      targetGap: proposedGood - target,
      meetsTarget: proposedGood >= target,
      requiredCycle,
      feasible: target === 0 || requiredCycle >= 20
    };
  }, [proposedCycleTimes, result.netMinutes, result.goodUnits, availability, yieldRate, stations, target]);

  const savedScenarioChanged = useMemo(() => {
    if (!savedScenario) return false;
    return savedScenario.cycleTimes.some((value, index) => value !== proposedCycleTimes[index]) ||
      savedScenario.target !== target ||
      savedScenario.shiftHours !== shiftHours ||
      savedScenario.breakMinutes !== breakMinutes ||
      savedScenario.availability !== availability ||
      savedScenario.yieldRate !== yieldRate;
  }, [savedScenario, proposedCycleTimes, target, shiftHours, breakMinutes, availability, yieldRate]);

  const savedScenarioSummary = useMemo(() => {
    if (!savedScenario) return null;
    const savedBottleneck = Math.max(...savedScenario.cycleTimes);
    const savedNetMinutes = Math.max(0, savedScenario.shiftHours * 60 - savedScenario.breakMinutes);
    const savedIdeal = savedBottleneck > 0 ? Math.floor(savedNetMinutes * 60 / savedBottleneck) : 0;
    const savedAvailable = Math.floor(savedIdeal * savedScenario.availability / 100);
    const savedGood = Math.floor(savedAvailable * savedScenario.yieldRate / 100);
    return {
      bottleneck: savedBottleneck,
      good: savedGood,
      gap: savedGood - savedScenario.target,
      meetsTarget: savedGood >= savedScenario.target
    };
  }, [savedScenario]);

  const improvementPriorities = useMemo(() => stations
    .map((station, index) => ({
      ...station,
      index,
      reductionNeeded: Math.max(0, station.seconds - improvement.requiredCycle),
      proposedReduction: Math.max(0, station.seconds - (proposedCycleTimes[index] ?? station.seconds))
    }))
    .sort((a, b) => b.reductionNeeded - a.reductionNeeded || b.seconds - a.seconds), 
  [stations, improvement.requiredCycle, proposedCycleTimes]);

  function updateStation(index, seconds) {
    setStations(current => current.map((station, i) =>
      i === index ? { ...station, seconds: clamp(Number(seconds) || 1, 20, 180) } : station
    ));
  }

  const weeklySummary = useMemo(() => weeklyProduction.reduce((summary, day) => ({
    planned: summary.planned + day.planned,
    good: summary.good + day.good,
    rejected: summary.rejected + day.rejected,
    downtime: summary.downtime + day.downtime
  }), { planned: 0, good: 0, rejected: 0, downtime: 0 }), [weeklyProduction]);
  const selectedDayProduction = weeklyProduction.find(day => day.day === selectedProductionDay) || weeklyProduction[0];
  const weeklyAttainment = weeklySummary.planned > 0 ? weeklySummary.good / weeklySummary.planned * 100 : 0;
  const weeklyPeak = Math.max(1, ...weeklyProduction.map(day => day.good));
  const weeklyLinePoints = weeklyProduction.map((day, index) => {
    const x = 24 + index * 92;
    const y = 108 - day.good / weeklyPeak * 78;
    return `${x},${y}`;
  }).join(" ");

  const stationPerformanceSummary = useMemo(() => {
    const totals = stationPerformance.reduce((summary, station) => ({
      processed: summary.processed + station.processed,
      rejected: summary.rejected + station.rejected,
      downtime: summary.downtime + station.downtime
    }), { processed: 0, rejected: 0, downtime: 0 });
    const bottleneck = stationPerformance.reduce((slowest, station) => station.avgCycleSeconds > slowest.avgCycleSeconds ? station : slowest, stationPerformance[0]);
    const downtimeLeader = stationPerformance.reduce((highest, station) => station.downtime > highest.downtime ? station : highest, stationPerformance[0]);
    const defects = stationPerformance.reduce((groups, station) => { const key = station.defectCategory || "Not specified"; groups[key] = (groups[key] || 0) + station.rejected; return groups; }, {});
    const downtimeCauses = stationPerformance.reduce((groups, station) => { const key = station.downtimeCause || "Not specified"; groups[key] = (groups[key] || 0) + station.downtime; return groups; }, {});
    const topDefect = Object.entries(defects).sort((a, b) => b[1] - a[1])[0] || ["—", 0];
    const topDowntimeCause = Object.entries(downtimeCauses).sort((a, b) => b[1] - a[1])[0] || ["—", 0];
    return { ...totals, bottleneck, downtimeLeader, defects, downtimeCauses, topDefect, topDowntimeCause, yieldPercent: totals.processed > 0 ? (totals.processed - totals.rejected) / totals.processed * 100 : 0 };
  }, [stationPerformance]);

  function importStationPerformanceCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024) {
      setStationDataMessage("CSV is too large. Please upload a file smaller than 100 KB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseStationPerformanceCsv(String(reader.result || ""));
        setStationPerformance(imported);
        setStationDataMessage("Loaded station-level metrics from " + file.name + ". Values are user-provided and have not been independently verified.");
      } catch (error) {
        setStationDataMessage(error.message || "Could not read station performance CSV.");
      }
      event.target.value = "";
    };
    reader.onerror = () => {
      setStationDataMessage("Could not read the selected station CSV.");
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function exportStationPerformanceCsv() {
    const rows = [
      ["Station", "Processed", "Rejected", "Downtime", "AvgCycleTime", "DefectCategory", "DowntimeCause"],
      ...stationPerformance.map(station => [station.name, station.processed, station.rejected, station.downtime, station.avgCycleSeconds, station.defectCategory || "Not specified", station.downtimeCause || "Not specified"])
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "station-performance.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function updateImprovementAction(id, field, value) {
    setImprovementActions(current => current.map(action => action.id === id ? { ...action, [field]: value } : action));
  }

  function addImprovementAction() {
    setImprovementActions(current => [...current, {
      id: "custom-" + Date.now(), priority: "Medium", issue: "Add the observed production issue.",
      action: "Describe the corrective or preventive action.", owner: "", dueDate: "", status: "Not started", kpi: "Define the measure used to confirm improvement"
    }]);
  }

  function exportImprovementActions() {
    const columns = ["Priority", "Issue", "Recommended action", "Owner", "Due date", "Status", "KPI to verify"];
    const rows = improvementActions.map(action => [action.priority, action.issue, action.action, action.owner, action.dueDate, action.status, action.kpi]);
    const csv = [columns, ...rows].map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const url = URL.createObjectURL(new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "manufacturing-improvement-action-register.csv";
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setActionExportMessage("Action register CSV prepared. Review owners, dates and actions before sharing.");
  }

  function downloadClientReviewReport() {
    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
    const isSample = /illustrative|sample/i.test(stationDataMessage);
    const rows = stationPerformance.map(station => {
      const good = Math.max(0, station.processed - station.rejected);
      const rejectRate = station.processed > 0 ? (station.rejected / station.processed * 100).toFixed(1) : "0.0";
      return "<tr><td>" + escapeHtml(station.name) + "</td><td>" + station.processed + "</td><td>" + good + "</td><td>" + station.rejected + "</td><td>" + rejectRate + "%</td><td>" + station.downtime + " min</td><td>" + escapeHtml(formatDuration(station.avgCycleSeconds)) + "</td><td>" + escapeHtml(station.defectCategory || "Not specified") + "</td><td>" + escapeHtml(station.downtimeCause || "Not specified") + "</td></tr>";
    }).join("");
    const actionRows = improvementActions.map(action => "<tr><td>" + escapeHtml(action.priority) + "</td><td>" + escapeHtml(action.issue) + "</td><td>" + escapeHtml(action.action) + "</td><td>" + escapeHtml(action.owner || "Not assigned") + "</td><td>" + escapeHtml(action.dueDate || "Not set") + "</td><td>" + escapeHtml(action.status) + "</td><td>" + escapeHtml(action.kpi) + "</td></tr>").join("");
    const statusLabel = isSample ? "ILLUSTRATIVE SAMPLE DATA — NOT VERIFIED PLANT RESULTS" : "USER-PROVIDED DATA — NOT INDEPENDENTLY VERIFIED";
    const warning = isSample
      ? "This report contains illustrative sample data; replace it with verified factory records before presenting it as actual performance."
      : "The uploaded values are user-provided and have not been independently verified.";
    const html = [
      "<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Manufacturing Station Performance - Client Review</title>",
      "<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172033;margin:0;background:#f3f5f8}.page{max-width:1180px;margin:32px auto;background:#fff;padding:36px;border-radius:14px}header{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #dce3ed;padding-bottom:18px}h1{font-size:25px;margin:5px 0 8px}.eyebrow{font-size:11px;letter-spacing:1.5px;color:#52627a;font-weight:700}.subtle{color:#637188;font-size:13px;line-height:1.5}.status{display:inline-block;padding:7px 10px;border-radius:20px;background:#fff3d8;color:#8a5a00;font-size:11px;font-weight:700}.metrics,.focus{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:22px 0}.metric,.focus article{border:1px solid #e1e7ef;border-radius:9px;padding:14px}.metric span{display:block;color:#64748b;font-size:12px}.metric strong{display:block;font-size:24px;margin-top:6px}.section{margin-top:24px}h2{font-size:17px;margin:0 0 10px}.focus{grid-template-columns:repeat(3,1fr)}.focus b{font-size:13px}.focus p{font-size:12px;color:#52627a;line-height:1.5}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}th,td{border:1px solid #dfe5ed;padding:9px 7px;text-align:left;vertical-align:top}th{background:#edf2f7;font-size:10px}ul{padding-left:20px;color:#52627a;font-size:13px;line-height:1.7}.note{margin-top:18px;padding:13px;background:#fff8e8;border-left:3px solid #d89b27;font-size:11px;line-height:1.6;color:#68501f}.foot{border-top:1px solid #e1e7ef;margin-top:24px;padding-top:12px;color:#718096;font-size:10px}.actions{display:flex;gap:8px}button{border:0;border-radius:7px;padding:10px 14px;background:#183b63;color:white;font-weight:700;cursor:pointer}@media(max-width:760px){.page{margin:0;padding:18px}.metrics{grid-template-columns:repeat(2,1fr)}.focus{grid-template-columns:1fr}header{display:block}table{font-size:9px}th,td{padding:5px 4px}}@media print{body{background:white}.page{max-width:none;margin:0;padding:10mm}.actions{display:none}thead{display:table-header-group}tr{break-inside:avoid}@page{size:A4 landscape;margin:10mm}}</style></head><body><main class='page'>",
      "<header><div><div class='eyebrow'>MANUFACTURING PERFORMANCE / CLIENT REVIEW</div><h1>Seven-Station Production Review</h1><p class='subtle'>Station-level output, quality, cycle time and downtime overview</p><span class='status'>" + statusLabel + "</span></div><div class='actions'><button onclick='window.print()'>Print / Save as PDF</button></div></header>",
      "<section class='metrics'><div class='metric'><span>Station operations processed</span><strong>" + stationPerformanceSummary.processed.toLocaleString("en-IN") + "</strong></div><div class='metric'><span>Station rejection records</span><strong>" + stationPerformanceSummary.rejected.toLocaleString("en-IN") + "</strong></div><div class='metric'><span>Recorded downtime</span><strong>" + stationPerformanceSummary.downtime + " min</strong></div><div class='metric'><span>Calculated station yield</span><strong>" + stationPerformanceSummary.yieldPercent.toFixed(1) + "%</strong></div></section>",
      "<section class='section'><h2>Management review priorities</h2><div class='focus'><article><b>Cycle-time focus · " + escapeHtml(stationPerformanceSummary.bottleneck.name) + "</b><p>Longest average cycle time: " + escapeHtml(formatDuration(stationPerformanceSummary.bottleneck.avgCycleSeconds)) + ". Validate the measured cycle and check for waiting, changeover or equipment constraints.</p></article><article><b>Downtime focus · " + escapeHtml(stationPerformanceSummary.downtimeLeader.name) + "</b><p>" + stationPerformanceSummary.downtimeLeader.downtime + " minutes recorded. Review the stated cause: " + escapeHtml(stationPerformanceSummary.downtimeLeader.downtimeCause || "Not specified") + ".</p></article><article><b>Quality focus · " + escapeHtml(stationPerformanceSummary.topDefect[0]) + "</b><p>" + stationPerformanceSummary.topDefect[1] + " rejection records associated with this category. Confirm classification and investigate root cause.</p></article></div></section>",
      "<section class='section'><h2>Station-by-station performance</h2><table><thead><tr><th>Manufacturing station</th><th>Processed</th><th>Good output*</th><th>Rejected</th><th>Reject rate</th><th>Downtime</th><th>Avg. cycle time</th><th>Defect category</th><th>Downtime cause</th></tr></thead><tbody>" + rows + "</tbody></table><p class='subtle'>*Good output is calculated as processed minus rejected at each station.</p></section>",
      "<section class='section'><h2>Agreed improvement action register</h2><table><thead><tr><th>Priority</th><th>Observed issue</th><th>Recommended action</th><th>Owner / team</th><th>Due date</th><th>Status</th><th>KPI to verify</th></tr></thead><tbody>" + actionRows + "</tbody></table><p class='subtle'>Review proposed actions with the factory team. Blank owners and dates must be assigned before follow-up.</p></section>",
      "<section class='section'><h2>Recommended discussion and next actions</h2><ul><li>Confirm all seven station records cover the same shift, day or reporting period.</li><li>Validate the slowest station's average cycle time and identify the constraint.</li><li>Review downtime events and record duration, frequency and corrective action.</li><li>Confirm defect counts and root causes with quality inspection records.</li><li>Agree an owner, target date and measurable KPI for each improvement action.</li></ul></section>",
      "<div class='note'><b>Data interpretation:</b> Processed and rejected totals are station-level records. The same physical unit may be counted at multiple stations, so these totals must not be interpreted as unique vehicles. Station yield is a combined station-record calculation, not final-line first-pass yield. Queue differences are estimates unless unit-level movement and opening/closing WIP are recorded. " + warning + "</div>",
      "<div class='foot'>Prepared from the current dashboard dataset · Reporting period should be confirmed with the data owner before client sign-off.</div></main></body></html>"
    ].join("");
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "manufacturing-client-review-report.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadStationCsvTemplate() {
    const rows = [
      ["Station", "Processed", "Rejected", "Downtime", "AvgCycleTime", "DefectCategory", "DowntimeCause"],
      ...initialStationPerformance.map(station => [
        station.name,
        station.processed,
        station.rejected,
        station.downtime,
        station.avgCycleSeconds,
        station.defectCategory,
        station.downtimeCause
      ])
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "station-performance-client-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStationDataMessage("Downloaded the seven-station CSV template. Replace the illustrative figures with actual values, keep all seven station names, then upload it here.");
  }

  function importWeeklyProductionCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024) {
      setWeeklyDataMessage("CSV is too large. Please upload a file smaller than 100 KB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseWeeklyProductionCsv(String(reader.result || ""));
        setWeeklyProduction(imported);
        setSelectedProductionDay("Monday");
        setWeeklyDataMessage("Loaded seven days from " + file.name + ". Imported data is shown as user-provided, not verified factory data.");
      } catch (error) {
        setWeeklyDataMessage(error.message || "Could not read this weekly CSV.");
      }
      event.target.value = "";
    };
    reader.onerror = () => {
      setWeeklyDataMessage("Could not read the selected CSV file.");
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function exportWeeklyProductionCsv() {
    const rows = [
      ["Day", "Planned", "Good", "Rejected", "Downtime"],
      ...weeklyProduction.map(day => [day.day, day.planned, day.good, day.rejected, day.downtime])
    ];
    const csv = rows.map(row => row.join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "weekly-manufacturing-production.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportSimulation() {
    const rows = [
      ["Factory process simulation report"],
      ["Metric", "Value"],
      ["Estimated good vehicles per shift", result.goodUnits],
      ["Production target", target],
      ["Output vs target", result.gap],
      ["Slowest station", result.bottleneckName],
      ["Bottleneck cycle time (seconds)", result.bottleneck],
      ["Net production time (minutes)", result.netMinutes],
      ["Ideal line capacity", result.ideal],
      ["Available capacity", result.available],
      ["Line availability (%)", availability],
      ["Quality yield (%)", yieldRate],
      ["Target takt time before losses (seconds per vehicle)", result.taktSeconds.toFixed(1)],
      ["Required cycle time after availability and quality losses (seconds)", target > 0 && result.targetPaceFeasible ? result.requiredGoodOutputCycle : "Not feasible / no target"],
      ["Good-output target pace status", target === 0 ? "No target selected" : result.targetPaceFeasible ? "Feasible within 20-second minimum" : "Not feasible within 20-second minimum"],
      ["Shift duration (hours)", shiftHours],
      ["Break time (minutes)", breakMinutes],
      [],
      ["Station", "Cycle time (seconds)", "Bottleneck", "Good-output target pace status"],
      ...stations.map(station => [station.name, station.seconds, station.seconds === result.bottleneck ? "Yes" : "No", target === 0 ? "No target selected" : !result.targetPaceFeasible ? "Target pace unavailable" : station.seconds <= result.requiredGoodOutputCycle ? "Within required pace" : "Exceeds required pace"])
    ];
    const csv = rows.map(row => row.map(value => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-process-simulation.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportImprovementScenario() {
    const rows = [
      ["Factory line improvement scenario"],
      ["Metric", "Current", "Proposed"],
      ["Good vehicles per shift", result.goodUnits, improvement.good],
      ["Ideal capacity (vehicles / shift)", result.ideal, improvement.ideal],
      ["Available capacity (vehicles / shift)", result.available, Math.floor(improvement.ideal * availability / 100)],
      ["Bottleneck station", result.bottleneckName, improvement.bottleneckName],
      ["Bottleneck cycle time (seconds)", result.bottleneck, improvement.bottleneck],
      ["Production change (good vehicles)", 0, improvement.gain],
      ["Target status", result.goodUnits >= target ? "Target achieved" : "Target not achieved", improvement.meetsTarget ? "Target achieved" : "Target not achieved"],
      ["Good vehicles above / below target", result.gap, improvement.targetGap],
      ["Target attainment (%)", target > 0 ? Number((result.goodUnits / target * 100).toFixed(1)) : "N/A", target > 0 ? Number((improvement.good / target * 100).toFixed(1)) : "N/A"],
      ["Shift target", target, target],
      ["Net production time (minutes)", result.netMinutes, result.netMinutes],
      ["Shift duration (hours)", shiftHours, shiftHours],
      ["Break time (minutes)", breakMinutes, breakMinutes],
      ["Target takt before losses (seconds)", result.taktSeconds.toFixed(1), result.taktSeconds.toFixed(1)],
      ["Availability (%)", availability, availability],
      ["Quality yield (%)", yieldRate, yieldRate],
      ["Required cycle time after availability and quality losses (seconds)", target > 0 && improvement.feasible ? improvement.requiredCycle : "Not feasible / no target"],
      ["Proposed target status", target === 0 ? "No target selected" : improvement.meetsTarget ? "Target achieved" : "Target not achieved"],
      ["Target pace feasibility", target === 0 ? "No target selected" : improvement.feasible ? "Feasible within 20-second minimum" : "Not feasible within 20-second minimum"],
      [],
      ["Station", "Current cycle (seconds)", "Proposed cycle (seconds)", "Reduction (seconds)", "Proposed target pace status"],
      ...stations.map((station, index) => {
        const proposed = proposedCycleTimes[index] ?? station.seconds;
        const paceStatus = target === 0 ? "No target selected" : !improvement.feasible ? "Target pace unavailable" : proposed <= improvement.requiredCycle ? "Within required pace" : "Exceeds required pace";
        return [station.name, station.seconds, proposed, station.seconds - proposed, paceStatus];
      })
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-line-improvement-scenario.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setStations(initialStations);
    setProposedCycleTimes(initialStations.map(station => station.seconds));
    setShiftHours(8);
    setBreakMinutes(40);
    setAvailability(90);
    setYieldRate(97);
    setTarget(350);
    setChartVisibility({ radar: true, capacity: true, ratios: true, losses: true });
    setChartTitles(defaultChartTitles);
    setChartEditMode(false);
  }

  const pinnedScenario = scenarioLibrary.find(item => item.name === pinnedScenarioName);
  const pinnedScenarioProjection = pinnedScenario ? getScenarioProjection(pinnedScenario.snapshot) : null;
  const visibleScenarioLibrary = scenarioLibrary
    .filter(item => item.name.toLowerCase().includes(scenarioSearch.trim().toLowerCase()))
    .filter(item => {
      if (scenarioBaselineFilter === "all" || !pinnedScenario || item.name === pinnedScenarioName) return true;
      const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate"]
        .every(key => item.snapshot[key] === pinnedScenario.snapshot[key]);
      return scenarioBaselineFilter === "like-for-like" ? sameAssumptions : !sameAssumptions;
    })
    .sort((a, b) => {
      if (a.name === pinnedScenarioName && b.name !== pinnedScenarioName) return -1;
      if (b.name === pinnedScenarioName && a.name !== pinnedScenarioName) return 1;
      if (scenarioSort === "name") return a.name.localeCompare(b.name);
      if (scenarioSort === "output") return getScenarioProjection(b.snapshot).good - getScenarioProjection(a.snapshot).good;
      if (scenarioSort === "target") return getScenarioProjection(b.snapshot).gap - getScenarioProjection(a.snapshot).gap;
      if (scenarioSort === "attainment" || scenarioSort === "lowest-attainment") {
        const attainmentDifference = getScenarioProjection(b.snapshot).attainmentPercent - getScenarioProjection(a.snapshot).attainmentPercent;
        if (attainmentDifference !== 0) return scenarioSort === "attainment" ? attainmentDifference : -attainmentDifference;
        return scenarioSort === "attainment"
          ? getScenarioProjection(b.snapshot).good - getScenarioProjection(a.snapshot).good
          : getScenarioProjection(a.snapshot).good - getScenarioProjection(b.snapshot).good;
      }
      return Date.parse(b.snapshot.savedAt) - Date.parse(a.snapshot.savedAt);
    });

  const visibleScenarioSummary = visibleScenarioLibrary.reduce((summary, item) => {
    const projection = getScenarioProjection(item.snapshot);
    summary.totalAttainment += projection.attainmentPercent;
    summary.onTarget += projection.gap >= 0 ? 1 : 0;
    return summary;
  }, { totalAttainment: 0, onTarget: 0 });
  const averageScenarioAttainment = visibleScenarioLibrary.length
    ? visibleScenarioSummary.totalAttainment / visibleScenarioLibrary.length
    : 0;
  const baselineComparedScenarios = pinnedScenarioProjection
    ? visibleScenarioLibrary.filter(item => item.name !== pinnedScenarioName).map(item => {
        const sameOperatingAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate"]
          .every(key => item.snapshot[key] === pinnedScenario.snapshot[key]);
        return {
          name: item.name,
          goodDelta: getScenarioProjection(item.snapshot).good - pinnedScenarioProjection.good,
          sameOperatingAssumptions
        };
      })
    : [];
  const likeForLikeBaselineComparisons = baselineComparedScenarios.filter(item => item.sameOperatingAssumptions);
  const differentAssumptionBaselineComparisons = baselineComparedScenarios.length - likeForLikeBaselineComparisons.length;
  const scenariosAboveBaseline = likeForLikeBaselineComparisons.filter(item => item.goodDelta > 0).length;
  const averageBaselineOutputDelta = likeForLikeBaselineComparisons.length
    ? likeForLikeBaselineComparisons.reduce((total, item) => total + item.goodDelta, 0) / likeForLikeBaselineComparisons.length
    : null;

  if (!mount) return null;
  return createPortal(
    <section className="line-simulator w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8" aria-labelledby="lineSimulatorTitle">
      <section className="factory-department-hub" aria-labelledby="departmentHubTitle">
        <div className="factory-department-heading">
          <div><span className="eyebrow">FACTORY OPERATIONS / DEPARTMENT CONTROL</span><h2 id="departmentHubTitle">Department-wise <em>production control.</em></h2><p>Configure each department independently. Capacity is estimated from shift time, break time, downtime and cycle time. Enter actual completed quantities to compare with today’s target.</p></div>
          <div className="factory-department-live"><span>LIVE TIME</span><strong>{String(dashboardNow.getHours()).padStart(2,"0")}:{String(dashboardNow.getMinutes()).padStart(2,"0")}:{String(dashboardNow.getSeconds()).padStart(2,"0")}</strong><small>{dashboardNow.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</small></div>
          <div className="factory-department-tools">
            <input ref={departmentCsvInput} type="file" accept=".csv,text/csv" onChange={importDepartmentCsv} hidden aria-label="Import department production CSV"/>
            <button type="button" className="factory-department-restore" onClick={()=>departmentCsvInput.current?.click()}>Import CSV ↑</button>
            <button type="button" className="factory-department-restore" onClick={exportDepartmentCsv}>Export CSV ↓</button>
            <button type="button" className="factory-department-restore" onClick={downloadDepartmentClientReport}>Client report ↓</button>
            <button type="button" className="factory-department-restore" onClick={restoreDepartmentSamples}>Restore samples</button>
          </div>
        </div>
        <div className="factory-department-flow" aria-label="Factory department sequence">
          {departments.map((department,index)=><span key={department.id}><b>{String(index+1).padStart(2,"0")}</b>{department.name}{index<departments.length-1?<i>→</i>:null}</span>)}
        </div>
        <div className="factory-department-grid">
          {departments.map((department,index)=>{
            const netSeconds=Math.max(0,department.shiftHours*3600-department.breakMinutes*60-department.downtime*60);
            const capacity=department.cycleSeconds>0?Math.floor(netSeconds/department.cycleSeconds):0;
            const good=Math.max(0,department.actual-department.rejected);
            const gap=good-department.target;
            const yieldPercent=department.actual>0?good/department.actual*100:0;
            return <article className="factory-department-card" key={department.id}>
              <div className="factory-department-card-head"><span>DEPARTMENT {String(index+1).padStart(2,"0")}</span><small>{department.unit.toUpperCase()}</small></div>
              <h3>{department.name}</h3><p>{department.description}</p>
              <div className="factory-department-metrics">
                <div><small>Today target</small><strong>{department.target.toLocaleString("en-IN")}</strong><em>{department.unit}</em></div>
                <div><small>Actual good output</small><strong>{good.toLocaleString("en-IN")}</strong><em>{department.unit}</em></div>
                <div><small>Estimated capacity</small><strong>{capacity.toLocaleString("en-IN")}</strong><em>{department.unit} / shift</em></div>
                <div><small>Target gap</small><strong className={gap>=0?"is-positive":"is-negative"}>{gap>0?"+":""}{gap.toLocaleString("en-IN")}</strong><em>{gap>=0?"ahead":"behind"}</em></div>
              </div>
              <div className="factory-department-settings">
                <div className="factory-department-settings-title">Department settings <span>EDIT VALUES</span></div>
                <label>Daily target<input type="number" min="0" max="100000" value={department.target} onChange={event=>updateDepartment(department.id,"target",event.target.value)}/></label>
                <label>Actual processed<input type="number" min="0" max="100000" value={department.actual} onChange={event=>updateDepartment(department.id,"actual",event.target.value)}/></label>
                <label>Rejected / rework<input type="number" min="0" max="100000" value={department.rejected} onChange={event=>updateDepartment(department.id,"rejected",event.target.value)}/></label>
                <label>Cycle time (sec / unit)<input type="number" min="1" max="3600" value={department.cycleSeconds} onChange={event=>updateDepartment(department.id,"cycleSeconds",event.target.value)}/></label>
                <label>Downtime (minutes)<input type="number" min="0" max="720" value={department.downtime} onChange={event=>updateDepartment(department.id,"downtime",event.target.value)}/></label>
                <label>Shift length (hours)<input type="number" min="1" max="24" value={department.shiftHours} onChange={event=>updateDepartment(department.id,"shiftHours",event.target.value)}/></label>
                <label>Break time (minutes)<input type="number" min="0" max="300" value={department.breakMinutes} onChange={event=>updateDepartment(department.id,"breakMinutes",event.target.value)}/></label>
              </div>
              <div className="factory-department-insight"><span>Production time available</span><strong>{formatDuration(netSeconds)}</strong><span>Yield rate</span><strong>{yieldPercent.toFixed(1)}%</strong><span>Delay against target</span><strong className={gap<0?"is-negative":"is-positive"}>{gap<0?Math.abs(gap)+" "+department.unit+" short":"No quantity delay"}</strong></div>
            </article>;
          })}
        </div>
        <section className="factory-product-tracker" aria-labelledby="productTrackerTitle">
          <div className="factory-product-tracker-heading"><div><span className="eyebrow">INDIVIDUAL PRODUCT TRACEABILITY</span><h3 id="productTrackerTitle">Track each product through every department</h3><p>Enter a unique product, chassis, batch or serial number. Record completion in sequence to capture each department timestamp and total elapsed time.</p></div><button type="button" className="factory-department-restore" onClick={exportProductTraceabilityCsv} disabled={!trackedProducts.length}>Export traceability CSV ↓</button></div>
          <div className="factory-product-entry"><label htmlFor="factoryProductCode">Product / chassis / batch ID</label><div><input id="factoryProductCode" value={productCodeInput} onChange={event=>setProductCodeInput(event.target.value)} placeholder="Example: VEH-2026-0001" maxLength="64"/><button type="button" onClick={addTrackedProduct} disabled={!productCodeInput.trim()}>Start tracking</button></div></div>
          {trackedProducts.length>0?<div className="factory-product-list"><label htmlFor="factoryTrackedProduct">Select tracked product</label><select id="factoryTrackedProduct" value={activeProductId} onChange={event=>setActiveProductId(event.target.value)}>{trackedProducts.map(item=><option key={item.code} value={item.code}>{item.code}</option>)}</select></div>:<p className="factory-product-empty">No product is being tracked yet. Add a product ID to start its department journey.</p>}
          {activeTrackedProduct?<div className="factory-trace-detail">
            <div className="factory-trace-summary"><strong>{activeTrackedProduct.code}</strong><span>Started {new Date(activeTrackedProduct.createdAt).toLocaleString("en-IN")}</span><span>Total elapsed <b>{formatDuration(Math.max(0,Math.floor((dashboardNow-new Date(activeTrackedProduct.createdAt))/1000)))}</b></span></div>
            <div className="factory-trace-steps">{departments.map((department,index)=>{const event=activeTrackedProduct.events[index];const previous=index===0?activeTrackedProduct.createdAt:activeTrackedProduct.events[index-1]?.timestamp;const elapsed=event&&previous?Math.max(0,Math.floor((new Date(event.timestamp)-new Date(previous))/1000)):null;const isNext=index===activeTrackedProduct.events.length;return <div key={department.id} className={event?"is-complete":isNext?"is-current":""}><span>{String(index+1).padStart(2,"0")}</span><strong>{department.name}</strong>{event?<small>Completed {new Date(event.timestamp).toLocaleString("en-IN")} · stage time {formatDuration(elapsed)}</small>:<small>{isNext?"Awaiting completion":"Waiting for previous department"}</small>}<button type="button" disabled={!isNext} onClick={()=>recordDepartmentCompletion(department.id,index)}>{event?"Recorded":isNext?"Record completion":"Locked"}</button></div>;})}</div>
            {activeTrackedProduct.events.length===departments.length?<p className="factory-trace-finished">All departments recorded. Total product lead time: {formatDuration(Math.max(0,Math.floor((new Date(activeTrackedProduct.events[departments.length-1].timestamp)-new Date(activeTrackedProduct.createdAt))/1000)))}.</p>:null}
          </div>:null}
          <small className="factory-sample-note">Timestamps are recorded when an operator clicks “Record completion”. This is manual traceability in this prototype, not an automatic machine or barcode integration.</small>
        </section>
        <section className="factory-overall-summary" aria-labelledby="factoryOverallTitle">
          <div className="factory-overall-heading"><div><span className="eyebrow">END-OF-PAGE / FACTORY-WIDE SUMMARY</span><h3 id="factoryOverallTitle">Today’s overall production view</h3><p>Department totals are shown as a workload summary. They are not summed into a unique finished-vehicle count because departments handle different units and stages.</p></div><span className="factory-summary-date">{dashboardNow.toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</span></div>
          <div className="factory-overall-metrics"><div><small>Combined department targets</small><strong>{departmentTotals.target.toLocaleString("en-IN")}</strong><em>mixed units · not vehicles</em></div><div><small>Good output recorded</small><strong>{departmentTotals.actual.toLocaleString("en-IN")}</strong><em>mixed units · not vehicles</em></div><div><small>Rejected / rework</small><strong>{departmentTotals.rejected.toLocaleString("en-IN")}</strong><em>across departments</em></div><div><small>Total downtime</small><strong>{formatDuration(departmentTotals.downtime*60)}</strong><em>department-minutes summed</em></div><div><small>Target shortfall</small><strong>{departmentTotals.delayed.toLocaleString("en-IN")}</strong><em>department units</em></div></div>
          <div className="factory-department-summary-table"><table><thead><tr><th>Department</th><th>Today target</th><th>Good output</th><th>Rejected</th><th>Capacity estimate</th><th>Delay / gap</th><th>Downtime</th></tr></thead><tbody>{departments.map(department=>{const good=Math.max(0,department.actual-department.rejected);const net=Math.max(0,department.shiftHours*3600-department.breakMinutes*60-department.downtime*60);const capacity=department.cycleSeconds>0?Math.floor(net/department.cycleSeconds):0;const gap=good-department.target;return <tr key={department.id}><th>{department.name}</th><td>{department.target.toLocaleString("en-IN")} {department.unit}</td><td>{good.toLocaleString("en-IN")}</td><td>{department.rejected}</td><td>{capacity.toLocaleString("en-IN")}</td><td className={gap<0?"is-negative":"is-positive"}>{gap>0?"+":""}{gap}</td><td>{formatDuration(department.downtime*60)}</td></tr>;})}</tbody></table></div>
        </section>
        <section className="factory-overall-summary" aria-labelledby="factoryHistoryTitle">
          <div className="factory-overall-heading">
            <div><span className="eyebrow">DAILY RECORDS / HISTORICAL REVIEW</span><h3 id="factoryHistoryTitle">Production history</h3><p>Save a dated snapshot after entering a shift’s figures. Each snapshot preserves all nine department values for later comparison and export.</p></div>
            <div className="factory-department-tools">
              <button type="button" className="factory-department-restore" onClick={saveProductionSnapshot}>Save current snapshot ↓</button>
              <button type="button" className="factory-department-restore" onClick={exportProductionHistoryCsv} disabled={!productionHistory.length}>Export history CSV ↓</button>
            </div>
          </div>
          {productionHistory.length ? <div className="factory-department-summary-table"><table><thead><tr><th>Saved date &amp; time</th><th>Data source</th><th>Departments</th><th>Combined target*</th><th>Good output*</th><th>Rejected records</th><th>Downtime</th></tr></thead><tbody>{productionHistory.map(snapshot=>{const totals=snapshot.departments.reduce((acc,item)=>{const good=Math.max(0,item.actual-item.rejected);return {target:acc.target+item.target,good:acc.good+good,rejected:acc.rejected+item.rejected,downtime:acc.downtime+item.downtime};},{target:0,good:0,rejected:0,downtime:0});return <tr key={snapshot.id}><th>{new Date(snapshot.savedAt).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"})}</th><td>{snapshot.isSampleData?"Illustrative sample":"User entered"}</td><td>{snapshot.departments.length}</td><td>{totals.target.toLocaleString("en-IN")}</td><td>{totals.good.toLocaleString("en-IN")}</td><td>{totals.rejected.toLocaleString("en-IN")}</td><td>{formatDuration(totals.downtime*60)}</td></tr>;})}</tbody></table><p className="factory-sample-note">*Totals combine different units and process stages. They are workload indicators, not unique finished-vehicle counts. Up to 60 snapshots are retained in this browser.</p></div> : <p className="factory-sample-note">No historical snapshots saved yet. Enter the department figures for a shift, then select “Save current snapshot”.</p>}
          {productionHistory.length >= 2 ? <div className="factory-department-comparison">
            <h4>Compare two production snapshots</h4>
            <p className="factory-sample-note">Select any two saved dates. All changes are calculated as second snapshot minus first snapshot. Positive downtime or rejection changes mean those figures increased.</p>
            <div className="factory-department-tools">
              <label>First snapshot<select value={comparisonOlderId || productionHistory[1]?.id || ""} onChange={event=>setComparisonOlderId(event.target.value)}>{productionHistory.map(item=><option key={item.id} value={item.id}>{new Date(item.savedAt).toLocaleString("en-IN")}</option>)}</select></label>
              <label>Second snapshot<select value={comparisonNewerId || productionHistory[0]?.id || ""} onChange={event=>setComparisonNewerId(event.target.value)}>{productionHistory.map(item=><option key={item.id} value={item.id}>{new Date(item.savedAt).toLocaleString("en-IN")}</option>)}</select></label>
            </div>
            {compareNewer && compareOlder && compareNewer.id !== compareOlder.id ? <div className="factory-department-summary-table"><table><thead><tr><th>Department</th><th>Good output change (2 − 1)</th><th>Target change</th><th>Rejected change</th><th>Downtime change</th><th>Yield change</th><th>Assessment</th></tr></thead><tbody>{comparisonDepartments.map(item=><tr key={item.id}><th>{item.name}</th><td className={item.goodDelta>=0?"is-positive":"is-negative"}>{item.goodDelta>0?"+":""}{item.goodDelta} {item.unit}</td><td>{item.targetDelta>0?"+":""}{item.targetDelta} {item.unit}</td><td className={item.rejectedDelta<=0?"is-positive":"is-negative"}>{item.rejectedDelta>0?"+":""}{item.rejectedDelta}</td><td className={item.downtimeDelta<=0?"is-positive":"is-negative"}>{item.downtimeDelta>0?"+":""}{item.downtimeDelta} min</td><td>{item.yieldDelta>0?"+":""}{item.yieldDelta.toFixed(1)} percentage points</td><td>{item.goodDelta>0&&item.rejectedDelta<=0&&item.downtimeDelta<=0?"Improved":item.goodDelta<0||item.rejectedDelta>0||item.downtimeDelta>0?"Review needed":"Mixed / unchanged"}</td></tr>)}</tbody></table><p className="factory-sample-note">Comparison uses the selected snapshot values. Output changes are shown in each department’s own unit; department quantities are not combined into vehicle totals.</p></div> : <p className="factory-sample-note">Choose two different snapshots to display the department comparison.</p>}
          </div> : null}
        </section>

        <section className="factory-overall-summary factory-issue-register" aria-labelledby="factoryIssueTitle">
          <div className="factory-overall-heading"><div><span className="eyebrow">CORRECTIVE ACTION / DEPARTMENT FOLLOW-UP</span><h3 id="factoryIssueTitle">Department issue register</h3><p>Record production problems, confirm root causes, assign corrective actions and track closure. Up to 100 records are stored in this browser.</p></div><button type="button" className="factory-department-restore" onClick={exportDepartmentIssuesCsv} disabled={!departmentIssues.length}>Export issues CSV ↓</button></div>
          <form className="factory-issue-form" onSubmit={addDepartmentIssue}>
            <label>Department<select value={issueDraft.departmentId} onChange={event=>setIssueDraft(current=>({...current,departmentId:event.target.value}))}>{departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Issue / problem<input value={issueDraft.title} maxLength={160} onChange={event=>setIssueDraft(current=>({...current,title:event.target.value}))} placeholder="Example: Material shortage stopped the line" required/></label>
            <label>Root cause<input value={issueDraft.rootCause} maxLength={240} onChange={event=>setIssueDraft(current=>({...current,rootCause:event.target.value}))} placeholder="Confirmed or suspected cause" required/></label>
            <label>Corrective action<input value={issueDraft.correctiveAction} maxLength={300} onChange={event=>setIssueDraft(current=>({...current,correctiveAction:event.target.value}))} placeholder="Action to prevent recurrence" required/></label>
            <label>Assigned owner<input value={issueDraft.owner} maxLength={100} onChange={event=>setIssueDraft(current=>({...current,owner:event.target.value}))} placeholder="Person or responsible team" required/></label>
            <label>Due date<input type="date" value={issueDraft.dueDate} onChange={event=>setIssueDraft(current=>({...current,dueDate:event.target.value}))} required/></label>
            <label>Priority<select value={issueDraft.priority} onChange={event=>setIssueDraft(current=>({...current,priority:event.target.value}))}><option>High</option><option>Medium</option><option>Low</option></select></label>
            <button type="submit" className="factory-department-restore">Add issue +</button>
          </form>
          {departmentIssues.length ? <div className="factory-department-summary-table"><table><thead><tr><th>Issue / department</th><th>Root cause</th><th>Corrective action</th><th>Owner</th><th>Due date</th><th>Priority</th><th>Status</th><th>Resolution notes</th><th>Action</th></tr></thead><tbody>{departmentIssues.map(issue=><tr key={issue.id}><th>{issue.title}<small className="block">{issue.id} · {issue.departmentName || departments.find(item=>item.id===issue.departmentId)?.name}</small></th><td>{issue.rootCause}</td><td>{issue.correctiveAction}</td><td>{issue.owner}</td><td>{issue.dueDate}</td><td>{issue.priority}</td><td><select aria-label={"Status for " + issue.id} value={issue.status} onChange={event=>updateDepartmentIssue(issue.id,{status:event.target.value})}><option>Open</option><option>In progress</option><option>Closed</option><option>On hold</option></select></td><td><input aria-label={"Resolution notes for " + issue.id} value={issue.resolutionNotes || ""} maxLength={300} onChange={event=>updateDepartmentIssue(issue.id,{resolutionNotes:event.target.value})} placeholder="Closure / verification note"/></td><td><button type="button" className="factory-department-restore" onClick={()=>setDepartmentIssues(current=>current.filter(item=>item.id!==issue.id))}>Delete</button></td></tr>)}</tbody></table></div> : <p className="factory-sample-note">No issues recorded. Add the first department issue above when a production problem is identified.</p>}
        </section>

        <section className="factory-overall-summary factory-maintenance-register" aria-labelledby="maintenanceTitle">
          <div className="factory-overall-heading">
            <div><span className="eyebrow">ASSET CARE / PREVENTIVE MAINTENANCE</span><h3 id="maintenanceTitle">Department maintenance register</h3><p>Track equipment breakdowns, service history, assigned technicians and upcoming preventive maintenance. Up to 100 records are saved in this browser.</p></div>
            <button type="button" className="factory-department-restore" onClick={exportMaintenanceCsv} disabled={!maintenanceRecords.length}>Export maintenance CSV ↓</button>
          </div>
          <form className="factory-issue-form" onSubmit={addMaintenanceRecord}>
            <label>Department<select value={maintenanceDraft.departmentId} onChange={event=>setMaintenanceDraft(current=>({...current,departmentId:event.target.value}))}>{departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Equipment / asset<input value={maintenanceDraft.asset} maxLength={120} onChange={event=>setMaintenanceDraft(current=>({...current,asset:event.target.value}))} placeholder="Machine name or asset ID" required/></label>
            <label>Maintenance type<select value={maintenanceDraft.maintenanceType} onChange={event=>setMaintenanceDraft(current=>({...current,maintenanceType:event.target.value}))}><option>Preventive</option><option>Breakdown</option><option>Inspection</option><option>Calibration</option></select></label>
            <label>Service details<input value={maintenanceDraft.serviceDescription} maxLength={300} onChange={event=>setMaintenanceDraft(current=>({...current,serviceDescription:event.target.value}))} placeholder="Work performed or fault observed" required/></label>
            <label>Technician / owner<input value={maintenanceDraft.technician} maxLength={100} onChange={event=>setMaintenanceDraft(current=>({...current,technician:event.target.value}))} placeholder="Responsible technician or team" required/></label>
            <label>Last service date<input type="date" value={maintenanceDraft.lastServiceDate} onChange={event=>setMaintenanceDraft(current=>({...current,lastServiceDate:event.target.value}))} required/></label>
            <label>Next service date<input type="date" min={maintenanceDraft.lastServiceDate || undefined} value={maintenanceDraft.nextServiceDate} onChange={event=>setMaintenanceDraft(current=>({...current,nextServiceDate:event.target.value}))} required/></label>
            <label>Priority<select value={maintenanceDraft.priority} onChange={event=>setMaintenanceDraft(current=>({...current,priority:event.target.value}))}><option>High</option><option>Medium</option><option>Low</option></select></label>
            <button type="submit" className="factory-department-restore">Add maintenance +</button>
          </form>
          {maintenanceRecords.length ? <div className="factory-department-summary-table"><table><thead><tr><th>Equipment / department</th><th>Type and service details</th><th>Technician</th><th>Last service</th><th>Next service</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead><tbody>{maintenanceRecords.map(record=><tr key={record.id}><th>{record.asset}<small className="block">{record.id} · {record.departmentName || departments.find(item=>item.id===record.departmentId)?.name}</small></th><td>{record.maintenanceType}<small className="block">{record.serviceDescription}</small></td><td>{record.technician}</td><td>{record.lastServiceDate}</td><td>{record.nextServiceDate}</td><td>{record.priority}</td><td><select aria-label={"Maintenance status for " + record.id} value={record.status} onChange={event=>updateMaintenanceRecord(record.id,{status:event.target.value})}><option>Scheduled</option><option>In progress</option><option>Completed</option><option>Overdue</option><option>On hold</option></select></td><td><button type="button" className="factory-department-restore" onClick={()=>setMaintenanceRecords(current=>current.filter(item=>item.id!==record.id))}>Delete</button></td></tr>)}</tbody></table></div> : <p className="factory-sample-note">No maintenance activities recorded yet. Add an equipment service or breakdown record above.</p>}
        </section>
        <p className="factory-sample-note" role="status">{departmentDataMessage}</p><p className="factory-sample-note">All starting department values are illustrative sample figures. Replace them with verified daily production records before presenting operational performance to a client.</p>
      </section>
      <div className="line-simulator-heading">
        <div>
          <span className="eyebrow">JAVASCRIPT PROJECT / 09</span>
          <h2 id="lineSimulatorTitle">Test the <em>production line.</em></h2>
          <p>Change station cycle times and shift conditions to understand how a bottleneck affects the output of a balanced production line.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-2" aria-label="Live local dashboard clock">
            <span className="text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Live local time</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="min-w-[58px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                <strong className="block font-mono text-2xl tabular-nums text-slate-900">{String(dashboardNow.getHours()).padStart(2, "0")}</strong>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hours</span>
              </div>
              <div className="min-w-[58px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                <strong className="block font-mono text-2xl tabular-nums text-slate-900">{String(dashboardNow.getMinutes()).padStart(2, "0")}</strong>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Minutes</span>
              </div>
              <div className="min-w-[58px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                <strong className="block font-mono text-2xl tabular-nums text-slate-900">{String(dashboardNow.getSeconds()).padStart(2, "0")}</strong>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Seconds</span>
              </div>
            </div>
            <span className="text-right text-[10px] text-slate-500">{dashboardNow.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <button className="line-reset" type="button" onClick={reset}>Reset example ↺</button>
        </div>
      </div>

      <div className="line-sim-layout">
        <div className="line-sim-controls">
          <div className="line-sim-section-title"><span>01 / STATION CYCLE TIMES</span><small>SECONDS PER VEHICLE</small></div>
          {stations.map((station, index) => {
            const isBottleneck = station.seconds === result.bottleneck;
  return (
              <div className={`line-station-row${isBottleneck ? " is-bottleneck" : ""}`} key={station.name}>
                <div className="line-station-top">
                  <label htmlFor={`station-${index}`}>{station.name}</label>
                  <div className="line-station-value">
                    <input
                      aria-label={`${station.name} cycle time in seconds`}
                      type="number"
                      min="20"
                      max="180"
                      step="1"
                      value={station.seconds}
                      onChange={event => {
                        const value = event.target.value;
                        if (value !== "" && Number(value) >= 20 && Number(value) <= 180) updateStation(index, value);
                      }}
                    />
                    {isBottleneck ? <strong>BOTTLENECK</strong> : null}
                  </div>
                </div>
                <input id={`station-${index}`} aria-label={`${station.name} cycle time slider`} type="range" min="20" max="180" step="1" value={station.seconds} onChange={event => updateStation(index, event.target.value)} />
                <div className="line-station-scale"><span>20s</span><span>180s</span></div>
              </div>
            );
          })}
          <div className="line-sim-section-title line-sim-settings-title"><span>02 / SHIFT SETTINGS</span><small>EDIT THE ASSUMPTIONS</small></div>
          <div className="line-settings-grid">
            <label>Shift length <strong>{shiftHours} hours</strong><input type="range" min="4" max="12" step="1" value={shiftHours} onChange={event => setShiftHours(Number(event.target.value))}/></label>
            <label>Break time <strong>{breakMinutes} min</strong><input type="range" min="0" max="120" step="5" value={breakMinutes} onChange={event => setBreakMinutes(Number(event.target.value))}/></label>
            <label>Line availability <strong>{availability}%</strong><input type="range" min="50" max="100" step="1" value={availability} onChange={event => setAvailability(Number(event.target.value))}/></label>
            <label>Quality yield <strong>{yieldRate}%</strong><input type="range" min="70" max="100" step="1" value={yieldRate} onChange={event => setYieldRate(Number(event.target.value))}/></label>
            <label className="line-target-setting">Shift production target <strong>{target} vehicles</strong><input type="range" min="50" max="700" step="10" value={target} onChange={event => setTarget(Number(event.target.value))}/></label>
          </div>
        </div>

        <aside className="line-sim-results" aria-live="polite">
          <span className="eyebrow">LIVE SIMULATION RESULT</span>
          <div className="line-output-number"><strong>{result.goodUnits.toLocaleString("en-IN")}</strong><span>estimated good vehicles / shift</span></div>
          <div className="line-result-status">
            <span>{result.gap >= 0 ? "ABOVE TARGET" : "BELOW TARGET"}</span>
            <strong>{result.gap >= 0 ? "+" : ""}{result.gap.toLocaleString("en-IN")} vehicles</strong>
          </div>
          <div className="line-result-list">
            <div><span>Slowest station</span><strong>{result.bottleneckName}</strong></div>
            <div><span>Bottleneck cycle time</span><strong>{formatDuration(result.bottleneck)} / vehicle</strong></div>
            <div><span>Net production time</span><strong>{formatMinutesAsClock(result.netMinutes)} ({result.netMinutes} min)</strong></div>
            <div><span>Ideal line capacity</span><strong>{result.ideal} vehicles</strong></div>
            <div><span>After availability</span><strong>{result.available} vehicles</strong></div>
            <div><span>Good output per hour</span><strong>{result.hourly.toFixed(1)} vehicles</strong></div>
            <div><span>Target takt time · before losses</span><strong>{result.taktSeconds.toFixed(1)} sec / vehicle</strong></div>
          </div>
          <div className="line-target-meter">
            <div><span>OUTPUT VS TARGET</span><strong>{target > 0 ? Math.min(100, result.goodUnits / target * 100).toFixed(0) : 0}%</strong></div>
            <p className="mt-2 text-sm text-slate-600">{result.goodUnits.toLocaleString("en-IN")} good vehicles produced against a target of {target.toLocaleString("en-IN")}.</p>
          </div>
          <div className="factory-chart-toolbar">
            <div><span className="eyebrow">LIVE PRODUCTION ANALYTICS</span><p>Four chart views update as you change the simulator settings.</p></div>
            <div className="factory-chart-actions">
              <button className="line-reset" type="button" onClick={exportSimulation}>Export CSV ↓</button>
              <button className="line-reset" type="button" aria-expanded={showDataTable} onClick={() => setShowDataTable(value => !value)}>{showDataTable ? "Hide data table −" : "View data table ≡"}</button>
              <button className="line-reset" type="button" aria-expanded={showImprovementPlanner} onClick={() => {
                if (!showImprovementPlanner) setProposedCycleTimes(stations.map(station => station.seconds));
                setShowImprovementPlanner(value => !value);
              }}>{showImprovementPlanner ? "Hide improvement planner −" : "Improve line ↗"}</button>
              <button className="line-reset" type="button" aria-expanded={chartEditMode} onClick={() => setChartEditMode(value => !value)}>{chartEditMode ? "Done editing ✓" : "Edit charts ⚙"}</button>
            </div>
          </div>
          <section className="factory-weekly-dashboard mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Weekly manufacturing production dashboard">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="eyebrow">WEEKLY OPERATIONS / 7-DAY VIEW</span>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Manufacturing performance dashboard</h3>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">Review daily output, quality losses and downtime across the production week. Select a day to inspect its production result.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="line-reset" onClick={() => weeklyCsvInput.current?.click()}>Upload weekly CSV ↑</button>
                <input ref={weeklyCsvInput} type="file" accept=".csv,text/csv" onChange={importWeeklyProductionCsv} hidden aria-label="Upload weekly manufacturing CSV" />
                <button type="button" className="line-reset" onClick={exportWeeklyProductionCsv}>Export weekly CSV ↓</button>
                <button type="button" className="line-reset" onClick={() => { setWeeklyProduction(initialWeeklyProduction); setSelectedProductionDay("Monday"); setWeeklyDataMessage("Restored illustrative one-week sample data."); }}>Restore sample</button>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600" role="status">{weeklyDataMessage}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Weekly planned</span><strong className="mt-1 block text-2xl text-slate-900">{weeklySummary.planned.toLocaleString("en-IN")}</strong><small className="text-slate-500">vehicles</small></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Good output</span><strong className="mt-1 block text-2xl text-slate-900">{weeklySummary.good.toLocaleString("en-IN")}</strong><small className="text-slate-500">vehicles</small></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Rejected</span><strong className="mt-1 block text-2xl text-slate-900">{weeklySummary.rejected.toLocaleString("en-IN")}</strong><small className="text-slate-500">vehicles</small></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Target attainment</span><strong className="mt-1 block text-2xl text-slate-900">{weeklyAttainment.toFixed(1)}%</strong><small className="text-slate-500">good / planned</small></div>
              <div className="rounded-xl bg-slate-50 p-3 col-span-2 sm:col-span-1"><span className="block text-xs text-slate-500">Downtime</span><strong className="mt-1 block text-2xl text-slate-900">{weeklySummary.downtime}</strong><small className="text-slate-500">minutes / week</small></div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,.8fr)]">
              <div className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-slate-800">Daily good production trend</strong><span className="text-xs text-slate-500">vehicles / day · sample week</span></div>
                <div className="mt-3 overflow-x-auto">
                  <svg viewBox="0 0 600 145" role="img" aria-label="Line chart showing daily good production across the week" className="h-auto min-w-[460px] w-full">
                    {[30,69,108].map(y => <line key={y} x1="18" x2="582" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 5"/> )}
                    <polyline points={weeklyLinePoints} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    {weeklyProduction.map((day,index) => {
                      const x = 24 + index * 92;
                      const y = 108 - day.good / weeklyPeak * 78;
                      return <g key={day.day}><circle cx={x} cy={y} r={selectedProductionDay===day.day?6:4} fill={selectedProductionDay===day.day?"#0f766e":"#64748b"}/><text x={x} y="132" textAnchor="middle" fontSize="11" fill="#64748b">{day.day.slice(0,3)}</text><text x={x} y={Math.max(14,y-10)} textAnchor="middle" fontSize="10" fill="#334155">{day.good}</text></g>;
                    })}
                  </svg>
                </div>
                <div className="mt-2 flex flex-wrap gap-2" aria-label="Select production day">
                  {weeklyProduction.map(day => <button key={day.day} type="button" onClick={() => setSelectedProductionDay(day.day)} aria-pressed={selectedProductionDay===day.day} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${selectedProductionDay===day.day?"border-teal-700 bg-teal-50 text-teal-900":"border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{day.day}</button>)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected day / production detail</span>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">{selectedDayProduction.day}</h4>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-600">Planned production</span><strong>{selectedDayProduction.planned}</strong></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-600">Good vehicles</span><strong>{selectedDayProduction.good}</strong></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-600">Rejected vehicles</span><strong>{selectedDayProduction.rejected}</strong></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-600">Downtime</span><strong>{selectedDayProduction.downtime} min</strong></div>
                  <div className="border-t border-slate-100 pt-3"><div className="flex justify-between text-sm"><span className="text-slate-600">Daily attainment</span><strong>{selectedDayProduction.planned>0?(selectedDayProduction.good/selectedDayProduction.planned*100).toFixed(1):"—"}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{width:`${selectedDayProduction.planned>0?clamp(selectedDayProduction.good/selectedDayProduction.planned*100,0,100):0}%`}}/></div></div>
                </div>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Day</th><th className="px-3 py-3 text-right">Planned</th><th className="px-3 py-3 text-right">Good</th><th className="px-3 py-3 text-right">Rejected</th><th className="px-3 py-3 text-right">Attainment</th><th className="px-3 py-3 text-right">Downtime</th></tr></thead>
                <tbody>{weeklyProduction.map(day => <tr key={day.day} className={selectedProductionDay===day.day?"bg-teal-50/60":"border-t border-slate-100"}><th className="px-3 py-3 font-medium text-slate-800"><button type="button" onClick={() => setSelectedProductionDay(day.day)} className="underline-offset-2 hover:underline">{day.day}</button></th><td className="px-3 py-3 text-right tabular-nums">{day.planned}</td><td className="px-3 py-3 text-right tabular-nums">{day.good}</td><td className="px-3 py-3 text-right tabular-nums">{day.rejected}</td><td className="px-3 py-3 text-right tabular-nums">{day.planned>0?(day.good/day.planned*100).toFixed(1)+"%":"—"}</td><td className="px-3 py-3 text-right tabular-nums">{day.downtime} min</td></tr>)}</tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold"><tr><th className="px-3 py-3">Weekly total</th><td className="px-3 py-3 text-right">{weeklySummary.planned}</td><td className="px-3 py-3 text-right">{weeklySummary.good}</td><td className="px-3 py-3 text-right">{weeklySummary.rejected}</td><td className="px-3 py-3 text-right">{weeklyAttainment.toFixed(1)}%</td><td className="px-3 py-3 text-right">{weeklySummary.downtime} min</td></tr></tfoot>
              </table>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">Sample figures are illustrative and independent of the live cycle-time simulator above. CSV import expects exactly seven rows with columns Day, Planned, Good, Rejected and Downtime. Sunday may be entered as zero for a non-production day.</p>
          </section>
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Station-wise manufacturing performance">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="eyebrow">PROCESS BREAKDOWN / 7 STATIONS</span>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Station-wise performance</h3>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">Compare processed units, rejects, downtime and average cycle time at each manufacturing stage.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="line-reset" onClick={() => stationCsvInput.current?.click()}>Upload station CSV ↑</button>
                <input ref={stationCsvInput} type="file" accept=".csv,text/csv" onChange={importStationPerformanceCsv} hidden aria-label="Upload station performance CSV" />
                <button type="button" className="line-reset" onClick={exportStationPerformanceCsv}>Export station CSV ↓</button>
                <button type="button" className="line-reset" onClick={downloadStationCsvTemplate}>Download CSV template ↓</button>
                <button type="button" className="line-reset" onClick={downloadClientReviewReport}>Download client report ↓</button>
                <button type="button" className="line-reset" onClick={() => { setStationPerformance(initialStationPerformance); setStationDataMessage("Restored illustrative station-level sample data."); }}>Restore sample</button>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600" role="status">{stationDataMessage}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Client data workflow: download the CSV template, replace the example numbers with the same reporting period's plant records, retain all seven station names, then upload the completed file. Do not mix daily, weekly or shift figures in one upload.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Units processed</span><strong className="mt-1 block text-2xl text-slate-900">{stationPerformanceSummary.processed.toLocaleString("en-IN")}</strong></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Station rejects</span><strong className="mt-1 block text-2xl text-slate-900">{stationPerformanceSummary.rejected.toLocaleString("en-IN")}</strong></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Recorded downtime</span><strong className="mt-1 block text-2xl text-slate-900">{stationPerformanceSummary.downtime} min</strong></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Station yield</span><strong className="mt-1 block text-2xl text-slate-900">{stationPerformanceSummary.yieldPercent.toFixed(1)}%</strong></div>
            </div>
            <section className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4" aria-label="Client review summary">
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-800">CLIENT REVIEW / MANAGEMENT SUMMARY</span>
              <h4 className="mt-1 text-lg font-semibold text-slate-900">What this production data tells us</h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">Across the seven reported stations, <strong>{stationPerformanceSummary.processed.toLocaleString("en-IN")} station operations</strong> and <strong>{stationPerformanceSummary.rejected.toLocaleString("en-IN")} station rejection records</strong> have been captured, with <strong>{stationPerformanceSummary.downtime} minutes</strong> of recorded downtime. The calculated station yield is <strong>{stationPerformanceSummary.yieldPercent.toFixed(1)}%</strong>.</p>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="rounded-lg bg-white/80 p-3">
                  <span className="block text-xs text-slate-500">First area to review</span>
                  <strong className="mt-1 block text-sm text-slate-900">{stationPerformanceSummary.bottleneck.name}</strong>
                  <p className="mt-1 text-xs text-slate-600">Longest average cycle time: {formatDuration(stationPerformanceSummary.bottleneck.avgCycleSeconds)}.</p>
                </div>
                <div className="rounded-lg bg-white/80 p-3">
                  <span className="block text-xs text-slate-500">Downtime focus</span>
                  <strong className="mt-1 block text-sm text-slate-900">{stationPerformanceSummary.downtimeLeader.name}</strong>
                  <p className="mt-1 text-xs text-slate-600">{formatMinutesAsClock(stationPerformanceSummary.downtimeLeader.downtime)} recorded downtime; review its stoppage cause.</p>
                </div>
                <div className="rounded-lg bg-white/80 p-3">
                  <span className="block text-xs text-slate-500">Quality focus</span>
                  <strong className="mt-1 block text-sm text-slate-900">{stationPerformanceSummary.topDefect[0]}</strong>
                  <p className="mt-1 text-xs text-slate-600">{stationPerformanceSummary.topDefect[1]} recorded rejects in this category.</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600"><strong>Suggested client discussion:</strong> validate the bottleneck's cycle time, investigate the main downtime cause, and confirm the top defect's root cause before agreeing improvement actions. These totals are station-level records, not unique vehicle counts. Use a common reporting period and actual plant data before making production or financial decisions.</p>
            </section>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">Slowest recorded station</span>
                <div className="mt-1 flex items-baseline justify-between gap-2"><strong className="text-slate-900">{stationPerformanceSummary.bottleneck.name}</strong><strong className="text-lg text-slate-900">{formatDuration(stationPerformanceSummary.bottleneck.avgCycleSeconds)}</strong></div>
                <p className="mt-1 text-xs text-slate-600">Highest average cycle time in this station dataset.</p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-sky-800">Highest recorded downtime</span>
                <div className="mt-1 flex items-baseline justify-between gap-2"><strong className="text-slate-900">{stationPerformanceSummary.downtimeLeader.name}</strong><strong className="text-lg text-slate-900">{formatMinutesAsClock(stationPerformanceSummary.downtimeLeader.downtime)}</strong></div>
                <p className="mt-1 text-xs text-slate-600">Prioritize this station when reviewing stoppage causes.</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Manufacturing station</th><th className="px-3 py-3 text-right">Processed</th><th className="px-3 py-3 text-right">Rejected</th><th className="px-3 py-3 text-right">Reject rate</th><th className="px-3 py-3 text-right">Downtime</th><th className="px-3 py-3 text-right">Avg cycle</th></tr></thead>
                <tbody>{stationPerformance.map(station => {
                  const rejectRate = station.processed > 0 ? station.rejected / station.processed * 100 : 0;
                  const isBottleneck = station.name === stationPerformanceSummary.bottleneck.name;
                  return <tr key={station.name} className="border-t border-slate-100">
                    <th className="px-3 py-3 font-medium text-slate-800">{station.name}{isBottleneck && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">Slowest</span>}</th>
                    <td className="px-3 py-3 text-right tabular-nums">{station.processed}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{station.rejected}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{rejectRate.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatMinutesAsClock(station.downtime)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatDuration(station.avgCycleSeconds)}</td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
            <section className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/30 p-4" aria-label="Manufacturing improvement action register">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-800">CONTINUOUS IMPROVEMENT / ACTION TRACKING</span>
                  <h4 className="mt-1 text-lg font-semibold text-slate-900">Improvement action register</h4>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">Starter actions are generated from the current station dataset. Edit the issue, action, owner, due date and KPI with the factory team; export the agreed register for follow-up.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="line-reset" onClick={addImprovementAction}>Add action +</button>
                  <button type="button" className="line-reset" onClick={exportImprovementActions}>Export action register ↓</button>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {improvementActions.map((action, index) => (
                  <article key={action.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-slate-900">Action {String(index + 1).padStart(2, "0")}</strong>
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={action.id + "-priority"}>Priority</label>
                        <select id={action.id + "-priority"} value={action.priority} onChange={event => updateImprovementAction(action.id, "priority", event.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700">
                          <option>High</option><option>Medium</option><option>Low</option>
                        </select>
                        <label className="sr-only" htmlFor={action.id + "-status"}>Action status</label>
                        <select id={action.id + "-status"} value={action.status} onChange={event => updateImprovementAction(action.id, "status", event.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700">
                          <option>Not started</option><option>In progress</option><option>Blocked</option><option>Completed</option>
                        </select>
                        {action.id.startsWith("custom-") && <button type="button" className="text-xs font-medium text-rose-700" onClick={() => setImprovementActions(current => current.filter(item => item.id !== action.id))}>Remove</button>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="block text-xs font-medium text-slate-600">Observed issue
                        <textarea rows={2} value={action.issue} onChange={event => updateImprovementAction(action.id, "issue", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-none" />
                      </label>
                      <label className="block text-xs font-medium text-slate-600">Recommended action
                        <textarea rows={2} value={action.action} onChange={event => updateImprovementAction(action.id, "action", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-none" />
                      </label>
                      <label className="block text-xs font-medium text-slate-600">Responsible owner / team
                        <input value={action.owner} onChange={event => updateImprovementAction(action.id, "owner", event.target.value)} placeholder="Enter person or department" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-none" />
                      </label>
                      <label className="block text-xs font-medium text-slate-600">KPI to verify
                        <input value={action.kpi} onChange={event => updateImprovementAction(action.id, "kpi", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-none" />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="text-xs font-medium text-slate-600">Due date <input type="date" value={action.dueDate} onChange={event => updateImprovementAction(action.id, "dueDate", event.target.value)} className="ml-2 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700" /></label>
                      <span className="text-xs text-slate-500">Confirm the baseline and target value with the plant team before closing this action.</span>
                    </div>
                  </article>
                ))}
              </div>
              {actionExportMessage && <p className="mt-3 text-xs text-emerald-700" role="status">{actionExportMessage}</p>}
              <p className="mt-3 text-xs leading-relaxed text-slate-500">These are suggested starting points based on the uploaded station figures, not verified root causes. Assign an owner and agree a measurable target before treating an action as approved.</p>
            </section>
            <section className="mt-5 rounded-xl border border-slate-200 p-4" aria-label="Seven station production flow">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="eyebrow">UNIT MOVEMENT / UPSTREAM TO DOWNSTREAM</span>
                  <h4 className="mt-1 text-lg font-semibold text-slate-900">Production flow across seven stations</h4>
                  <p className="mt-1 text-sm text-slate-600">Follow good units and station rejects through the manufacturing sequence.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Flow view · no bar charts</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stationPerformance.map((station, index) => {
                  const stageDescriptions = [
                    "Presses sheet metal into panels used for the vehicle body.",
                    "Joins stamped panels to build the vehicle body structure.",
                    "Cleans and prepares metal surfaces before painting.",
                    "Applies and cures paint for appearance and corrosion protection.",
                    "Prepares engine or motor, transmission and related powertrain parts.",
                    "Fits major components, electrical systems, interior and exterior parts.",
                    "Performs final visual, dimensional and functional checks before release."
                  ];
                  const goodOutput = Math.max(0, station.processed - station.rejected);
                  const upstreamGood = index > 0
                    ? Math.max(0, stationPerformance[index - 1].processed - stationPerformance[index - 1].rejected)
                    : null;
                  const flowDifference = upstreamGood === null ? null : upstreamGood - station.processed;
                  return (
                    <article key={station.name} className="relative rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">STAGE {String(index + 1).padStart(2, "0")}</span>
                        {station.name === stationPerformanceSummary.bottleneck.name
                          ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-900">Slowest</span>
                          : null}
                      </div>
                      <h5 className="mt-2 text-sm font-semibold text-slate-900">{station.name}</h5>
                      <p className="mt-1 min-h-[3.25rem] text-xs leading-relaxed text-slate-600"><span className="font-semibold text-slate-700">What happens here:</span> {stageDescriptions[index] || "Records production activity at this manufacturing stage."}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-slate-50 p-2">
                          <span className="block text-[10px] text-slate-500">Processed</span>
                          <strong className="mt-1 block text-xl tabular-nums text-slate-900">{station.processed.toLocaleString("en-IN")}</strong>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2">
                          <span className="block text-[10px] text-emerald-700">Good output</span>
                          <strong className="mt-1 block text-xl tabular-nums text-emerald-900">{goodOutput.toLocaleString("en-IN")}</strong>
                        </div>
                        <div className="rounded-lg bg-rose-50 p-2">
                          <span className="block text-[10px] text-rose-700">Rejected here</span>
                          <strong className="mt-1 block text-lg tabular-nums text-rose-900">{station.rejected.toLocaleString("en-IN")}</strong>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <span className="block text-[10px] text-slate-500">Cycle time</span>
                          <strong className="mt-1 block text-sm tabular-nums text-slate-900">{formatDuration(station.avgCycleSeconds)}</strong>
                        </div>
                      </div>
                      {index > 0 && (
                        <div className={`mt-3 rounded-lg p-2 text-xs ${flowDifference > 0 ? "bg-amber-50 text-amber-900" : flowDifference < 0 ? "bg-sky-50 text-sky-900" : "bg-slate-50 text-slate-600"}`}>
                          <span className="block font-semibold">{flowDifference > 0 ? `Potential queue: +${flowDifference} units` : flowDifference < 0 ? `Prior WIP drawdown / mismatch: ${Math.abs(flowDifference)} units` : "No throughput difference"}</span>
                          <span className="mt-1 block opacity-80">Previous station good output: {upstreamGood.toLocaleString("en-IN")} · processed here: {station.processed.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {index < stationPerformance.length - 1 && <span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 xl:flex">→</span>}
                    </article>
                  );
                })}
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <strong className="text-xs font-semibold uppercase tracking-wide text-slate-700">How to explain these figures to a client</strong>
                <dl className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div><dt className="font-semibold text-slate-800">Processed</dt><dd>Total units that entered or were handled by this station during the selected reporting period.</dd></div>
                  <div><dt className="font-semibold text-emerald-800">Good output</dt><dd>Processed units minus rejects recorded at this station.</dd></div>
                  <div><dt className="font-semibold text-rose-800">Rejected here</dt><dd>Units rejected at this stage; this is a station-level count, not necessarily unique vehicle losses.</dd></div>
                  <div><dt className="font-semibold text-slate-800">Cycle time</dt><dd>Average time taken to process one unit at this station.</dd></div>
                  <div><dt className="font-semibold text-slate-800">Potential queue</dt><dd>Estimated difference between the previous station's good output and this station's processed count.</dd></div>
                </dl>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">Queue differences are estimates only: they compare the previous station's good output with the next station's processed count. They are meaningful only when both stations use the same reporting period and unit definition. A negative difference may indicate opening WIP consumption or mismatched data. For an accurate live WIP count, record opening WIP, closing WIP or unit-level movement. Sample figures are illustrative until replaced with actual production data.</p>
            </section>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <strong className="text-sm text-slate-800">Defect category breakdown</strong><span className="ml-2 text-xs text-slate-500">Rejected units</span>
                <div className="mt-3 space-y-3">{Object.entries(stationPerformanceSummary.defects).sort((a,b)=>b[1]-a[1]).map(([category,count]) => <div key={category} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0"><span className="text-sm text-slate-600">{category}</span><strong className="text-sm tabular-nums">{count}</strong></div>)}</div>
                <p className="mt-2 text-xs text-slate-500">Most recorded rejects: <strong>{stationPerformanceSummary.topDefect[0]}</strong> ({stationPerformanceSummary.topDefect[1]} units).</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <strong className="text-sm text-slate-800">Downtime cause breakdown</strong><span className="ml-2 text-xs text-slate-500">Minutes</span>
                <div className="mt-3 space-y-3">{Object.entries(stationPerformanceSummary.downtimeCauses).sort((a,b)=>b[1]-a[1]).map(([cause,minutes]) => <div key={cause} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0"><span className="text-sm text-slate-600">{cause}</span><strong className="text-sm tabular-nums">{minutes} min</strong></div>)}</div>
                <p className="mt-2 text-xs text-slate-500">Largest recorded cause: <strong>{stationPerformanceSummary.topDowntimeCause[0]}</strong> ({stationPerformanceSummary.topDowntimeCause[1]} min).</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
              <strong className="text-sm text-slate-900">Improvement review priorities</strong>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                <li>Review <strong>{stationPerformanceSummary.bottleneck.name}</strong> first: it has the longest average cycle time ({stationPerformanceSummary.bottleneck.avgCycleSeconds}s).</li>
                <li>Investigate <strong>{stationPerformanceSummary.downtimeLeader.name}</strong> and its recorded cause, <strong>{stationPerformanceSummary.downtimeLeader.downtimeCause || "Not specified"}</strong> ({formatMinutesAsClock(stationPerformanceSummary.downtimeLeader.downtime)}).</li>
                <li>Start defect containment at <strong>{stationPerformance.find(station => station.defectCategory === stationPerformanceSummary.topDefect[0])?.name || "the reporting station"}</strong> for <strong>{stationPerformanceSummary.topDefect[0]}</strong>; verify the root cause before changing the process.</li>
              </ol>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">Station sample figures and causes are illustrative, not measured factory data. CSV requires the seven station names and columns Station, Processed, Rejected, Downtime, AvgCycleTime. Optional columns: DefectCategory and DowntimeCause. Older station CSV files remain supported; missing categories appear as Not specified.</p>
          </section>
          {chartEditMode && (
            <div className="factory-chart-editor" aria-label="Edit chart visibility and titles">
              <div className="factory-chart-editor-heading"><strong>Customize chart view</strong><small>Show or hide charts and rename their headings.</small></div>
              {[
                ["radar", "01 / Radar chart"],
                ["capacity", "02 / Capacity rings"],
                ["ratios", "03 / Operating conditions"],
                ["losses", "04 / Loss analysis"]
              ].map(([key, label]) => (
                <div className="factory-chart-editor-row" key={key}>
                  <label className="factory-chart-toggle"><input type="checkbox" checked={chartVisibility[key]} onChange={event => setChartVisibility(current => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>
                  <input aria-label={label + " title"} type="text" maxLength={48} value={chartTitles[key]} onChange={event => setChartTitles(current => ({ ...current, [key]: event.target.value }))} />
                </div>
              ))}
              <button type="button" className="line-reset" onClick={() => { setChartVisibility({ radar: true, capacity: true, ratios: true, losses: true }); setChartTitles(defaultChartTitles); }}>Restore chart defaults</button>
            </div>
          )}
          {showImprovementPlanner && (
            <section className="factory-improvement-planner" aria-label="Station improvement planner">
              <div className="factory-improvement-heading">
                <div><span>WHAT-IF ANALYSIS / LINE BALANCING</span><h3>Test station improvements</h3><p>Enter a proposed cycle time for each station. Compare the projected shift output with the current simulation.</p></div>
                <div className="factory-improvement-actions">
                  <button type="button" className="line-reset" onClick={exportImprovementScenario}>Export scenario CSV ↓</button>
                  <button type="button" className="line-reset" onClick={copyScenarioSummary}>Copy summary</button>
                  <button type="button" className="line-reset" onClick={exportScenarioJson}>Export JSON ↓</button>
                  <button type="button" className="line-reset" onClick={() => scenarioFileInput.current?.click()}>Import JSON ↑</button>
                  <input ref={scenarioFileInput} type="file" accept=".json,application/json" onChange={importScenarioJson} className="sr-only" aria-label="Import factory improvement scenario JSON" />
                  <button type="button" className="line-reset" onClick={saveImprovementScenario}>Save scenario</button>
                  <button type="button" className="line-reset" onClick={loadImprovementScenario} disabled={!savedScenario}>Load saved</button>
                  <button type="button" className="line-reset" onClick={() => setProposedCycleTimes(stations.map(station => station.seconds))}>Copy current times</button>
                  <button type="button" className="line-reset" onClick={() => setProposedCycleTimes(stations.map((station, index) => Math.min(station.seconds, clamp(improvement.requiredCycle, 20, 180))))}>Apply target pace</button>
                </div>
              </div>
              {scenarioSaveMessage && <p className="factory-scenario-save-message" role="status">{scenarioSaveMessage}</p>}
              <div className="factory-named-scenarios">
                <label htmlFor="factoryScenarioName">Save a named version</label>
                <div className="factory-named-scenario-controls">
                  <input id="factoryScenarioName" type="text" maxLength="48" value={scenarioName} onChange={event => setScenarioName(event.target.value)} placeholder="e.g. Higher output target" />
                  <button type="button" className="line-reset" onClick={saveNamedScenario}>Save named scenario</button>
                </div>
                <small className="factory-scenario-capacity" aria-live="polite">{scenarioLibrary.length} of 10 named scenarios saved{scenarioLibrary.length >= 10 ? " · Library full — delete one to add another" : " · You can save up to 10"}</small>
                <div className="factory-scenario-library-actions">
                  <button type="button" className="line-reset" onClick={exportScenarioLibraryJson} disabled={scenarioLibrary.length === 0}>Export library JSON</button>
                  <button type="button" className="line-reset" onClick={exportScenarioLibraryCsv} disabled={scenarioLibrary.length === 0}>Export library CSV</button>
                  <button type="button" className="line-reset" onClick={copyVisibleScenarioSummary} disabled={visibleScenarioLibrary.length === 0}>Copy visible overview</button>
                  <button type="button" className="line-reset" onClick={() => scenarioLibraryFileInput.current?.click()}>Import library JSON</button>
                  <input ref={scenarioLibraryFileInput} type="file" accept=".json,application/json" aria-label="Import named scenario library JSON" onChange={importScenarioLibraryJson} hidden />
                </div>
                {scenarioLibrary.length > 0 && <>
                  <div className="factory-scenario-library-filter">
                    <label htmlFor="factoryScenarioSearch">Find a saved scenario</label>
                    <input id="factoryScenarioSearch" type="search" value={scenarioSearch} onChange={event => setScenarioSearch(event.target.value)} placeholder="Search scenario names..." />
                    {scenarioSearch && <button type="button" className="line-reset factory-scenario-clear-search" onClick={() => setScenarioSearch("")}>Clear search</button>}
                    <small>Showing {visibleScenarioLibrary.length} of {scenarioLibrary.length} saved scenarios</small>
                    <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-5" aria-live="polite" aria-label="Saved scenario summary">
                      <div><span className="block text-xs text-slate-500">Average target attainment</span><strong className="text-base">{averageScenarioAttainment.toFixed(1)}%</strong></div>
                      <div><span className="block text-xs text-slate-500">Scenarios meeting target</span><strong className="text-base">{visibleScenarioSummary.onTarget} / {visibleScenarioLibrary.length}</strong></div>
                      <div><span className="block text-xs text-slate-500">Below target</span><strong className="text-base">{visibleScenarioLibrary.length - visibleScenarioSummary.onTarget}</strong></div>
                      {pinnedScenarioProjection && <><div><span className="block text-xs text-slate-500">Outperforming baseline (like-for-like)</span><strong className="text-base">{scenariosAboveBaseline} / {likeForLikeBaselineComparisons.length}</strong></div><div><span className="block text-xs text-slate-500">Average output delta (like-for-like)</span><strong className={averageBaselineOutputDelta === null ? "text-base" : averageBaselineOutputDelta > 0 ? "text-base text-emerald-700" : averageBaselineOutputDelta < 0 ? "text-base text-rose-700" : "text-base"}>{averageBaselineOutputDelta === null ? "—" : `${averageBaselineOutputDelta > 0 ? "+" : ""}${averageBaselineOutputDelta.toFixed(1)} vehicles/shift`}</strong></div><div><span className="block text-xs text-slate-500">Different assumptions</span><strong className="text-base">{differentAssumptionBaselineComparisons} excluded</strong></div></>}
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      {pinnedScenario && <label className="factory-scenario-sort"><span>Baseline comparison</span><select value={scenarioBaselineFilter} onChange={event => setScenarioBaselineFilter(event.target.value)} aria-label="Filter scenarios by baseline assumptions"><option value="all">All scenarios</option><option value="like-for-like">Like-for-like only</option><option value="different">Different assumptions</option></select></label>}
                      <label className="factory-scenario-sort"><span>Sort</span><select value={scenarioSort} onChange={event => setScenarioSort(event.target.value)} aria-label="Sort saved scenarios"><option value="recent">Recently saved</option><option value="output">Highest output</option><option value="target">Best target result</option><option value="attainment">Highest target attainment</option><option value="lowest-attainment">Lowest target attainment</option><option value="name">Name A–Z</option></select></label>
                    </div>
                  </div>
                  <ul aria-label="Saved named scenarios">
                  {visibleScenarioLibrary.map(item => <li key={item.name}>
                    <span className="factory-scenario-item-details">
                      {renamingScenario === item.name ? <span className="factory-scenario-rename"><label htmlFor={`rename-${item.name}`}>New scenario name</label><input id={`rename-${item.name}`} value={renameScenarioValue} maxLength={48} onChange={event => setRenameScenarioValue(event.target.value)} onKeyDown={event => { if (event.key === "Enter") renameNamedScenario(item.name); if (event.key === "Escape") setRenamingScenario(""); }} /><span><button type="button" className="line-reset" onClick={() => renameNamedScenario(item.name)}>Save name</button><button type="button" className="line-reset" onClick={() => setRenamingScenario("")}>Cancel</button></span></span> : <><strong>{item.name}</strong><small>{new Date(item.snapshot.savedAt).toLocaleString()} · target {item.snapshot.target}/shift</small><small>{getScenarioProjection(item.snapshot).good.toLocaleString("en-IN")} good vehicles/shift · bottleneck {getScenarioProjection(item.snapshot).bottleneckName} ({getScenarioProjection(item.snapshot).bottleneck}s)</small><small className={getScenarioProjection(item.snapshot).gap >= 0 ? "factory-named-on-target" : "factory-named-below-target"}>{getScenarioProjection(item.snapshot).gap >= 0 ? `Target met · ${getScenarioProjection(item.snapshot).gap} above` : `${Math.abs(getScenarioProjection(item.snapshot).gap)} below target`}</small><span className="mt-2 block max-w-sm text-xs text-slate-600">Target attainment: <strong>{getScenarioProjection(item.snapshot).attainmentPercent.toFixed(1)}%</strong></span>{pinnedScenarioProjection && (() => {
                      if (item.name === pinnedScenarioName) return <small className="font-medium text-teal-700">Pinned baseline scenario</small>;
                      const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate"].every(key => item.snapshot[key] === pinnedScenario.snapshot[key]);
                      const actualDelta = getScenarioProjection(item.snapshot).good - pinnedScenarioProjection.good;
                      const normalizedSnapshot = {
                        ...item.snapshot,
                        shiftHours: pinnedScenario.snapshot.shiftHours,
                        breakMinutes: pinnedScenario.snapshot.breakMinutes,
                        availability: pinnedScenario.snapshot.availability,
                        yieldRate: pinnedScenario.snapshot.yieldRate
                      };
                      const normalizedDelta = getScenarioProjection(normalizedSnapshot).good - pinnedScenarioProjection.good;
                      return <small className={sameAssumptions ? (actualDelta > 0 ? "font-medium text-emerald-700" : actualDelta < 0 ? "font-medium text-rose-700" : "font-medium") : "font-medium text-amber-700"}>
                        {sameAssumptions
                          ? `${actualDelta > 0 ? "+" : ""}${actualDelta.toLocaleString("en-IN")} good vehicles/shift vs pinned baseline · same production assumptions`
                          : `Different assumptions · raw output ${actualDelta > 0 ? "+" : ""}${actualDelta.toLocaleString("en-IN")}/shift · cycle-only ${normalizedDelta > 0 ? "+" : ""}${normalizedDelta.toLocaleString("en-IN")}/shift under baseline conditions`}
                      </small>;
                    })()}</>}
                    </span>
                    <label className="factory-scenario-compare-choice"><input type="checkbox" checked={selectedScenarioNames.includes(item.name)} onChange={event => toggleScenarioComparison(item.name, event.target.checked)} aria-label={`Compare ${item.name}`} /> Compare</label>
                    <button type="button" className="line-reset" onClick={() => togglePinnedScenario(item.name)} aria-pressed={pinnedScenarioName === item.name}>{pinnedScenarioName === item.name ? "★ Pinned baseline" : "☆ Pin baseline"}</button>
                    {renamingScenario !== item.name && <button type="button" className="line-reset" onClick={() => { setRenamingScenario(item.name); setRenameScenarioValue(item.name); }}>Rename</button>}
                    <button type="button" className="line-reset" onClick={() => exportNamedScenarioJson(item)}>Export JSON</button>
                    <button type="button" className="line-reset" onClick={() => exportNamedScenarioCsv(item)}>Export CSV</button>
                    <button type="button" className="line-reset" onClick={() => exportNamedScenarioHtml(item)}>Export report</button>
                    <button type="button" className="line-reset" onClick={() => exportNamedScenarioMarkdown(item)}>Export Markdown</button>
                    <button type="button" className="line-reset" onClick={() => copyNamedScenarioSummary(item)}>Copy summary</button>
                    <button type="button" className="line-reset" onClick={() => loadNamedScenario(item)}>Load</button>
                    <button type="button" className="line-reset" onClick={() => duplicateNamedScenario(item)} disabled={scenarioLibrary.length >= 10} aria-label={`Duplicate ${item.name}`}>Duplicate</button>
                    {pendingDeleteScenario === item.name ? <>
                      <span className="factory-scenario-delete-confirm" role="group" aria-label={`Confirm deletion of ${item.name}`}>
                        <small>Delete this saved scenario?</small>
                        <button type="button" className="line-reset factory-scenario-delete-action" onClick={() => deleteNamedScenario(item.name)}>Confirm delete</button>
                        <button type="button" className="line-reset" onClick={() => setPendingDeleteScenario("")}>Cancel</button>
                      </span>
                    </> : <button type="button" className="line-reset" onClick={() => { setPendingDeleteScenario(item.name); setRenamingScenario(""); }}>Delete</button>}
                  </li>)}
                </ul>
                  {visibleScenarioLibrary.length === 0 && <div className="factory-scenario-empty-search" role="status"><p>{scenarioSearch.trim() ? `No saved scenarios match “${scenarioSearch}” with the current filters.` : "No saved scenarios match the selected baseline filter."}</p><button type="button" className="line-reset" onClick={() => { setScenarioSearch(""); setScenarioBaselineFilter("all"); }}>Clear search and filters</button></div>}
                </>}
                {selectedScenarioNames.length > 0 && <div className="factory-scenario-comparison" aria-live="polite">
                  <div className="factory-scenario-comparison-heading"><strong>Scenario comparison ({selectedScenarioNames.length}/2)</strong><button type="button" className="line-reset" onClick={() => setSelectedScenarioNames([])}>Clear comparison</button></div>
                  {selectedScenarioNames.map(name => {
                    const item = scenarioLibrary.find(entry => entry.name === name);
                    if (!item) return null;
                    const projection = getScenarioProjection(item.snapshot);
                    return <div key={name}><span>{item.name}</span><strong>{projection.good.toLocaleString("en-IN")} good/shift</strong><small>{projection.bottleneckName} · {projection.bottleneck}s bottleneck · {projection.gap >= 0 ? `+${projection.gap} above target` : `${Math.abs(projection.gap)} below target`}</small><small>Target {item.snapshot.target}/shift · {item.snapshot.shiftHours}h shift · {item.snapshot.availability}% availability · {item.snapshot.yieldRate}% quality</small></div>;
                  })}
                  {selectedScenarioNames.length === 2 && (() => {
                    const first = scenarioLibrary.find(item => item.name === selectedScenarioNames[0]);
                    const second = scenarioLibrary.find(item => item.name === selectedScenarioNames[1]);
                    if (!first || !second) return null;
                    const firstProjection = getScenarioProjection(first.snapshot);
                    const secondProjection = getScenarioProjection(second.snapshot);
                    const difference = secondProjection.good - firstProjection.good;
                    const percentDifference = firstProjection.good > 0 ? (difference / firstProjection.good) * 100 : null;
                    const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate"].every(key => first.snapshot[key] === second.snapshot[key]);
                    const commonConditions = {
                      shiftHours: first.snapshot.shiftHours,
                      breakMinutes: first.snapshot.breakMinutes,
                      availability: first.snapshot.availability,
                      yieldRate: first.snapshot.yieldRate,
                      target: first.snapshot.target
                    };
                    const normalizedFirst = getScenarioProjection({ ...first.snapshot, ...commonConditions });
                    const normalizedSecond = getScenarioProjection({ ...second.snapshot, ...commonConditions });
                    const normalizedDifference = normalizedSecond.good - normalizedFirst.good;
                    const improvedStations = initialStations.filter((station, index) => second.snapshot.cycleTimes[index] < first.snapshot.cycleTimes[index]).length;
                    const worsenedStations = initialStations.filter((station, index) => second.snapshot.cycleTimes[index] > first.snapshot.cycleTimes[index]).length;
                    const bottleneckCycleDelta = secondProjection.bottleneck - firstProjection.bottleneck;
                    return <div className="factory-scenario-comparison-print">
                      <h3>Scenario comparison report</h3>
                      <p><strong>{difference > 0 ? `+${difference}` : difference} good vehicles/shift</strong> for {second.name} compared with {first.name}{percentDifference !== null ? ` (${percentDifference > 0 ? "+" : ""}${percentDifference.toFixed(1)}%)` : ""}.</p>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => exportScenarioComparisonCsv(first, second)}>Export comparison CSV</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => exportScenarioComparisonJson(first, second)}>Export comparison JSON</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => exportScenarioComparisonMarkdown(first, second)}>Export comparison Markdown</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => exportScenarioComparisonHtml(first, second)}>Export comparison HTML</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => copyScenarioComparisonSummary(first, second)}>Copy comparison summary</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => window.print()}>Print comparison report</button>
                      <small className={sameAssumptions ? "factory-scenario-comparison-fair" : "factory-scenario-comparison-warning"} role="status">{sameAssumptions ? "Like-for-like comparison: both scenarios use the same shift and production assumptions." : "Different assumptions detected. Output difference includes changes to shift time, breaks, availability, quality yield or target; compare cycle times separately for a fair line-performance assessment."}</small>
                      <div className="factory-scenario-normalized">
                        <strong>Cycle-time-only comparison</strong>
                        <p>Both cycle-time sets are recalculated using <b>{first.name}</b> conditions: {commonConditions.shiftHours}h shift, {commonConditions.breakMinutes} min breaks, {commonConditions.availability}% availability and {commonConditions.yieldRate}% quality.</p>
                        <div><span>{first.name}</span><strong>{normalizedFirst.good.toLocaleString("en-IN")} good/shift</strong></div>
                        <div><span>{second.name}</span><strong>{normalizedSecond.good.toLocaleString("en-IN")} good/shift</strong></div>
                        <small className={normalizedDifference > 0 ? "factory-cycle-faster" : normalizedDifference < 0 ? "factory-cycle-slower" : ""}>{normalizedDifference > 0 ? "+" : ""}{normalizedDifference} good vehicles/shift for {second.name} on the same operating assumptions.</small>
                        <div><span>Station cycles improved / worsened</span><strong>{improvedStations} improved · {worsenedStations} worsened</strong></div>
                        <div><span>Bottleneck change</span><strong>{firstProjection.bottleneckName} → {secondProjection.bottleneckName}</strong></div>
                        <small className={bottleneckCycleDelta < 0 ? "factory-cycle-faster" : bottleneckCycleDelta > 0 ? "factory-cycle-slower" : ""}>Bottleneck cycle {bottleneckCycleDelta > 0 ? "+" : ""}{bottleneckCycleDelta}s (second minus first).</small>
                      </div>
                      <div className="factory-scenario-station-compare">
                        <strong>Station cycle-time comparison</strong>
                        <div className="factory-scenario-station-compare-scroll" role="region" aria-label="Side-by-side station cycle time comparison" tabIndex="0">
                          <table>
                            <thead><tr><th>Station</th><th>{first.name}</th><th>{second.name}</th><th>Difference</th></tr></thead>
                            <tbody>{initialStations.map((station, index) => {
                              const firstTime = first.snapshot.cycleTimes[index];
                              const secondTime = second.snapshot.cycleTimes[index];
                              const delta = secondTime - firstTime;
                              return <tr key={station.name}>
                                <th scope="row">{station.name}</th>
                                <td>{firstTime}s</td>
                                <td>{secondTime}s</td>
                                <td className={delta < 0 ? "factory-cycle-faster" : delta > 0 ? "factory-cycle-slower" : ""}>{delta > 0 ? "+" : ""}{delta}s {delta < 0 ? "faster" : delta > 0 ? "slower" : "unchanged"}</td>
                              </tr>;
                            })}</tbody>
                          </table>
                        </div>
                        <small>Difference is calculated as {second.name} minus {first.name}. A negative value means the second scenario has a faster station cycle.</small>
                      </div>
                    </div>;
                  })()}
                </div>}
                <p>Up to 10 named scenarios are stored in this browser. They remain separate from the single quick-save slot above.</p>
              </div>

              {scenarioStorageReady && <div className="factory-scenario-saved-state" role="status">
                {savedScenario ? <>
                  <div className="factory-saved-scenario-summary">
                    <strong>Saved scenario · {new Date(savedScenario.savedAt).toLocaleString()}</strong>
                    <span>{savedScenarioSummary.good.toLocaleString("en-IN")} good vehicles / shift</span>
                    <span>{savedScenarioSummary.bottleneck}s bottleneck cycle</span>
                    <span className={savedScenarioSummary.meetsTarget ? "is-on-target" : "is-below-target"}>{savedScenarioSummary.meetsTarget ? `Target met · ${savedScenarioSummary.gap} above target` : `${Math.abs(savedScenarioSummary.gap)} below target`}</span>
                      <small>Target: {savedScenario.target} · Shift: {savedScenario.shiftHours}h · Availability: {savedScenario.availability}% · Quality: {savedScenario.yieldRate}%</small>
                    <span className={savedScenarioChanged ? "factory-saved-change" : "factory-saved-current"}>{savedScenarioChanged ? "Planner has unsaved changes" : "Planner matches saved scenario"}</span>
                    <span className={improvement.good - savedScenarioSummary.good > 0 ? "factory-saved-delta-up" : improvement.good - savedScenarioSummary.good < 0 ? "factory-saved-delta-down" : "factory-saved-delta-even"}>Current planner vs saved: {improvement.good - savedScenarioSummary.good > 0 ? "+" : ""}{(improvement.good - savedScenarioSummary.good).toLocaleString("en-IN")} good vehicles / shift</span>
                  </div>
                  <button type="button" onClick={clearImprovementScenario}>Clear saved scenario</button>
                </> : <span>No saved scenario yet. Save proposed cycle times and shift assumptions to reuse them later on this device.</span>}
              </div>}
              <div className="factory-improvement-grid">
                {stations.map((station, index) => (
                  <label className="factory-improvement-row" key={station.name}>
                    <span>{station.name}</span>
                    <small>Current: {station.seconds}s</small>
                    <div className="factory-proposed-cycle-control">
                      <input className="factory-proposed-cycle-slider" aria-label={`Proposed cycle time slider for ${station.name}`} type="range" min="20" max="180" step="1" value={proposedCycleTimes[index] ?? station.seconds} onChange={event => {
                        const value = Number(event.target.value);
                        setProposedCycleTimes(current => current.map((time, i) => i === index ? value : time));
                      }}/>
                      <div className="factory-proposed-cycle-number"><input aria-label={`Proposed cycle time for ${station.name}`} type="number" min="20" max="180" step="1" value={proposedCycleTimes[index] ?? station.seconds} onChange={event => {
                        const value = event.target.value;
                        if (value !== "" && Number(value) >= 20 && Number(value) <= 180) {
                          setProposedCycleTimes(current => current.map((time, i) => i === index ? Number(value) : time));
                        }
                      }}/><span>sec</span></div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="factory-improvement-guidance">
                <div><span>Required bottleneck cycle to meet target</span><strong>{improvement.requiredCycle > 0 ? improvement.requiredCycle : "—"} sec</strong></div>
                <p>{improvement.feasible ? "Stations above this cycle time need improvement to reach the selected good-output target." : "The selected target cannot be reached within the simulator's 20-second minimum cycle time under the current shift, availability and quality settings."}</p>
              </div>
              <div className="factory-improvement-priority" aria-label="Station improvement priority ranking">
                <div className="factory-improvement-guidance-title"><strong>Improvement priority</strong><span>Ranked by cycle-time gap against the target pace</span></div>
                <ol>
                  {improvementPriorities.map((station, rank) => (
                    <li key={station.name}>
                      <span className="factory-priority-rank">{String(rank + 1).padStart(2, "0")}</span>
                      <div><strong>{station.name}</strong><small>Current {station.seconds}s · Proposed {proposedCycleTimes[station.index] ?? station.seconds}s</small></div>
                      <b>{station.reductionNeeded > 0 ? `${station.reductionNeeded}s above target pace` : "At target pace"}</b>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="factory-improvement-grid factory-improvement-detail-grid">
                {stations.map((station, index) => {
                  const proposed = proposedCycleTimes[index] ?? station.seconds;
                  const reduction = station.seconds - proposed;
                  const abovePace = improvement.requiredCycle > 0 ? Math.max(0, proposed - improvement.requiredCycle) : null;
                  const meetsPace = improvement.feasible && abovePace === 0;
                  return <div className="factory-improvement-detail" key={station.name}>
                    <strong>{station.name}</strong>
                    <span>Current {station.seconds}s <span aria-hidden="true">→</span> Proposed {proposed}s</span>
                    <span className={reduction > 0 ? "factory-detail-gain" : reduction < 0 ? "factory-detail-loss" : ""}>{reduction > 0 ? `Improved by ${reduction}s` : reduction < 0 ? `Increased by ${Math.abs(reduction)}s` : "No cycle-time change"}</span>
                    <span className={meetsPace ? "factory-detail-on-pace" : "factory-detail-over-pace"}>{!improvement.feasible ? "Target pace unavailable" : meetsPace ? "Meets target pace" : `${abovePace}s above target pace`}</span>
                  </div>;
                })}
              </div>
              <div className="factory-improvement-results">
                <div><span>Projected good output</span><strong>{improvement.good.toLocaleString("en-IN")}</strong><small>vehicles / shift</small></div>
                <div><span>Projected bottleneck</span><strong>{improvement.bottleneckName}</strong><small>{improvement.bottleneck}s per vehicle</small></div>
                <div className={improvement.gain > 0 ? "is-positive" : improvement.gain < 0 ? "is-negative" : ""}><span>Change vs current</span><strong>{improvement.gain > 0 ? "+" : ""}{improvement.gain.toLocaleString("en-IN")}</strong><small>good vehicles / shift</small></div>
              </div>
              <div className={`factory-scenario-target ${improvement.meetsTarget ? "is-met" : "is-short"}`} role="status" aria-live="polite">
                <div><span>SCENARIO TARGET CHECK</span><strong>{improvement.meetsTarget ? "Target achieved" : "Target not yet achieved"}</strong></div>
                <b>{improvement.targetGap > 0 ? "+" : ""}{improvement.targetGap.toLocaleString("en-IN")} vehicles</b>
                <small>{improvement.meetsTarget ? "Projected good output meets or exceeds the selected shift target." : "Additional good vehicles are needed to reach the selected shift target."}</small>
              </div>
              <p className="factory-chart-caption">Target cycle time is calculated from net shift seconds, availability, quality yield and the selected good-output target. Apply target pace creates a what-if scenario; it does not change the live station settings.</p>
            </section>
          )}
          <div className="factory-live-charts grid grid-cols-1 2xl:grid-cols-2 gap-3 mt-5">
            {chartVisibility.radar && (<section className="factory-chart-card min-w-0" aria-label="Station cycle time radar chart">
              <div className="factory-chart-heading"><div><span>CHART 01 / LINE BALANCE</span><h3>{chartTitles.radar || defaultChartTitles.radar}</h3></div><small>Seconds / vehicle</small></div>
              <div className="factory-radar-wrap">
                <svg className="factory-radar" viewBox="0 0 320 250" role="img" aria-label="Radar plot comparing the cycle time of each production station">
                  {[25,50,75,100].map(level=>{const r=level*0.78;return <g key={level}><polygon points={stations.map((_,i)=>{const a=(-Math.PI/2)+(i*2*Math.PI/stations.length);return (160+Math.cos(a)*r)+","+(118+Math.sin(a)*r)}).join(" ")} /><text className="factory-radar-scale" x="164" y={118-r-3}>{Math.round(level*1.8)}s</text></g>})}
                  {stations.map((station,i)=>{const a=(-Math.PI/2)+(i*2*Math.PI/stations.length);return <line key={station.name} x1="160" y1="118" x2={160+Math.cos(a)*78} y2={118+Math.sin(a)*78}/>})}
                  <polygon className="factory-radar-area" points={stations.map((station,i)=>{const a=(-Math.PI/2)+(i*2*Math.PI/stations.length);const r=station.seconds/180*78;return (160+Math.cos(a)*r)+","+(118+Math.sin(a)*r)}).join(" ")}/>
                  {stations.map((station,i)=>{const a=(-Math.PI/2)+(i*2*Math.PI/stations.length);const r=station.seconds/180*78;const x=160+Math.cos(a)*r;const y=118+Math.sin(a)*r;const lx=160+Math.cos(a)*105;const ly=118+Math.sin(a)*105;return <g key={station.name}><circle className={station.seconds===result.bottleneck?"factory-radar-point bottleneck":"factory-radar-point"} cx={x} cy={y} r="4"/><text x={lx} y={ly} textAnchor={Math.abs(Math.cos(a))<.25?"middle":Math.cos(a)>0?"start":"end"}>{station.name}</text></g>})}
                </svg>
              </div>
              <p className="factory-chart-caption">Each axis represents one station. Points farther from the centre have longer cycle times; the highlighted point is the bottleneck.</p>
            </section>)}
            {chartVisibility.capacity && (<section className="factory-chart-card min-w-0" aria-label="Production capacity radial comparison">
              <div className="factory-chart-heading"><div><span>CHART 02 / OUTPUT CAPACITY</span><h3>{chartTitles.capacity || defaultChartTitles.capacity}</h3></div><small>Vehicles / shift</small></div>
              <div className="factory-capacity-rings">
                {[{label:"Ideal",value:result.ideal,color:"ideal"},{label:"Available",value:result.available,color:"available"},{label:"Good units",value:result.goodUnits,color:"good"},{label:"Target",value:target,color:"target"}].map(item=><div className="factory-capacity-item" key={item.label}><div className={`factory-capacity-ring ${item.color}`} style={{"--ratio":(Math.max(result.ideal,target,1)>0?clamp(item.value/Math.max(result.ideal,target,1)*100,0,100):0)+"%"}}><strong>{item.value.toLocaleString("en-IN")}</strong></div><span>{item.label}</span></div>)}
              </div>
              <p className="factory-chart-caption">Each ring shows its value relative to the larger of ideal capacity and the selected target.</p>
            </section>)}
            {chartVisibility.ratios && (<section className="factory-chart-card factory-efficiency-card min-w-0 2xl:col-span-2" aria-label="Availability and quality yield chart">
              <div className="factory-chart-heading"><div><span>CHART 03 / OPERATING CONDITIONS</span><h3>{chartTitles.ratios || defaultChartTitles.ratios}</h3></div><small>Current assumptions</small></div>
              <div className="factory-ratio-charts">
                <div className="factory-ratio-item"><div className="factory-ratio-ring availability" role="img" aria-label={`Line availability ${availability} percent`} style={{"--ratio":availability+"%"}}><strong>{availability}%</strong></div><div><b>Line availability</b><p>Share of scheduled production time assumed available to run.</p></div></div>
                <div className="factory-ratio-item"><div className="factory-ratio-ring yield" role="img" aria-label={`Quality yield ${yieldRate} percent`} style={{"--ratio":yieldRate+"%"}}><strong>{yieldRate}%</strong></div><div><b>Quality yield</b><p>Share of produced units assumed to pass quality checks.</p></div></div>
              </div>
            </section>)}
            {chartVisibility.losses && (<section className="factory-chart-card factory-loss-card min-w-0 2xl:col-span-2" aria-label="Production loss doughnut chart">
              <div className="factory-chart-heading"><div><span>CHART 04 / LOSS ANALYSIS</span><h3>{chartTitles.losses || defaultChartTitles.losses}</h3></div><small>Vehicles / shift</small></div>
              <div className="factory-loss-layout">
                <div className="factory-loss-donut" role="img" aria-label={`Capacity split: ${Math.max(0,result.ideal-result.available)} availability loss, ${Math.max(0,result.available-result.goodUnits)} quality loss, ${result.goodUnits} good output`} style={{"--availability-share":(result.ideal>0?Math.max(0,result.ideal-result.available)/result.ideal*100:0)+"%","--quality-share":(result.ideal>0?Math.max(0,result.available-result.goodUnits)/result.ideal*100:0)+"%"}}><div><strong>{result.ideal.toLocaleString("en-IN")}</strong><span>ideal units</span></div></div>
                <div className="factory-loss-legend">
                  {[{label:"Availability loss",value:Math.max(0,result.ideal-result.available),tone:"availability"},{label:"Quality loss",value:Math.max(0,result.available-result.goodUnits),tone:"quality"},{label:"Good output",value:result.goodUnits,tone:"output"}].map(item=><div key={item.label}><i className={item.tone}/><span>{item.label}</span><b>{item.value.toLocaleString("en-IN")}</b></div>)}
                </div>
              </div>
              <p className="factory-chart-caption">Losses are calculated from the simulator's ideal capacity, availability and quality-yield assumptions. They are estimates, not measured factory data.</p>
            </section>)}
          </div>
          {showDataTable && (
            <section className="factory-data-table-wrap" aria-label="Detailed simulation data">
              <div className="factory-data-table-heading"><div><span>SIMULATION DATA / LIVE VALUES</span><strong>Production breakdown</strong></div><small>Updates with every setting change</small></div>
              <div className="factory-data-table-scroll" role="region" aria-label="Scrollable production data table" tabIndex="0">
                <table className="factory-data-table">
                  <thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">How it is used</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Ideal capacity</th><td>{result.ideal.toLocaleString("en-IN")} vehicles</td><td>Net shift seconds ÷ slowest station cycle time</td></tr>
                    <tr><th scope="row">Available capacity</th><td>{result.available.toLocaleString("en-IN")} vehicles</td><td>Ideal capacity × line availability</td></tr>
                    <tr><th scope="row">Estimated good output</th><td>{result.goodUnits.toLocaleString("en-IN")} vehicles</td><td>Available capacity × quality yield</td></tr>
                    <tr><th scope="row">Availability loss</th><td>{Math.max(0,result.ideal-result.available).toLocaleString("en-IN")} vehicles</td><td>Ideal capacity − available capacity</td></tr>
                    <tr><th scope="row">Quality loss</th><td>{Math.max(0,result.available-result.goodUnits).toLocaleString("en-IN")} vehicles</td><td>Available capacity − good output</td></tr>
                    <tr><th scope="row">Target variance</th><td>{result.gap > 0 ? "+" : ""}{result.gap.toLocaleString("en-IN")} vehicles</td><td>Estimated good output − shift target</td></tr>
                    <tr><th scope="row">Target takt time</th><td>{result.taktSeconds.toFixed(1)} seconds / vehicle</td><td>Net production seconds ÷ shift target; pace before downtime and quality losses</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="factory-data-table-heading factory-station-table-heading"><div><span>STATION DETAIL</span><strong>Cycle-time comparison</strong></div><small>Longest cycle time sets line pace</small></div>
              <div className="factory-data-table-scroll" role="region" aria-label="Scrollable station cycle time table" tabIndex="0">
                <table className="factory-data-table">
                  <thead><tr><th scope="col">Station</th><th scope="col">Cycle time</th><th scope="col">Good-output target pace check</th></tr></thead>
                  <tbody>{stations.map(station => <tr key={station.name}><th scope="row">{station.name}</th><td>{station.seconds} sec / vehicle</td><td>{target === 0 ? "No target selected" : !result.targetPaceFeasible ? <span className="factory-bottleneck-label">Target pace unavailable</span> : station.seconds > result.requiredGoodOutputCycle ? <span className="factory-bottleneck-label">Exceeds required pace</span> : station.seconds === result.bottleneck ? <span className="factory-bottleneck-label">Bottleneck · within pace</span> : "Within required pace"}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          )}
          <p className="line-sim-tip">{target === 0 ? "Select a shift target to calculate the required production pace." : !result.targetPaceFeasible ? "The selected good-output target cannot be reached within the simulator’s 20-second minimum cycle under the current shift, availability and quality assumptions." : result.bottleneck > result.requiredGoodOutputCycle ? `The bottleneck is ${(result.bottleneck - result.requiredGoodOutputCycle).toFixed(1)} seconds slower than the required cycle after availability and quality losses. Improve the bottleneck or increase net production time to meet the good-output target.` : "The bottleneck cycle is within the required pace after accounting for availability and quality losses."}</p>
        </aside>
      </div>
      <p className="line-sim-disclaimer">Simplified educational model. It assumes a serial line whose throughput is limited by the slowest station. Real factories also account for buffers, parallel workstations, changeovers, downtime patterns, material shortages, rework, staffing and product mix. Results are estimates, not Ford plant data or production guarantees.</p>
    </section>,
    mount
  );
}
