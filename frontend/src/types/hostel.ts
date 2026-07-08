export type HostelBlock = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HostelRoom = {
  id: number;
  blockId: number;
  blockName: string;
  roomNumber: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HostelBed = {
  id: number;
  roomId: number;
  slotNumber: number;
  isActive: boolean;
  isOccupied: boolean;
  bedLabel: string | null;
  room?: {
    id: number;
    roomNumber: string;
    block: { id: number; name: string };
  };
  createdAt: string;
  updatedAt: string;
};

export type RoomAllocation = {
  id: string;
  studentId: string;
  roomId: number;
  bedId: number | null;
  allocatedFrom: string;
  allocatedTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNumber: string;
  };
  bed: {
    id: number;
    slotNumber: number;
    bedLabel: string;
  } | null;
  room: {
    id: number;
    roomNumber: string;
    block: { id: number; name: string };
  };
};

export type HostelOverview = {
  occupancy: { totalBeds: number; occupiedBeds: number; vacantBeds: number };
  unallocatedStudents: {
    count: number;
    students: Array<{
      id: string;
      firstName: string;
      lastName: string | null;
      admissionNumber: string;
    }>;
  };
  todayAttendance: {
    date: string;
    hasSession: boolean;
    present: number;
    absent: number;
    notMarked: number;
  };
};

export type HostelDailyReportRow = {
  studentId: string;
  firstName: string;
  lastName: string | null;
  admissionNumber: string;
  blockName: string;
  roomNumber: string;
  bedSlot: number | null;
  isAssigned?: boolean;
  status: string | null;
  countsAsPresent: boolean | null;
};

export type HostelDailyReport = {
  date: string;
  blockId: number | null;
  sessionPeriod: 'morning' | 'evening' | null;
  hasSession: boolean;
  totals: { roster: number; present: number; absent: number; notMarked: number };
  present: HostelDailyReportRow[];
  absent: HostelDailyReportRow[];
  notMarked: HostelDailyReportRow[];
};

export type HostelOccupancyReport = {
  summary: { totalBeds: number; occupiedBeds: number; vacantBeds: number };
  blocks: Array<{
    blockId: number;
    blockName: string;
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
  }>;
};

export type HostelAttendanceTrend = {
  endDate: string;
  days: number;
  blockId: number | null;
  points: Array<{
    date: string;
    hasSession: boolean;
    present: number;
    absent: number;
    notMarked: number;
    roster: number;
  }>;
};

export type HostelAttendanceSession = {
  id: string;
  attendanceDate: string;
  blockId: number | null;
  sessionPeriod: 'morning' | 'evening';
  block: { id: number; name: string } | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  takenBy: {
    id: string;
    firstName: string;
    lastName: string | null;
  };
};

export type HostelAttendanceRosterRow = {
  studentId: string;
  firstName: string;
  lastName: string | null;
  admissionNumber: string;
  isAssigned: boolean;
  blockName: string | null;
  roomNumber: string | null;
  bedSlot: number | null;
  bedLabel: string | null;
};

export type HostelDailyBoardSlot = {
  sessionId: string | null;
  markedCount: number;
  rosterCount: number;
  hasSession: boolean;
};

export type HostelDailyBoard = {
  date: string;
  blockId: number | null;
  rosterCount: number;
  slots: {
    morning: HostelDailyBoardSlot;
    evening: HostelDailyBoardSlot;
  };
};

export type HostelAttendanceRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNumber: string;
  };
  status: {
    id: number;
    value: string;
    countsAsPresent: boolean;
  };
};

export type HostelAttendanceStatusOption = {
  id: number;
  value: string;
  countsAsPresent: boolean;
};
