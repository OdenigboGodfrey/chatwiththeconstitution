export const createMetadataTableQuery = `CREATE TABLE IF NOT EXISTS  public.metadata (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	title varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	
	CONSTRAINT "PK_346d5LO5629f1YU321fb3d91383" PRIMARY KEY (id)
);

CREATE INDEX "IDX_ABCd5379629a13f3XZCc3d91383" ON public.document_entity ("title");`;
