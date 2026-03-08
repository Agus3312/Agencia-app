const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDelete() {
  try {
    // Find the first user that isn't the only one, or just pick any user to simulate deletion
    const users = await prisma.user.findMany({ take: 10 });
    console.log("Users found:", users.map(u => ({ id: u.id, name: u.name })));
    
    if (users.length === 0) {
      console.log("No users to delete");
      process.exit(0);
    }
    
    const targetUserId = users[users.length - 1].id;
    console.log("Attempting to delete user:", targetUserId);

    // Run the exact same logic as backend/src/routes/teams.js
    await prisma.projectMember.deleteMany({ where: { userId: targetUserId } });
    await prisma.personalTask.deleteMany({ where: { userId: targetUserId } });
    await prisma.personalNote.deleteMany({ where: { userId: targetUserId } });
    await prisma.task.updateMany({
        where: { assignedId: targetUserId },
        data: { assignedId: null }
    });
    
    await prisma.message.deleteMany({ where: { authorId: targetUserId } });
    await prisma.file.deleteMany({ where: { userId: targetUserId } });
    await prisma.update.deleteMany({ where: { authorId: targetUserId } });
    await prisma.activityLog.deleteMany({ where: { userId: targetUserId } });
    
    // Attempt final user deletion
    await prisma.user.delete({ where: { id: targetUserId } });
    
    console.log("SUCCESSFULLY DELETED USER!");
    
  } catch (err) {
    console.error("PRISMA ERROR REPRODUCED:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

debugDelete();
