import { Router } from "express";
import { prisma } from "../lib/prisma";

export const employeesRouter = Router();

employeesRouter.get("/", async (_req, res) => {
  const employees = await prisma.employee.findMany({ orderBy: { name: "asc" } });
  res.json(employees);
});

employeesRouter.post("/", async (req, res) => {
  const { name, role, color } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }
  const employee = await prisma.employee.create({
    data: { name, role: role ?? null, color: color ?? undefined },
  });
  res.status(201).json(employee);
});

employeesRouter.put("/:id", async (req, res) => {
  const { name, role, color } = req.body;
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: { name, role, color },
    });
    res.json(employee);
  } catch {
    res.status(404).json({ error: "employee not found" });
  }
});

employeesRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "employee not found" });
  }
});
