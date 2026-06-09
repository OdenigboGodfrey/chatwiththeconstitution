export const fetchMetadataQuery = `SELECT id, title, "createdAt", "updatedAt" FROM public.metadata;`;

export const insertMetadataQuery = `insert into metadata (title) values ($1) returning *;`;
