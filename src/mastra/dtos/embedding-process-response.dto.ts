import { MDocument } from '@mastra/rag';

export class EmbeddingProcessResponseDTO {
  public constructor(init?: Partial<EmbeddingProcessResponseDTO>) {
    Object.assign(this, init);
  }

  embeddings!: number[][];
  chunks!: Awaited<ReturnType<InstanceType<typeof MDocument>['chunk']>>;
}

export class VectorQueryRequestDTO {
  public constructor(init?: Partial<VectorQueryRequestDTO>) {
    Object.assign(this, init);
  }
  queryVector!: number[];
}
