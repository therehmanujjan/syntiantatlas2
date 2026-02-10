import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ContentService } from './content.service';
import { CreateContentDto, UpdateContentDto, QueryContentDto } from './dto/content.dto';

// ── Public Content Endpoints ──
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  findAll(@Query() query: QueryContentDto) {
    return this.contentService.findAll(query);
  }

  @Get('categories')
  getCategories() {
    return this.contentService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user?.id;
    return this.contentService.findOne(id, userId);
  }
}

// ── Authenticated Content Endpoints (progress tracking) ──
@Controller('content')
@UseGuards(AuthGuard('jwt'))
export class ContentProgressController {
  constructor(private readonly contentService: ContentService) {}

  @Get('me/progress')
  getMyProgress(@Request() req: any) {
    return this.contentService.getProgress(req.user.id);
  }

  @Post(':id/complete')
  markComplete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.contentService.markComplete(req.user.id, id);
  }
}

// ── Admin Content CRUD ──
@Controller('admin/content')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'operations_manager')
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  findAll(@Query() query: QueryContentDto) {
    return this.contentService.adminFindAll(query);
  }

  @Post()
  create(@Body() dto: CreateContentDto) {
    return this.contentService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.remove(id);
  }
}
