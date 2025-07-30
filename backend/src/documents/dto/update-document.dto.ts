import { IsOptional } from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;
}