import { PrismaClient } from "@prisma/client";

let prisma;

const connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
    log: ["error"],
  });
} else {
  // Avoid creating multiple instances in development
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
      log: ["query", "error", "warn"],
    });
  }
  prisma = global.prisma;
}

export default prisma;
