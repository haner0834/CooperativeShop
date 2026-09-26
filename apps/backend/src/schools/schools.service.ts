import { Injectable } from '@nestjs/common';
import { Prisma, School } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SchoolDTO } from './dto/schools.dto';
import {
  AppError,
  BadRequestError,
  NotFoundError,
} from 'src/types/error.types';
import { plainToInstance } from 'class-transformer';

type SchoolWithCount = School & {
  _count: {
    users: number;
    shops: number;
  };
};

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getCurrentPeriod() {
    const now = new Date();
    const currentPeriod = await this.prisma.partnershipPeriod.findFirst({
      where: {
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: {
        schools: {
          include: {
            _count: {
              select: {
                shops: true,
                users: true,
              },
            },
          },
        },
      },
    });
    if (!currentPeriod)
      throw new AppError(
        'PERIOD_NOT_EXIST',
        `There's no available period for querying schools.`,
        500,
      );

    return currentPeriod;
  }

  async getAvailableSchools(
    provider?: 'google' | 'credential',
  ): Promise<SchoolDTO[]> {
    const currentPeriod = await this.getCurrentPeriod();

    let schools: SchoolDTO[] = plainToInstance(
      SchoolDTO,
      currentPeriod.schools,
      {
        excludeExtraneousValues: true,
      },
    );

    if (provider && provider !== 'google' && provider !== 'credential') {
      throw new BadRequestError('INVALID_LOGIN_TYPE', 'Invalid login type');
    }

    if (provider) {
      schools = schools.filter((s) => s.loginMethod === 'google');
    }

    return schools;
  }

  async getSchoolById(id: string): Promise<SchoolDTO> {
    const currentPeriod = await this.getCurrentPeriod();
    const school = currentPeriod.schools.find((s) => s.id === id);

    if (!school) throw new NotFoundError('SCHOOL');

    return plainToInstance(SchoolDTO, school, {
      excludeExtraneousValues: true,
    });
  }

  async getSchoolByAbbr(abbr: string): Promise<SchoolDTO> {
    const currentPeriod = await this.getCurrentPeriod();
    const school = currentPeriod.schools.find((s) => s.abbreviation === abbr);

    if (!school) throw new NotFoundError('SCHOOL');

    return plainToInstance(SchoolDTO, school, {
      excludeExtraneousValues: true,
    });
  }
}
