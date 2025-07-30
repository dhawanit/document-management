import { Controller, Post, Param, Get, Patch, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
@UseGuards(AuthGuard('jwt'))
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('trigger/:documentId')
  async trigger(@Req() req, @Param('documentId') documentId: string) {
    return this.ingestionService.triggerIngestion(req.user, documentId);
  }

  @Get('status/:id')
  async getStatus(@Param('id') ingestionId: string) {
    return this.ingestionService.getIngestionStatus(ingestionId);
  }

  @Get('history')
  async getHistory() {
    return this.ingestionService.getIngestionHistory();
  }

  @Patch('retry/:id')
  @UseGuards(new RolesGuard(['admin']))
  async retry(@Param('id') ingestionId: string) {
    return this.ingestionService.retryIngestion(ingestionId);
  }

  @Patch('cancel/:id')
  @UseGuards(new RolesGuard(['admin']))
  async cancel(@Param('id') ingestionId: string) {
    return this.ingestionService.cancelIngestion(ingestionId);
  }
}