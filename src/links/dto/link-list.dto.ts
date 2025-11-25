import { ApiProperty } from '@nestjs/swagger';
import { LinkDto } from './link.dto';

export class LinkListDto {
  @ApiProperty({ type: [LinkDto] })
  public items: LinkDto[];

  @ApiProperty()
  public total: number;

  @ApiProperty()
  public limit: number;

  @ApiProperty()
  public offset: number;
}
