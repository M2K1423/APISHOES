import { Controller, Get, Query } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getRecentNotifications(@Query("limit") limit?: string) {
    return this.notificationsService.getRecentNotifications(Number(limit) || 10);
  }
}
