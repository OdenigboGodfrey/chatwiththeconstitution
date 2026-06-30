CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_phone VARCHAR(100) NOT NULL,
    from_user_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(512) NOT NULL UNIQUE,
    message_timestamp TIMESTAMPTZ NOT NULL,
    message_24h_timestamp TIMESTAMPTZ NULL,
    chat_history_id UUID REFERENCES chat_history (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- Indexes
CREATE INDEX idx_whatsapp_messages_from_phone
    ON whatsapp_messages (from_phone);

CREATE INDEX idx_whatsapp_messages_message_id
    ON whatsapp_messages (message_id);

CREATE INDEX idx_whatsapp_messages_24h_timestamp
    ON whatsapp_messages (message_24h_timestamp DESC);

CREATE INDEX idx_whatsapp_messages_created_at
    ON whatsapp_messages (created_at DESC);

-- messages from a user ordered by 24h timestamp
CREATE INDEX idx_whatsapp_messages_user_timestamp
    ON whatsapp_messages (from_user_id, message_24h_timestamp DESC);
