import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'
// import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma }




// import "dotenv/config";
// // lib/prisma.ts
// import { PrismaClient } from "./generated/prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { Pool } from "@neondatabase/serverless";

// declare global {
//   // Allow global `prisma` in development to prevent hot-reload creating many clients
//   var prisma: PrismaClient | undefined;
// }

// const connectionString = process.env.DATABASE_URL!;

// const prisma =
//   global.prisma ||
//   new PrismaClient({
//     adapter: new PrismaPg(new Pool({ connectionString })),
    
//   });

// if (process.env.NODE_ENV !== "production") {
//   global.prisma = prisma;
// }

// export default prisma;