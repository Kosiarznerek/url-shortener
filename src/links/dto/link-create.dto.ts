import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUrl } from 'class-validator';

export class LinkCreateDto {
  @IsUrl()
  @ApiProperty()
  public url: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  public slug?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiProperty()
  public expiresAt?: Date;
}
