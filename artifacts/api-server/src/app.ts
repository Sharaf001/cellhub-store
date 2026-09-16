import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createReadStream, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/download/cellhub", (_req, res) => {
  const zipPath = join(__dirname, "../../../../cellhub-store-windows.zip");
  if (!existsSync(zipPath)) {
    res.status(404).send("File not found");
    return;
  }
  res.setHeader("Content-Disposition", "attachment; filename=cellhub-store-windows.zip");
  res.setHeader("Content-Type", "application/zip");
  createReadStream(zipPath).pipe(res);
});

app.use("/api", router);

// Temporary diagnostic error handler - logs the real underlying error
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(
    {
      message: err?.message,
      cause: err?.cause?.message ?? err?.cause,
      code: err?.code,
      stack: err?.stack,
    },
    "Unhandled request error",
  );

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({
    error: err?.message ?? "Internal Server Error",
    cause: err?.cause?.message ?? err?.cause,
  });
});

export default app;
