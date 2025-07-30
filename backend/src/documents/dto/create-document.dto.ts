import { IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateDocumentDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsEnum(['local', 's3'])
  storageLocation: 'local' | 's3';
}