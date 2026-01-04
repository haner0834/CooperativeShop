import { Injectable } from '@nestjs/common';
import { ResponseSessionDto } from './dto/response-session.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthError, NotFoundError } from 'src/types/error.types';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}
  async getMeta(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundError('USER');

    return { createAt: user.createAt };
  }

  async updateMe() {}

  async getSessions(
    userId: string,
    deviceId: string,
  ): Promise<ResponseSessionDto[]> {
    const currentSession = await this.prisma.authSession.findFirst({
      where: { deviceId, account: { userId: userId } },
      select: { id: true },
    });

    const sessions = await this.prisma.authSession.findMany({
      where: { account: { userId } },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceId: session.deviceId,
      deviceType: session.deviceType,
      browser: session.browser,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === currentSession?.id,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
      select: { account: { select: { userId: true } } },
    });

    if (!session)
      throw new NotFoundError(
        'AUTH_SESSION',
        'Cannot find session with given id',
      );

    if (session.account.userId !== userId) {
      throw new AuthError(
        'ACCESS_DENIED',
        'Access Denied: Revokation is forbidden',
      );
    }

    await this.prisma.authSession.delete({
      where: { id: sessionId },
    });
  }
}
