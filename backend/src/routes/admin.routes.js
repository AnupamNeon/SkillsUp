import { Router } from "express";
import { authenticate, protectAdmin } from "../middleware/auth.js";
import { adminWriteLimiter } from "../middleware/rateLimiter.js";
import validate from "../middleware/validate.js";
import {
  updateUserRoleValidator,
  listUsersValidator,
  userIdParamValidator,
} from "../validators/admin.validator.js";
import {
  updateUserRole,
  listUsers,
  listEducators,
  deleteUser,
  adminDashboard,
} from "../controllers/admin.controller.js";

import { manuallyFulfillPurchase } from "../controllers/webhook.controller.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, protectAdmin);

router.get("/dashboard", adminDashboard);
router.get("/users", listUsersValidator, validate, listUsers);
router.get("/educators", listEducators);
router.put(
  "/users/:userId/role",
  adminWriteLimiter,
  updateUserRoleValidator,
  validate,
  updateUserRole,
);

router.delete(
  "/users/:userId",
  adminWriteLimiter,
  userIdParamValidator,
  validate,
  deleteUser,
);

// Recovery route for stuck purchases
router.post(
  "/purchases/:purchaseId/fulfill",
  adminWriteLimiter,
  manuallyFulfillPurchase,
);

export default router;
