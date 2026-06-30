CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    "sourceId" VARCHAR(100) NOT NULL,
	source VARCHAR(100),
    "responsePending" BOOLEAN NOT NULL DEFAULT FALSE,
    "retryCount" INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_source_id ON chat_history("sourceId");
CREATE INDEX idx_messages_created_at ON chat_history("sourceId");
CREATE INDEX idx_messages_source_role ON chat_history("sourceId", role);
