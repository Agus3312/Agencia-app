/**
 * Shared Prisma Client instance
 * Prisma v7: uses prisma.config.ts for CLI, env var for runtime.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
