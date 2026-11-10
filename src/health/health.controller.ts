import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { z } from 'zod';
import { ApiProblems } from '../common/errors/api-problems.decorator';
import { ProblemException } from '../common/errors/problem.exception';
import { DatabaseService } from '../database/database.service';

const livenessSchema = z.object({ status: z.literal('ok') });
const readinessSchema = z.object({
  status: z.literal('ok'),
  checks: z.object({ database: z.literal('up') }),
});

/** Nằm ngoài prefix /api/v1 (cấu hình ở app.setup.ts). */
@ApiTags('Platform')
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get('healthz')
  @ApiOperation({ summary: 'Liveness: tiến trình còn sống' })
  @ApiOkResponse({ standardSchema: livenessSchema })
  @SerializeOptions({ schema: livenessSchema })
  liveness(): z.infer<typeof livenessSchema> {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness: sẵn sàng nhận request (kiểm tra DB bằng SELECT 1)' })
  @ApiOkResponse({ standardSchema: readinessSchema })
  @SerializeOptions({ schema: readinessSchema })
  @ApiProblems('service-unavailable')
  async readiness(): Promise<z.infer<typeof readinessSchema>> {
    if (!(await this.database.ping())) {
      throw new ProblemException('service-unavailable', 'Không kết nối được cơ sở dữ liệu.', {
        extensions: { checks: { database: 'down' } },
      });
    }
    return { status: 'ok', checks: { database: 'up' } };
  }
}
