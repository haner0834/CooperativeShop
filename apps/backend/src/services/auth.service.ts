import { PrismaClient, School, User } from "@prisma/client";
import bcrypt from "bcrypt";
import { validateStudentId } from "../validators/studentId.validator";
import { validateEmailAndStudentId } from "../validators/email.validator";
import {
  AppError,
  AuthError,
  BadRequestError,
  InternalError,
} from "../types/error.types";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

interface GoogleProfile {
  id: string;
  displayName: string;
  email: string;
}

export const registerWithStudentId = async (data: {
  schoolId: string;
  studentId: string;
  name: string;
  password: string;
}): Promise<User> => {
  const student = await prisma.user.findUnique({
    where: { id: data.studentId },
    select: { name: true },
  });
  if (student)
    throw new AppError(
      "EXISTING_USER",
      "A user with given studentId is already existing.",
      409
    );

  const school = await prisma.school.findUnique({
    where: { id: data.schoolId },
  });
  if (!school) throw new InternalError("School not found.");

  if (!validateStudentId(data.studentId, school.studentIdFormat)) {
    throw new AppError(
      "INVALID_STUDENT_ID_FORMAT",
      "Invalid Student ID format.",
      400
    );
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // 使用交易確保 User 和 Account 同時被建立
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        studentId: data.studentId,
        schoolId: data.schoolId,
      },
    });

    await tx.account.create({
      data: {
        userId: newUser.id,
        provider: "credentials",
        providerAccountId: data.studentId,
        password: hashedPassword,
      },
    });
    return newUser;
  });

  return user;
};

export const loginWithStudentId = async (data: {
  schoolId: string;
  studentId: string;
  password: string;
}): Promise<User> => {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "credentials",
        providerAccountId: data.studentId,
      },
    },
    include: { user: true },
  });

  // 確保使用者屬於指定的學校
  if (!account || account.user.schoolId !== data.schoolId) {
    throw new BadRequestError("Invalid credentials.");
  }

  const passwordMatch = await bcrypt.compare(data.password, account.password!);
  if (!passwordMatch) {
    throw new BadRequestError("Invalid credentials.");
  }

  return account.user;
};

export const findOrCreateUserByGoogle = async (
  profile: GoogleProfile,
  school: School
): Promise<User> => {
  if (!validateEmailAndStudentId(profile.email, school)) {
    throw new AuthError(
      "EMAIL_SCHOOL_MISMATCH",
      "Email address does not match any of the school's required formats."
    );
  }

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: profile.id,
      },
    },
    include: { user: true },
  });

  if (existingAccount) return existingAccount.user;

  // 交易：尋找或建立 User，然後建立 Account
  return await prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      user = await tx.user.create({
        data: {
          name: profile.displayName,
          email: profile.email,
          schoolId: school.id,
        },
      });
    }

    await tx.account.create({
      data: {
        userId: user.id,
        provider: "google",
        providerAccountId: profile.id,
      },
    });
    return user;
  });
};
