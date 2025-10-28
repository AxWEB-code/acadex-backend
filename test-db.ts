import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

db.$connect()
  .then(() => console.log("✅ Connected to database successfully!"))
  .catch((err) => console.error("❌ Database connection failed:", err))
  .finally(() => db.$disconnect());
