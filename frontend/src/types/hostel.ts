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

export type RoomAllocation = {
  id: string;
  studentId: string;
  roomId: number;
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
  room: {
    id: number;
    roomNumber: string;
    block: { id: number; name: string };
  };
};

export type HostelAttendanceSession = {
  id: string;
  attendanceDate: string;
  blockId: number | null;
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
