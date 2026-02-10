import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { SentryModule } from './common/sentry/sentry.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { SettingsModule } from './modules/settings/settings.module';
import { KycModule } from './modules/kyc/kyc.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TicketsModule } from './modules/tickets/tickets.module';
// Phase 6: Advanced Services
import { DividendsModule } from './modules/dividends/dividends.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EmailModule } from './modules/email/email.module';
import { SmsModule } from './modules/sms/sms.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
// Phase 8: IPFS, Compliance, AML, Governance & Audit Export
import { IpfsModule } from './modules/ipfs/ipfs.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AmlModule } from './modules/aml/aml.module';
import { AuditExportModule } from './modules/audit-export/audit-export.module';
import { GovernanceModule } from './modules/governance/governance.module';
// Phase 13: Content & Learning
import { ContentModule } from './modules/content/content.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
      { name: 'long', ttl: 3600000, limit: 1000 },
    ]),
    PrismaModule,
    RedisModule,
    SentryModule,
    AuditModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    InvestmentsModule,
    TransactionsModule,
    SettingsModule,
    KycModule,
    NotificationsModule,
    TicketsModule,
    // Phase 6: Advanced Services
    DividendsModule,
    MarketplaceModule,
    PaymentsModule,
    EmailModule,
    SmsModule,
    AnalyticsModule,
    // Phase 8: IPFS, Compliance, AML, Governance & Audit Export
    IpfsModule,
    ComplianceModule,
    AmlModule,
    AuditExportModule,
    GovernanceModule,
    // Phase 13: Content & Learning
    ContentModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
