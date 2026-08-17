import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.employee.count();
  if (count > 0) {
    console.log("Employees already exist, skipping seed.");
    return;
  }

  const [alice, bob, carol] = await Promise.all([
    prisma.employee.create({ data: { name: "Alice Tan", role: "Barista", color: "#6366f1" } }),
    prisma.employee.create({ data: { name: "Bob Lim", role: "Cashier", color: "#22c55e" } }),
    prisma.employee.create({ data: { name: "Carol Ng", role: "Manager", color: "#f97316" } }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;

  const at = (dayOffset: number, hour: number) =>
    new Date(today.getTime() + dayOffset * dayMs + hour * 60 * 60 * 1000);

  await prisma.shift.createMany({
    data: [
      { employeeId: alice.id, startsAt: at(0, 9), endsAt: at(0, 17), notes: "Opening shift" },
      { employeeId: bob.id, startsAt: at(0, 12), endsAt: at(0, 20) },
      { employeeId: carol.id, startsAt: at(1, 8), endsAt: at(1, 16), notes: "Inventory day" },
      { employeeId: alice.id, startsAt: at(2, 9), endsAt: at(2, 17) },
    ],
  });

  console.log("Seeded employees and shifts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
