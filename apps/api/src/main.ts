import "./load-env";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { requireSessionSecret } from "./identity/session-token";

async function bootstrap() {
  requireSessionSecret();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  const port = Number(process.env.API_PORT ?? 4001);
  await app.listen(port);
}

void bootstrap();
