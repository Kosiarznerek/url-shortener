import { ApiProperty } from '@nestjs/swagger';

export class LinkDto {
  @ApiProperty()
  public id: number;

  @ApiProperty()
  public url: string;

  @ApiProperty()
  public slug: string;

  @ApiProperty()
  public visits: number;

  @ApiProperty()
  public expiresAt: Date;
}
