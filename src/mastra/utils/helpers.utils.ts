import { PgVector } from '@mastra/pg';
import { MDocument } from '@mastra/rag';
import { EmbeddingModel, embedMany } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';
import { ResponseDTO } from 'src/shared/dtos/response.dto';
import { RESPONSE_CODE } from 'src/shared/enums/response-code.enum';
import { EmbeddingProcessResponseDTO } from '../dtos/embedding-process-response.dto';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { pgVector } from 'src/database/pgvector';

export const handleEmbedding = async (
  text: string,
  nimInputType: 'passage' | 'query' = 'passage',
): Promise<ResponseDTO<EmbeddingProcessResponseDTO>> => {
  const response = new ResponseDTO<EmbeddingProcessResponseDTO>();
  try {
    let model;
    if (process.env.USE_OLLAMA === 'false') {
      const provider = createOpenAICompatible({
        name: 'nvidia',
        baseURL: process.env.LLM_HOST!,
        apiKey: process.env.LLM_API_KEY!,
        fetch: async (input, init) => {
          const body = JSON.parse(init!.body as string);
          body['input_type'] = nimInputType; // let NIM know if you are processing structural knowledge chunks for bulk storage ("passage") or parsing user search prompts for vector matching ("query").
          return fetch(input, {
            ...init,
            body: JSON.stringify(body),
          });
        },
      });
      model = provider.embeddingModel(process.env.EMBEDDING_MODEL!);
    } else {
      const provider = createOllama({
        baseURL: process.env.LLM_HOST!,
      });
      model = provider.embedding(process.env.EMBEDDING_MODEL!);
    }

    // clean up text content, remove unnecessary characters which takes up space
    let cleanedText = text
      // Replace sequences of dots, underscores, dashes, or ellipsis characters with a space
      .replace(/(\.{2,}|_{2,}|-{2,}|…+)/g, ' ')
      // Remove any stray punctuation that often appears in forms (like multiple commas, semicolons, colons)
      .replace(/[;:,]{2,}/g, ' ')
      // Replace multiple spaces or tabs with a single space
      .replace(/\s{2,}/g, ' ')
      // Remove leading and trailing spaces
      .trim();

    cleanedText = cleanedText.replace(/\.{2,}/g, ' ');

    // Split into lines, trim, and remove empty lines
    const lines = cleanedText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    // Rejoin into a single string
    cleanedText = lines.join(' ');

    const doc = MDocument.fromText(cleanedText);

    // 1. Initial chunking
    const initialChunks = await doc.chunk({
      strategy: 'recursive',
      maxSize: 400,
      overlap: 40,
    });

    const finalChunks: typeof initialChunks = [];
    const MAX_CHARACTER_LIMIT = 400;

    for (const chunk of initialChunks) {
      if (chunk.text.length > MAX_CHARACTER_LIMIT) {
        let startIndex = 0;
        while (startIndex < chunk.text.length) {
          const subText = chunk.text.substring(startIndex, startIndex + 400);
          const subDoc = MDocument.fromText(subText);
          const subChunk = (
            await subDoc.chunk({ strategy: 'recursive', maxSize: 400 })
          )[0];

          if (subChunk) {
            finalChunks.push(subChunk);
          }
          startIndex += 360; // max size of 400 - overlap of 40
        }
      } else {
        // Only push chunks that actually contain meaningful text remaining
        if (chunk.text.trim().length > 0) {
          finalChunks.push(chunk);
        }
      }
    }

    // 2. Extract texts
    const chunkTexts = finalChunks.map((c) => c.text);
    const allEmbeddings: number[][] = [];

    // Process 1-by-1
    for (let i = 0; i < chunkTexts.length; i++) {
      const currentChunkText = chunkTexts[i];

      try {
        const { embeddings } = await embedMany({
          values: [currentChunkText],
          model: model as EmbeddingModel,
        });

        allEmbeddings.push(...embeddings);
      } catch (embeddingError) {
        console.error(`Error embedding chunk index ${i}:`, currentChunkText);
        throw embeddingError;
      }
    }

    response.code = RESPONSE_CODE._200;
    response.data = {
      embeddings: allEmbeddings,
      chunks: finalChunks,
    };
    response.message = 'Embedding processed successfully';
  } catch (e) {
    console.log(e);
    response.code = RESPONSE_CODE._500;
    response.message = 'Something went wrong, Please try again later';
  }
  return response;
};

//'chatwiththe-constitution'
export const insertEmbedding = async (
  indexName: string,
  embeddingPayload: EmbeddingProcessResponseDTO,
  documentType: string,
) => {
  const response = new ResponseDTO();
  try {
    // 1. Pass the raw embeddings array (number[][]) directly to vectors
    // 2. Map the metadata array so that index-for-index matches the chunks
    const upsertResponse = await pgVector.upsert({
      indexName: indexName,
      vectors: embeddingPayload.embeddings,
      metadata: embeddingPayload.chunks.map((chunk) => ({
        text: chunk.text,
        document_type: documentType,
        createdAt: new Date().toISOString(),
      })),
    });

    response.code = RESPONSE_CODE._200;
    response.message = 'Embedding inserted successfully';
    response.data = upsertResponse;
  } catch (e) {
    console.log(e);
    response.code = RESPONSE_CODE._500;
    response.message =
      'Something went wrong while inserting embedding, Please try again later';
  }
  return response;
};

export const queryVectorEmbeddings = async (
  indexName: string,
  query: string,
) => {
  const response = new ResponseDTO<string>();
  try {
    const embeddingResponse = await handleEmbedding(query, 'query');
    if (!embeddingResponse.status) {
      response.code = embeddingResponse.code;
      response.message = embeddingResponse.message;
      return response;
    }

    const { embeddings } = embeddingResponse.data;
    // Extract the first vector from the batch and convert number[][] -> number[]
    const singleGeneratedVector = embeddings[0];

    if (!singleGeneratedVector) {
      response.code = RESPONSE_CODE._500;
      response.message = 'No embeddings generated for the query string.';
      return response;
    }

    const queryResponse = await pgVector.query({
      indexName: indexName,
      queryVector: singleGeneratedVector,
      topK: 10,
    });
    response.code = RESPONSE_CODE._200;
    response.message = 'Embedding query successful';
    response.data = queryResponse
      .map((r) => {
        if (r && r.metadata && r.metadata.text) {
          // data was retrieved
          return r.metadata.text as string;
        }
      })
      .join('\n\n');
  } catch (e) {
    console.log(e);
    response.code = RESPONSE_CODE._500;
    response.message = 'Something went wrong while querying embedding';
  }
  return response;
};
