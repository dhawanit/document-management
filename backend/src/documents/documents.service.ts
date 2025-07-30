import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    ForbiddenException
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
    async updateDocument(
      userPayload: any,
      id: string,
      updateData: { title?: string; description?: string },
      file?: Express.Multer.File,
    ) {
      const document = await this.docRepo.findOne({
        where: { id },
        relations: ['user'],
      });
  
      if (!document) throw new NotFoundException('Document not found');
  
      const isAdmin = userPayload.role === 'admin';
      const isEditor = userPayload.role === 'editor';
      const isCreator = document.user.id === userPayload.userId;
  
      // ✅ Rule 1: Ingested document → only admin can update
      if (document.status.toLowerCase() === 'ingested' && !isAdmin) {
        throw new ForbiddenException('Only admin can update an ingested document');
      }
  
      // ✅ Rule 2: Non-ingested → admin, editor, or creator can update
      if (document.status.toLowerCase() !== 'ingested' && !isAdmin && !isEditor && !isCreator) {
        throw new ForbiddenException('You are not allowed to update this document');
      }
  
      // ✅ Update fields
      if (updateData.title) document.title = updateData.title;
      if (updateData.description) document.description = updateData.description;
  
      // ✅ If new file uploaded
      if (file) {
        let newFilePath = file.path;
        let storageLocation: 'local' | 's3' = 'local';
  
        if (this.s3Enabled) {
          const bucket = process.env.AWS_BUCKET_NAME || 'documents-bucket';
          const key = `uploads/${Date.now()}-${file.originalname}`;
  
          await this.s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: createReadStream(file.path),
            }),
          );
          newFilePath = `s3://${bucket}/${key}`;
          storageLocation = 's3';
  
          await unlink(file.path);
        }
  
        document.filePath = newFilePath;
        document.fileType = file.mimetype;
        document.storageLocation = storageLocation;
      }
  
      // ✅ Reset status to 'uploaded' if document was ingested and updated
      if (document.status.toLowerCase() === 'ingested' && isAdmin) {
        document.status = 'uploaded';
      }
  
      return this.docRepo.save(document);
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