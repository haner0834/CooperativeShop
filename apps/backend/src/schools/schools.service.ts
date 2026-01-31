import { Injectable } from '@nestjs/common';
import { Prisma, School } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SchoolDTO } from './dto/schools.dto';
import { BadRequestError, NotFoundError } from 'src/types/error.types';

type SchoolWithCount = School & {
  _count: {
    users: number;
    shops: number;
  };
};

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableSchools(
    provider?: 'google' | 'credential',
  ): Promise<SchoolDTO[]> {
    let schools: SchoolWithCount[] = [];
    if (!provider) {
      schools = await this.prisma.school.findMany({
        include: {
          _count: {
            select: {
              shops: true,
              users: true,
            },
          },
        },
      });
    } else if (provider === 'google') {
      schools = await this.prisma.school.findMany({
        where: {
          emailFormats: {
            isEmpty: false,
          },
        },
        include: {
          _count: {
            select: {
              shops: true,
              users: true,
            },
          },
        },
      });
    } else if (provider === 'credential') {
      schools = await this.prisma.school.findMany({
        where: {
          studentIdFormat: {
            not: Prisma.JsonNull,
          },
        },
        include: {
          _count: {
            select: {
              shops: true,
              users: true,
            },
          },
        },
      });
    } else {
      throw new BadRequestError('INVALID_LOGIN_TYPE', 'Invalid login type');
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
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            shops: true,
            users: true,
          },
        },
      },
    });

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
    const school = await this.prisma.school.findUnique({
      where: { abbreviation: abbr },
      include: {
        _count: {
          select: {
            shops: true,
            users: true,
          },
        },
      },
    });

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
