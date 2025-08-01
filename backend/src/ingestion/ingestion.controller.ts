import {
  Controller,
  Post,
  Param,
  Get,
  Patch,
  UseGuards,
  Req,
  Query,
  BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
@UseGuards(AuthGuard('jwt'))
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * Trigger ingestion for a document
   */
  @Post('trigger/:documentId')
  async trigger(@Req() req, @Param('documentId') documentId: string) {
    if (!documentId) {
      throw new BadRequestException('Document ID is required');
    }
    return this.ingestionService.triggerIngestion(req.user, documentId);
  }

  /**
   * Get ingestion status by log ID
   */
  @Get('status/:id')
  async getStatus(@Param('id') ingestionId: string) {
    if (!ingestionId) {
      throw new BadRequestException('Ingestion ID is required');
    }
    return this.ingestionService.getIngestionStatus(ingestionId);
  }

  /**
   * Get ingestion history with pagination, filter, search
   */
  @Get('history')
  async getHistory(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 50, 1);
    return this.ingestionService.getIngestionHistory(pageNum, limitNum, status, search);
  }

  /**
   * Retry ingestion by ID (admin only)
   */
  @Patch('retry/:id')
  @UseGuards(new RolesGuard(['admin']))
  async retry(@Param('id') ingestionId: string) {
    if (!ingestionId) {
      throw new BadRequestException('Ingestion ID is required');
    }
    return this.ingestionService.retryIngestion(ingestionId);
  }

  /**
   * Cancel ingestion by ID (admin only)
   */
  @Patch('cancel/:id')
  @UseGuards(new RolesGuard(['admin']))
  async cancel(@Param('id') ingestionId: string) {
    if (!ingestionId) {
      throw new BadRequestException('Ingestion ID is required');
    }
    return this.ingestionService.cancelIngestion(ingestionId);
  }
}