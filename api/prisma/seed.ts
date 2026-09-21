import { PrismaClient, RoomRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  const passwordHash = await bcrypt.hash("Password123", 12);

  const [admin, priya, aakash, ravi] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@roommate.dev" },
      update: {},
      create: { name: "Manoj Gandhi", email: "admin@roommate.dev", passwordHash, emailVerified: true },
    }),
    prisma.user.upsert({
      where: { email: "priya@roommate.dev" },
      update: {},
      create: { name: "Priya Nair", email: "priya@roommate.dev", passwordHash, emailVerified: true },
    }),
    prisma.user.upsert({
      where: { email: "aakash@roommate.dev" },
      update: {},
      create: { name: "Aakash Sharma", email: "aakash@roommate.dev", passwordHash, emailVerified: true },
    }),
    prisma.user.upsert({
      where: { email: "ravi@roommate.dev" },
      update: {},
      create: { name: "Ravi Kumar", email: "ravi@roommate.dev", passwordHash, emailVerified: true },
    }),
  ]);

  let room = await prisma.room.findFirst({ where: { name: "Green Valley PG" } });
  if (!room) {
    room = await prisma.room.create({
      data: {
        name: "Green Valley PG",
        type: "PG",
        address: "Green Valley, Bengaluru",
        description: "4-bedroom shared PG near tech park",
        currency: "INR",
        monthlyBudget: 45000,
        memberLimit: 6,
        createdById: admin.id,
      },
    });
  }

  await prisma.roomMembership.upsert({
    where: { roomId_userId: { roomId: room.id, userId: admin.id } },
    update: {},
    create: { roomId: room.id, userId: admin.id, role: RoomRole.ADMIN },
  });
  for (const user of [priya, aakash, ravi]) {
    await prisma.roomMembership.upsert({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
      update: {},
      create: { roomId: room.id, userId: user.id, role: RoomRole.ROOMMATE },
    });
  }

  const categoryDefs = [
    { name: "Rent", icon: "home", color: "#6366f1" },
    { name: "Electricity", icon: "zap", color: "#f59e0b" },
    { name: "Water", icon: "droplet", color: "#0ea5e9" },
    { name: "Internet", icon: "wifi", color: "#8b5cf6" },
    { name: "Groceries", icon: "shopping-cart", color: "#22c55e" },
    { name: "Cleaning", icon: "sparkles", color: "#14b8a6" },
  ];
  const categories = [];
  for (const c of categoryDefs) {
    const cat = await prisma.category.upsert({
      where: { roomId_name: { roomId: room.id, name: c.name } },
      update: {},
      create: { ...c, roomId: room.id, isDefault: true },
    });
    categories.push(cat);
  }
  const [rent, electricity, water, internet, groceries] = categories;

  const existingExpenses = await prisma.expense.count({ where: { roomId: room.id } });
  if (existingExpenses === 0) {
    const members = [admin, priya, aakash, ravi];

    await prisma.expense.create({
      data: {
        roomId: room.id,
        title: "September Rent",
        amount: 24000,
        categoryId: rent.id,
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        splitMethod: "EQUAL",
        createdById: admin.id,
        payers: { create: [{ userId: admin.id, amount: 24000 }] },
        participants: {
          create: members.map((m) => ({ userId: m.id, share: 6000 })),
        },
      },
    });

    await prisma.expense.create({
      data: {
        roomId: room.id,
        title: "Electricity Bill",
        amount: 2150,
        categoryId: electricity.id,
        date: new Date(),
        splitMethod: "EQUAL",
        createdById: aakash.id,
        payers: { create: [{ userId: aakash.id, amount: 2150 }] },
        participants: {
          create: members.map((m) => ({ userId: m.id, share: 537.5 })),
        },
      },
    });

    await prisma.expense.create({
      data: {
        roomId: room.id,
        title: "Groceries - BigBasket",
        amount: 1860,
        categoryId: groceries.id,
        date: new Date(),
        splitMethod: "EQUAL",
        createdById: admin.id,
        payers: { create: [{ userId: admin.id, amount: 1860 }] },
        participants: {
          create: members.map((m) => ({ userId: m.id, share: 465 })),
        },
      },
    });

    await prisma.expense.create({
      data: {
        roomId: room.id,
        title: "Wi-Fi - Monthly",
        amount: 999,
        categoryId: internet.id,
        date: new Date(),
        splitMethod: "EQUAL",
        createdById: priya.id,
        payers: { create: [{ userId: priya.id, amount: 999 }] },
        participants: {
          create: members.map((m) => ({ userId: m.id, share: 249.75 })),
        },
      },
    });

    await prisma.expense.create({
      data: {
        roomId: room.id,
        title: "Water Tanker",
        amount: 800,
        categoryId: water.id,
        date: new Date(),
        splitMethod: "EQUAL",
        createdById: ravi.id,
        payers: { create: [{ userId: ravi.id, amount: 800 }] },
        participants: {
          create: members.map((m) => ({ userId: m.id, share: 200 })),
        },
      },
    });
  }

  const existingBills = await prisma.bill.count({ where: { roomId: room.id } });
  if (existingBills === 0) {
    await prisma.bill.createMany({
      data: [
        {
          roomId: room.id,
          title: "Internet — October",
          amount: 999,
          categoryId: internet.id,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: "UPCOMING",
          createdById: admin.id,
        },
        {
          roomId: room.id,
          title: "Electricity — October",
          amount: 2300,
          categoryId: electricity.id,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: "UPCOMING",
          createdById: admin.id,
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log("Demo login: admin@roommate.dev / Password123 (Admin)");
  console.log("Demo login: priya@roommate.dev / Password123 (Roommate)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
