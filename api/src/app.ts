import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env, isProd } from "@/config/env";
import { apiRateLimit } from "@/middleware/rate-limit";
import { notFoundHandler, errorHandler } from "@/middleware/error-handler";
import { authRouter } from "@/routes/auth.routes";
import { roomRouter } from "@/routes/room.routes";
import { expenseRouter } from "@/routes/expense.routes";
import { settlementRouter } from "@/routes/settlement.routes";
import { dashboardRouter } from "@/routes/dashboard.routes";
import { notificationRouter } from "@/routes/notification.routes";
import { activityLogRouter } from "@/routes/activity-log.routes";
import { billRouter } from "@/routes/bill.routes";
import { budgetRouter } from "@/routes/budget.routes";
import { recurringRouter } from "@/routes/recurring.routes";
import { analyticsRouter } from "@/routes/analytics.routes";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: isProd ? undefined : false,
  }),
);
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan(isProd ? "combined" : "dev"));
app.use(apiRateLimit);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/rooms/:roomId/expenses", expenseRouter);
app.use("/api/rooms/:roomId/settlements", settlementRouter);
app.use("/api/rooms/:roomId/dashboard", dashboardRouter);
app.use("/api/rooms/:roomId/activity-log", activityLogRouter);
app.use("/api/rooms/:roomId/bills", billRouter);
app.use("/api/rooms/:roomId/budget", budgetRouter);
app.use("/api/rooms/:roomId/recurring-expenses", recurringRouter);
app.use("/api/rooms/:roomId/analytics", analyticsRouter);
app.use("/api/notifications", notificationRouter);

app.use(notFoundHandler);
app.use(errorHandler);
