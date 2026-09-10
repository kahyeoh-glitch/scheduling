import cors from "cors";
import express from "express";
import { fetchInventory } from "./inventory/fetchInventory";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4100;

app.use(cors());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/inventory", async (_req, res) => {
  const inventory = await fetchInventory();
  res.json(inventory);
});

app.listen(PORT, () => {
  console.log(`Drink Stock Count API listening on http://localhost:${PORT}`);
});
