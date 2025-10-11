import { Request, Response, NextFunction } from "express";
import * as qrService from "../services/qr.service";
import { AuthRequest } from "../types/auth.types";
import { AppError, BadRequestError, InternalError } from "../types/error.types";

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

export const generateUserQrCodeData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.bitch;
    if (!user) {
      throw new InternalError("Middleware doesn't work well. Fuck u <3");
    }
    const qrData = await qrService.generateQRCodeData(user.id);

    res.success(qrData);
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
    let qrData: qrService.QrCodePayload;
    try {
      if (typeof data !== "string") {
        throw new BadRequestError("QR code data is missing or not a string");
      }

      const decoded = decodeURIComponent(data);
      qrData = JSON.parse(decoded);
    } catch (err) {
      return next(new AppError("INVALID_QR", "Invalid QR code payload", 400));
    }

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
