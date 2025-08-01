import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { IngestionLog, IngestionStatus } from './entities/ingestion-log.entity';
import { Document } from '../documents/entities/document.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(IngestionLog) private ingestionRepo: Repository<IngestionLog>,
    @InjectRepository(Document) private docRepo: Repository<Document>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  /**
   * Trigger ingestion for a document
   */
  async triggerIngestion(userPayload: any, documentId: string) {
    const doc = await this.docRepo.findOne({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    // Access Control
    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
    if (!user) throw new NotFoundException('User not found');

    const isAdmin = user.role === 'admin';
    const isEditorWithPermission = user.role === 'editor' && user.canTriggerIngestion;

    if (!isAdmin && !isEditorWithPermission) {
      throw new ForbiddenException('You are not allowed to trigger ingestion');
    }

    // Prevent duplicate ingestion in progress or pending
    const ongoing = await this.ingestionRepo.findOne({
      where: [
        { document: { id: documentId }, status: IngestionStatus.PENDING },
        { document: { id: documentId }, status: IngestionStatus.IN_PROGRESS },
      ],
    });
    if (ongoing) {
      throw new BadRequestException('Ingestion for this document is already in progress or pending.');
    }

    // Create ingestion log
    const log = this.ingestionRepo.create({
      document: doc,
      user,
      status: IngestionStatus.PENDING,
      responseMessage: null,
    });
    await this.ingestionRepo.save(log);

    // Simulated ingestion process
    log.status = IngestionStatus.IN_PROGRESS;
    await this.ingestionRepo.save(log);

    setTimeout(async () => {
      // Use env variable to decide simulation behavior
      const simulateRandom = process.env.RANDOM_INGESTION === 'true';

      let finalStatus = IngestionStatus.COMPLETED;
      if (simulateRandom) {
        const possibleStatuses = [
          IngestionStatus.COMPLETED,
          IngestionStatus.FAILED,
          IngestionStatus.CANCELLED,
        ];
        finalStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
      }

      log.status = finalStatus;
      log.responseMessage =
        finalStatus === IngestionStatus.COMPLETED
          ? 'Ingestion completed successfully'
          : finalStatus === IngestionStatus.FAILED
          ? 'Ingestion failed due to processing error'
          : 'Ingestion was cancelled';
      await this.ingestionRepo.save(log);

      // Update document status only if ingestion completed successfully
      if (finalStatus === IngestionStatus.COMPLETED) {
        doc.status = 'ingested';
        await this.docRepo.save(doc);
      }
    }, 3000);

    return { message: 'Ingestion triggered', ingestionId: log.id };
  }

  async getIngestionStatus(ingestionId: string) {
    const log = await this.ingestionRepo.findOne({
      where: { id: ingestionId },
      relations: ['document', 'user'],
    });
    if (!log) throw new NotFoundException('Ingestion record not found');
    return log;
  }

  async getIngestionHistory(page = 1, limit = 50, status?: string, search?: string) {
    const query = this.ingestionRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.document', 'document')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
  
    // Filter by status
    if (status && status !== 'all') {
      query.andWhere('log.status = :status', { status });
    }
  
    // Search by document title
    if (search && search.trim() !== '') {
      query.andWhere('document.title ILIKE :search', { search: `%${search}%` });
    }
  
    const [result, total] = await query.getManyAndCount();
  
    const formatted = result.map((log) => ({
      id: log.id,
      documentId: log.document?.id || null,
      documentTitle: log.document?.title || 'Unknown Document',
      status: log.status,
      triggeredBy: log.user?.email || 'System',
      createdAt: log.createdAt,
    }));
  
    return {
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }    

  async retryIngestion(ingestionId: string) {
    const log = await this.getIngestionStatus(ingestionId);
    log.status = IngestionStatus.PENDING;
    log.responseMessage = 'Retrying ingestion...';
    await this.ingestionRepo.save(log);
    // TODO: Re-trigger Python ingestion
    return { message: 'Ingestion retry initiated' };
  }

  async cancelIngestion(ingestionId: string) {
    const log = await this.getIngestionStatus(ingestionId);
    if (log.status === IngestionStatus.COMPLETED || log.status === IngestionStatus.FAILED) {
      throw new ForbiddenException('Cannot cancel completed or failed ingestion');
    }
    log.status = IngestionStatus.CANCELLED;
    log.responseMessage = 'Ingestion cancelled by admin';
    return this.ingestionRepo.save(log);
  }
}