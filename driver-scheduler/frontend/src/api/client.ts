import type { Driver, RunResult, StopInput, Zone } from "../types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  drivers: {
    list: () => request<Driver[]>("/drivers"),
    create: (d: Omit<Driver, "id">) => request<Driver>("/drivers", { method: "POST", body: JSON.stringify(d) }),
    update: (id: number, d: Omit<Driver, "id">) =>
      request<Driver>(`/drivers/${id}`, { method: "PUT", body: JSON.stringify(d) }),
    remove: (id: number) => request<void>(`/drivers/${id}`, { method: "DELETE" }),
  },
  zones: {
    list: () => request<Zone[]>("/zones"),
    create: (z: Omit<Zone, "id">) => request<Zone>("/zones", { method: "POST", body: JSON.stringify(z) }),
    update: (id: number, z: Omit<Zone, "id">) =>
      request<Zone>(`/zones/${id}`, { method: "PUT", body: JSON.stringify(z) }),
    remove: (id: number) => request<void>(`/zones/${id}`, { method: "DELETE" }),
  },
  schedule: {
    run: (payload: { day_of_week: number; driver_ids: number[]; stops: StopInput[]; label?: string }) =>
      request<RunResult>("/schedule/run", { method: "POST", body: JSON.stringify(payload) }),
  },
};
