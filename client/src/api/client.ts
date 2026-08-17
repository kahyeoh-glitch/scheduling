import type { Employee, Shift } from "../types";

const BASE = "/api";

class ApiRequestError extends Error {
  overlaps?: Shift[];
  constructor(message: string, overlaps?: Shift[]) {
    super(message);
    this.overlaps = overlaps;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiRequestError(body.error ?? "Request failed", body.overlaps);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export { ApiRequestError };

export const api = {
  employees: {
    list: () => request<Employee[]>("/employees"),
    create: (data: { name: string; role?: string; color?: string }) =>
      request<Employee>("/employees", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Employee, "name" | "role" | "color">>) =>
      request<Employee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/employees/${id}`, { method: "DELETE" }),
  },
  shifts: {
    list: (range?: { from: string; to: string }) => {
      const qs = range ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}` : "";
      return request<Shift[]>(`/shifts${qs}`);
    },
    create: (data: { employeeId: string; startsAt: string; endsAt: string; notes?: string; force?: boolean }) =>
      request<Shift>("/shifts", { method: "POST", body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<{ employeeId: string; startsAt: string; endsAt: string; notes: string; force: boolean }>
    ) => request<Shift>(`/shifts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/shifts/${id}`, { method: "DELETE" }),
  },
};
