import "reflect-metadata";
import { config } from "dotenv";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../.env") });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || "127.0.0.1";
  await app.listen(port, host);
}

bootstrap();
