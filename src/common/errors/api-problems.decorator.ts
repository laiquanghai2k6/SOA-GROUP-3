import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { PROBLEMS, type ProblemSlug } from './problem-catalog';
import { problemDetailsSchema } from './problem.dto';

/**
 * Khai báo các lỗi endpoint có thể trả, gom theo status, để OpenAPI khớp implementation (NFR-DOC-01):
 *   @ApiProblems('unauthenticated', 'not-found', 'validation-error')
 */
export function ApiProblems(...slugs: ProblemSlug[]) {
  const byStatus = new Map<number, string[]>();
  for (const slug of slugs) {
    const { status, title } = PROBLEMS[slug];
    byStatus.set(status, [...(byStatus.get(status) ?? []), `\`${slug}\`: ${title}`]);
  }
  return applyDecorators(
    ...[...byStatus].map(([status, lines]) =>
      ApiResponse({
        status,
        description: lines.join('<br>'),
        standardSchema: problemDetailsSchema,
      }),
    ),
  );
}
