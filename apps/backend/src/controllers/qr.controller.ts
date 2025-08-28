import { Request, Response, NextFunction } from "express";
import * as qrService from "../services/qr.service";
import { AuthRequest } from "../types/auth.types";
import { BadRequestError, InternalError } from "../types/error.types";

/**
 * [Authenticated] 生成當前登入使用者的 QR Code
 */
export const generateUserQrCode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.bitch;
    if (!user) {
      throw new InternalError("Middleware doesn't work well. Fuck u <3");
    }
    const qrCodeBuffer = await qrService.generateQRCodeImage(user.id);

    res.setHeader("Content-Type", "image/png");
    res.send(qrCodeBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * [Public] 驗證掃描到的 QR Code 資料
 */
export const verifyUserQrCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data } = req.body;

    // check if data exist first
    const decoded = decodeURIComponent(data);
    const qrData = JSON.parse(decoded);

    const {
      signature,
      schoolAbbreviation,
      schoolName,
      userId,
    }: qrService.QrCodePayload = qrData;
    if (!signature || !schoolAbbreviation || !schoolName || !userId) {
      throw new BadRequestError("Fuck u");
    }

    const verifiedData = await qrService.verifyQRCodeData(qrData);
    res.success(verifiedData);
  } catch (error) {
    next(error);
  }
};
