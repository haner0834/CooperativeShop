import { Request, Response, NextFunction } from "express";
import * as schoolService from "../services/school.service";
import { BadRequestError, NotFoundError } from "../types/error.types";

export const getAllSchools = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const provider = req.query.provider as "google" | "credential" | undefined;

    const schools = await schoolService.getAvailableSchools(provider);
    if (!schools) {
      throw new NotFoundError("SCHOOLS");
    }

    res.success(schools);
  } catch (error) {
    next(error);
  }
};

export const getSchoolById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== "string") {
      throw new BadRequestError("School ID is required.");
    }
    const school = await schoolService.getSchoolById(id);
    res.success(school);
  } catch (error) {
    next(error);
  }
};
