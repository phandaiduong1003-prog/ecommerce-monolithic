import prisma from "../src/config/prisma.js";

async function main() {
  let normalRole = await prisma.role.findFirst({
    where: {
      rolename: "normal",
    },
  });

  if (!normalRole) {
    normalRole = await prisma.role.create({
      data: {
        rolename: "normal",
      },
    });
  }

  let normalMembership = await prisma.memberShip.findFirst({
    where: {
      mname: "normal",
    },
  });

  if (!normalMembership) {
    normalMembership = await prisma.memberShip.create({
      data: {
        mname: "normal",
        score: 10,
      },
    });
  }

  console.log("Default data created successfully");
  console.log("Role:", normalRole);
  console.log("Membership:", normalMembership);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });