import { Injectable } from '@nestjs/common';
import { Prisma, School } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SchoolDTO } from './dto/schools.dto';
import {
  AppError,
  BadRequestError,
  NotFoundError,
} from 'src/types/error.types';

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

    let schools: SchoolWithCount[] = currentPeriod.schools;

    if (provider && provider !== 'google' && provider !== 'credential') {
      throw new BadRequestError('INVALID_LOGIN_TYPE', 'Invalid login type');
    }

    if (provider === 'google') {
      schools = schools.filter((s) => s.emailFormats.length > 0);
    } else if (provider === 'credential') {
      schools = schools.filter((s) => s.studentIdFormat !== null);
    }

    return schools.map((school) => ({
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      loginMethod: school.emailFormats.length > 0 ? 'google' : 'credential',
      instagramAccount: school.instagramAccount,
      websiteUrl: school.websiteUrl,
      usersCount: school._count.users,
      shopsCount: school._count.shops,
    }));
  }

  async getSchoolById(id: string): Promise<SchoolDTO> {
    const currentPeriod = await this.getCurrentPeriod();
    const school = currentPeriod.schools.find((s) => s.id === id);

    if (!school) throw new NotFoundError('SCHOOL');

    return {
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      loginMethod: school.emailFormats.length >= 1 ? 'google' : 'credential',
      instagramAccount: school.instagramAccount,
      websiteUrl: school.websiteUrl,
      usersCount: school._count.users,
      shopsCount: school._count.shops,
    };
  }

  async getSchoolByAbbr(abbr: string): Promise<SchoolDTO> {
    const currentPeriod = await this.getCurrentPeriod();
    const school = currentPeriod.schools.find((s) => s.abbreviation === abbr);

    if (!school) throw new NotFoundError('SCHOOL');

    if (!school) throw new NotFoundError('SCHOOL');

    return {
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      loginMethod: school.emailFormats.length >= 1 ? 'google' : 'credential',
      instagramAccount: school.instagramAccount,
      websiteUrl: school.websiteUrl,
      usersCount: school._count.users,
      shopsCount: school._count.shops,
    };
  }
}
