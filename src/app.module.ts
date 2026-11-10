import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    DatabaseModule,
    HealthModule,
    // Giai đoạn 5: AuthModule, UsersModule, CatalogModule, CartModule, CouponsModule,
    // OrdersModule, PaymentsModule, ReviewsModule, AdminStatsModule
  ],
})
export class AppModule {}
