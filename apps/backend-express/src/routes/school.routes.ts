import { Router } from "express";
import * as schoolService from "../controllers/school.controller";

const router = Router();

router.get("/all", schoolService.getAllSchools);
router.get("/:id", schoolService.getSchoolById);

export default router;
