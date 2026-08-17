import cors from "cors";
import express from "express";
import { employeesRouter } from "./routes/employees";
import { shiftsRouter } from "./routes/shifts";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/employees", employeesRouter);
app.use("/api/shifts", shiftsRouter);

app.listen(PORT, () => {
  console.log(`Scheduling API listening on http://localhost:${PORT}`);
});
