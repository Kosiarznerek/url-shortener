import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { LinkCreateDto } from './dto/link-create.dto';
import { LinkDto } from './dto/link.dto';
import { LinkListDto } from './dto/link-list.dto';
import { LinksService } from './links.service';
import { Response } from 'express';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('links')
export class LinksController {
  public constructor(private linksService: LinksService) {}

  @Post()
  @ApiResponse({ status: 201, type: LinkDto })
  public create(@Body() linkCreateDto: LinkCreateDto): Promise<LinkDto> {
    return this.linksService.create(linkCreateDto);
  }

  @Get()
  @ApiResponse({ status: 200, type: LinkListDto })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  public findAll(
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ): Promise<LinkListDto> {
    return this.linksService.findAll(search, offset, limit);
  }

  @Get(':slug')
  @ApiResponse({ status: 302, description: 'Redirects to the original URL' })
  public async findOneAndRedirect(@Param('slug') slug: string, @Res() response: Response) {
    const link = await this.linksService.findOneAndRedirect(slug);
    response.redirect(302, link.url);
  }
}
