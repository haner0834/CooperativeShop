import {
  Controller,
  Get,
  Query,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SchoolsService } from './schools.service';

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('all')
  async getAllSchools(@Query('provider') provider?: 'google' | 'credential') {
    const schools = await this.schoolsService.getAvailableSchools(provider);

    if (!schools || schools.length === 0) {
      throw new NotFoundException('SCHOOLS');
    }

    return schools;
  }

  @Get(':id')
  async getSchoolById(@Param('id') id: string) {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('School ID is required.');
    }

    const school = await this.schoolsService.getSchoolById(id);

    if (!school) {
      throw new NotFoundException(`School with id ${id} not found`);
    }

    return school;
  }
}
