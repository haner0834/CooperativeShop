import { Injectable } from '@nestjs/common';
import { Prisma, School } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SchoolDTO } from './dto/schools.dto';
import { BadRequestError, NotFoundError } from 'src/types/error.types';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableSchools(
    provider?: 'google' | 'credential',
  ): Promise<SchoolDTO[]> {
    let schools: School[] = [];
    if (!provider) {
      schools = await this.prisma.school.findMany();
    } else if (provider === 'google') {
      schools = await this.prisma.school.findMany({
        where: {
          emailFormats: {
            isEmpty: false,
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
    }));
  }

  async getSchoolById(id: string): Promise<SchoolDTO> {
    const school = await this.prisma.school.findUnique({
      where: { id },
    });

    if (!school) throw new NotFoundError('SCHOOL');

    return {
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      loginMethod: school.studentIdFormat ? 'credential' : 'google',
      instagramAccount: school.instagramAccount,
      websiteUrl: school.websiteUrl,
    };
  }

  async getSchoolByAbbr(abbr: string): Promise<SchoolDTO> {
    const school = await this.prisma.school.findUnique({
      where: { abbreviation: abbr },
    });

    if (!school) throw new NotFoundError('SCHOOL');

    return {
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      loginMethod: school.studentIdFormat ? 'credential' : 'google',
      instagramAccount: school.instagramAccount,
      websiteUrl: school.websiteUrl,
    };
  }
}
