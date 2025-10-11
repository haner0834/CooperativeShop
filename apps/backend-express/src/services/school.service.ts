import { Prisma, School } from "@prisma/client";
import prisma from "../config/db.config";
import { BadRequestError, NotFoundError } from "../types/error.types";

export interface SchoolDTO {
  id: string;
  name: string;
  abbreviation: string;
  loginMethod: string;
}

export const getAvailableSchools = async (
  provider?: "google" | "credential"
): Promise<SchoolDTO[]> => {
  let schools: School[] = [];
  if (!provider) {
    schools = await prisma.school.findMany();
  } else if (provider === "google") {
    schools = await prisma.school.findMany({
      where: {
        emailFormats: {
          isEmpty: false,
        },
      },
    });
  } else if (provider === "credential") {
    schools = await prisma.school.findMany({
      where: {
        studentIdFormat: {
          not: Prisma.JsonNull,
        },
      },
    });
  } else {
    throw new BadRequestError("Invalid login type");
  }

  return schools.map((school) => ({
    id: school.id,
    name: school.name,
    abbreviation: school.abbreviation,
    loginMethod: school.studentIdFormat ? "credential" : "google",
  }));
};

export const getSchoolById = async (id: string): Promise<SchoolDTO> => {
  const school = await prisma.school.findUnique({
    where: { id },
  });

  if (!school) throw new NotFoundError("SCHOOL");

  return {
    id: school.id,
    name: school.name,
    abbreviation: school.abbreviation,
    loginMethod: school.studentIdFormat ? "credential" : "google",
  };
};
