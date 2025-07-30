import { IsBoolean } from 'class-validator';

export class UpdatePermissionsDto {
  @IsBoolean()
  canTriggerIngestion: boolean;
}