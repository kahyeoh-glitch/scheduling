export interface Driver {
  id: number;
  name: string;
  color: string;
  shift_start: string;
  shift_end: string;
  mode: "dedicated" | "shared";
  dedicated_prefixes: string[];
  max_per_time: number;
  active: boolean;
}

export interface Zone {
  id: number;
  name: string;
  prefixes: string[];
}

export interface StopInput {
  postal: string;
  time: string;
  event_no: string;
}

export interface StopResult {
  id: number;
  postal: string;
  address: string | null;
  lat: number | null;
  lon: number | null;
  time: string;
  event_no: string;
  driver_id: number | null;
  driver_name: string | null;
  driver_color: string | null;
  batch_index: number | null;
  sequence: number | null;
  status: "assigned" | "unassigned" | "geocode_failed";
  reason: string | null;
}

export interface RunResult {
  run_id: number;
  day_of_week: number;
  stops: StopResult[];
  zone_assignment: Record<string, string[]>;
}
