import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  health() {
    return this.appService.health();
  }

  @Get("/v1/home")
  home() {
    return this.appService.getHome();
  }

  @Get("/v1/catalog")
  catalog() {
    return this.appService.getCatalog();
  }

  @Get("/v1/listings")
  listings(
    @Query("query") query?: string,
    @Query("category") category?: string,
    @Query("region") region?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.appService.listListings({
      query,
      category,
      region,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("/v1/listings/:slug")
  listing(@Param("slug") slug: string) {
    const result = this.appService.getListing(slug);
    if (!result) {
      throw new NotFoundException(`Listing not found: ${slug}`);
    }
    return result;
  }

  @Get("/v1/search")
  search(
    @Query("q") query?: string,
    @Query("category") category?: string,
    @Query("region") region?: string,
    @Query("limit") limit?: string,
  ) {
    return this.appService.searchListings({
      query,
      category,
      region,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
