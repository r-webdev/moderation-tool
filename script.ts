import { PrismaClient } from "./generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      discordId: "883932482734",
    },
  });
  console.log(user);

  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
