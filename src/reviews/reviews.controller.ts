import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query, NotFoundException } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { FirebaseAuthGuard } from "../users/auth.guard";
import { RolesGuard } from "../users/roles.guard";
import { Roles } from "../users/roles.decorator";
import { UsersService } from "../users/users.service";

@Controller("reviews")
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly usersService: UsersService
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createReview(@Body() body: CreateReviewDto, @Req() req: any) {
    const userDb = await this.usersService.getUserByUid(req.user.uid);
    const userName = userDb?.displayName || req.user.name || req.user.email || "Khách hàng";
    return this.reviewsService.createReview(req.user.uid, userName, body);
  }

  @Get("product/:productId")
  getReviewsByProduct(@Param("productId") productId: string) {
    return this.reviewsService.getReviewsByProduct(productId);
  }

  @Get("admin")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  getReviewsAdmin() {
    return this.reviewsService.getReviewsAdmin();
  }

  @Patch(":id/status")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  async updateReviewStatus(
    @Param("id") id: string,
    @Body("status") status: string
  ) {
    const updated = await this.reviewsService.updateReviewStatus(id, status);
    if (!updated) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return updated;
  }

  @Patch(":id/reply")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  async addAdminReply(
    @Param("id") id: string,
    @Body("reply") reply: string
  ) {
    const updated = await this.reviewsService.addAdminReply(id, reply);
    if (!updated) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return updated;
  }
}
