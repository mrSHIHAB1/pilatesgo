import { Router } from "express";
import { NotificationController } from "./notification.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.get(
  "/me",
  auth(),
  NotificationController.myNotifications,
);

router.patch(
  "/read/:notificationId",
  auth(),
  NotificationController.markRead,
);

router.patch(
  "/read-all",
  auth(),
  NotificationController.markAllRead,
);

router.delete(
  "/delete/:id",
  auth(),
  NotificationController.deleteNotificationController,  
);

router.post("/test-push", NotificationController.sendTestPush);

export const notificationRoutes = router;
