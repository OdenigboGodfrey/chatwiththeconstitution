import { PgVector } from '@mastra/pg';
import { VECTOR_ID } from 'src/shared/enums/vectorid.enums';

export const pgVector = new PgVector({
  host: process.env.DATABASE_HOST!,
  port: parseInt(process.env.DATABASE_PORT!),
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE!,
  id: VECTOR_ID.ID,
  schemaName: process.env.DATABASE_SCHEMA!,
});
