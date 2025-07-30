import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Document } from './entities/document.entity';
  import { User } from '../users/entities/user.entity';
  import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
  import { createReadStream } from 'fs';
  import { unlink } from 'fs/promises';
  import { Express } from 'express';
  
  @Injectable()
  export class DocumentsService {
    private s3Enabled = process.env.STORAGE_PROVIDER === 's3';
    private s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  
    constructor(
      @InjectRepository(Document) private docRepo: Repository<Document>,
      @InjectRepository(User) private userRepo: Repository<User>,
    ) {}
  
    /**
     * Create a new document
     */
    async create(
      userPayload: any,
      file: Express.Multer.File,
      title: string,
      description: string,
    ) {
      // ✅ Fetch full User entity to avoid UpdateValuesMissingError
      const user = await this.userRepo.findOne({
        where: { id: userPayload.userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      let filePath = file.path;
      let storageLocation: 'local' | 's3' = 'local';
  
      // ✅ Handle S3 upload if enabled
      if (this.s3Enabled) {
        const bucket = process.env.AWS_BUCKET_NAME || 'documents-bucket';
        const key = `uploads/${Date.now()}-${file.originalname}`;
  
        try {
          await this.s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: createReadStream(file.path),
            }),
          );
          filePath = `s3://${bucket}/${key}`;
          storageLocation = 's3';
  
          // Delete local temp file after upload
          await unlink(file.path);
        } catch (error) {
          throw new InternalServerErrorException('S3 upload failed');
        }
      }
  
      const doc = this.docRepo.create({
        user,
        title,
        description,
        filePath,
        fileType: file.mimetype,
        storageLocation,
      });
  
      return this.docRepo.save(doc);
    }
  
    /**
     * Find all documents
     */
    async findAll(): Promise<Document[]> {
      return this.docRepo.find({ relations: ['user'] });
    }
  
    /**
     * Find one document by ID
     */
    async findOne(id: string): Promise<Document> {
      const doc = await this.docRepo.findOne({ where: { id }, relations: ['user'] });
      if (!doc) throw new NotFoundException('Document not found');
      return doc;
    }
  
    /**
     * Update document details
     */
    async update(id: string, updateData: Partial<Document>) {
      await this.findOne(id); // ensure it exists
      if (!updateData || Object.keys(updateData).length === 0) {
        throw new InternalServerErrorException('No update values provided');
      }
      await this.docRepo.update(id, updateData);
      return this.findOne(id);
    }
  
    /**
     * Delete a document
     */
    async remove(id: string) {
      const doc = await this.findOne(id);
      await this.docRepo.delete(id);
      return { message: `Document ${doc.id} deleted successfully` };
    }
}  