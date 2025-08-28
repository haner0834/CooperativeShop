import { Prisma } from "@prisma/client";
import prisma from "../config/db.config";
import { BadRequestError, NotFoundError } from "../types/error.types";
import { equal } from "assert";

export const getAvailableSchools = async (
  provider?: "google" | "credential"
) => {
  if (!provider) {
    const schools = await prisma.school.findMany();
    return schools;
  } else if (provider === "google") {
    return await prisma.school.findMany({
      where: {
        emailFormats: {
          isEmpty: false,
        },
      },
    });
  } else if (provider === "credential") {
    return await prisma.school.findMany({
      where: {
        studentIdFormat: {
          not: Prisma.JsonNull,
        },
      },
    });
  } else {
    throw new BadRequestError("Invalid login type");
  }
};

export const getSchoolById = async (id: string) => {
  const school = await prisma.school.findUnique({
    where: { id },
  });

  if (!school) throw new NotFoundError("SCHOOL");

  return school;
};
