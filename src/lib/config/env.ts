import { z } from 'zod';

export const APP_ENVS = [
  'development',
  'test',
  'staging',
  'production',
] as const;
export type AppEnv = (typeof APP_ENVS)[number];

const providerId = z.string().min(1);

const schema = z
  .object({
    APP_ENV: z.enum(APP_ENVS).default('development'),
    // 'fake' / 'local' are the zero-cost stand-ins; any other value names a real provider.
    SMS_PROVIDER: providerId.default('fake'),
    STORAGE_PROVIDER: providerId.default('local'),
    STORAGE_LOCAL_DIR: z.string().min(1).default('.data/uploads'),
  })
  .superRefine((env, ctx) => {
    if (env.APP_ENV === 'staging' || env.APP_ENV === 'production') return;
    const checks = [
      ['SMS_PROVIDER', env.SMS_PROVIDER, 'fake'],
      ['STORAGE_PROVIDER', env.STORAGE_PROVIDER, 'local'],
    ] as const;
    for (const [key, value, allowed] of checks) {
      if (value !== allowed) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key}=${value} is a real provider; only '${allowed}' is allowed when APP_ENV=${env.APP_ENV}`,
        });
      }
    }
  });

export type Env = z.infer<typeof schema>;

/** Validate environment variables; throws a ZodError naming each offending key. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  return schema.parse(source);
}
