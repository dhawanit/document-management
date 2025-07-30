import { Controller, Post, Get, Patch, Delete, Param, Body, UploadedFile, UseInterceptors, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
    })
  }))
  async create(@Req() req, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.documentsService.create(req.user, file, body.title, body.description);
  }

  @Get()
  async findAll() {
    return this.documentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
    })
  }))
  async updateDocument(
    @Req() req,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.updateDocument(req.user, id, {
      title: body.title,
      description: body.description
    }, file);
  }

  @Delete(':id')
  @UseGuards(new RolesGuard(['admin']))
  async remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}