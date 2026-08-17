import { Router } from "express";
import { prisma } from "../lib/prisma";

export const shiftsRouter = Router();

async function findOverlaps(employeeId: string, startsAt: Date, endsAt: Date, excludeId?: string) {
  return prisma.shift.findMany({
    where: {
      employeeId,
      id: excludeId ? { not: excludeId } : undefined,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
}

shiftsRouter.get("/", async (req, res) => {
  const { from, to } = req.query;
  const where: any = {};
  if (from || to) {
    where.AND = [];
    if (from) where.AND.push({ endsAt: { gt: new Date(String(from)) } });
    if (to) where.AND.push({ startsAt: { lt: new Date(String(to)) } });
  }
  const shifts = await prisma.shift.findMany({
    where,
    include: { employee: true },
    orderBy: { startsAt: "asc" },
  });
  res.json(shifts);
});

shiftsRouter.post("/", async (req, res) => {
  const { employeeId, startsAt, endsAt, notes, force } = req.body;
  if (!employeeId || !startsAt || !endsAt) {
    return res.status(400).json({ error: "employeeId, startsAt, and endsAt are required" });
  }
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({ error: "endsAt must be after startsAt" });
  }

  const overlaps = await findOverlaps(employeeId, start, end);
  if (overlaps.length > 0 && !force) {
    return res.status(409).json({ error: "shift overlaps with an existing shift", overlaps });
  }

  const shift = await prisma.shift.create({
    data: { employeeId, startsAt: start, endsAt: end, notes: notes ?? null },
    include: { employee: true },
  });
  res.status(201).json(shift);
});

shiftsRouter.put("/:id", async (req, res) => {
  const { employeeId, startsAt, endsAt, notes, force } = req.body;
  const existing = await prisma.shift.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "shift not found" });

  const start = startsAt ? new Date(startsAt) : existing.startsAt;
  const end = endsAt ? new Date(endsAt) : existing.endsAt;
  const empId = employeeId ?? existing.employeeId;
  if (end <= start) {
    return res.status(400).json({ error: "endsAt must be after startsAt" });
  }

  const overlaps = await findOverlaps(empId, start, end, existing.id);
  if (overlaps.length > 0 && !force) {
    return res.status(409).json({ error: "shift overlaps with an existing shift", overlaps });
  }

  const shift = await prisma.shift.update({
    where: { id: req.params.id },
    data: { employeeId: empId, startsAt: start, endsAt: end, notes },
    include: { employee: true },
  });
  res.json(shift);
});

shiftsRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.shift.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "shift not found" });
  }
});
