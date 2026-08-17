export interface Employee {
  id: string;
  name: string;
  role: string | null;
  color: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  employee: Employee;
  startsAt: string;
  endsAt: string;
  notes: string | null;
  createdAt: string;
}

export interface ApiError {
  error: string;
  overlaps?: Shift[];
}
