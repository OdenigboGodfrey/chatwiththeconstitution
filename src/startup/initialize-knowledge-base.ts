import { PgVector } from '@mastra/pg';
import * as path from 'path';
import * as fs from 'fs';
import {
  handleEmbedding,
  insertEmbedding,
} from 'src/mastra/utils/helpers.utils';
import { INDEX_NAME } from 'src/shared/enums/index-name.enums';
import { PDFParse } from 'pdf-parse';
import { EMBEDDING_DIMENSIONS } from 'src/shared/constants';
import { generateIndexName } from 'src/shared/utils/generate-index-name.util';
import { pgVector } from 'src/database/pgvector';

const indexName = generateIndexName(INDEX_NAME.CHAT_WITH_THE_CONSTITUTION);

export async function initializeKnowledgeBase() {
  console.log('Starting Knowledge Base Initialization...');
  let createdIndex = false;
  try {
    // 1. Fetch existing indexes to check if ours is already there
    const existingIndexes = await pgVector.listIndexes();
    const indexExists = existingIndexes.includes(indexName);

    if (!indexExists) {
      console.log(
        `Creating vector index: ${indexName} (Dimensions: ${EMBEDDING_DIMENSIONS})`,
      );

      await pgVector.createIndex({
        indexName: indexName,
        dimension: EMBEDDING_DIMENSIONS,
        metric: 'cosine',
      });
      createdIndex = true;
    } else {
      console.log(
        `Vector index "${indexName}" already exists. Skipping creation.`,
      );
    }

    // 2. Check if it's already populated to avoid duplicate inserts
    const existingDocs = await pgVector.query({
      indexName: indexName,
      queryVector: new Array(EMBEDDING_DIMENSIONS).fill(0),
      topK: 1,
    });

    if (existingDocs && existingDocs.length > 0) {
      console.log(
        'Data already exists in vector store. Startup seeding skipped.',
      );
      return { status: true, message: 'Already initialized' };
    }

    // 3. Process your documents
    let migratedSuccessfully = 0;
    let ragFileTitles: string[] = [];
    if (process.env.RAG_SOURCE_FILES)
      ragFileTitles = process.env.RAG_SOURCE_FILES?.split(',');

    for (let index = 0; index < ragFileTitles.length; index++) {
      // check if files exists first
      const element = ragFileTitles[index];
      const filePath = path.join(process.cwd(), 'static/documents', element);
      console.log('Reading and chunking source document...', filePath);
      if (!fs.existsSync(filePath)) {
        console.log('File path does not exist', filePath);
        continue;
      }

      let sourceText = '';

      // Check if the file is a PDF
      if (element.endsWith('.pdf')) {
        const dataBuffer = fs.readFileSync(filePath); // Read as raw binary buffer, NOT 'utf-8'
        const parser = new PDFParse({ data: dataBuffer });
        const pdfData = await parser.getText();
        await parser.destroy();

        sourceText = pdfData.text;
      } else {
        // Fallback for standard text/markdown files
        sourceText = fs.readFileSync(filePath, 'utf-8');
      }

      const embeddingResponse = await handleEmbedding(sourceText);
      if (!embeddingResponse.status) {
        console.log('Failed embedding Response', embeddingResponse.message);
        continue;
      }
      const upsertResponse = await insertEmbedding(
        indexName,
        embeddingResponse.data,
        element,
      );
      if (!upsertResponse.status) {
        console.log('Failed upsert Response', embeddingResponse.message);
        continue;
      }
      migratedSuccessfully++;
    }

    const success = migratedSuccessfully == ragFileTitles.length;
    if (success)
      console.log('Knowledge Base successfully initialized and ready!');
    else {
      console.log(
        `Knowledge Base initialization failed! migrated Successfully ${migratedSuccessfully} out of ${ragFileTitles.length}`,
      );
      console.log(`Rolling back changes`);
      await pgVector.deleteIndex({ indexName: indexName });
    }

    return { status: success };
  } catch (error) {
    console.error('Failed to initialize Knowledge Base:', error);
    if (createdIndex) {
      console.log(`Rolling back changes`);
      await pgVector.deleteIndex({ indexName: indexName });
    }
    return { status: false };
  }
}
