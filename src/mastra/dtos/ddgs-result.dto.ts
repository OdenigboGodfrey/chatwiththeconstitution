export class DDGSResponseItemDTO {
  constructor(init?: Partial<DDGSResponseItemDTO>) {
    Object.assign(this, init);
  }
  title!: string;
  description!: string;
  url!: string;
}

export class DDGSResultDTO {
  constructor(init?: Partial<DDGSResultDTO>) {
    Object.assign(this, init);
  }
  results!: DDGSResultItemDTO[];
}

export class DDGSResultItemDTO {
  constructor(init?: Partial<DDGSResultItemDTO>) {
    Object.assign(this, init);
  }
  title!: string;
  snippet!: string;
  link!: string;
  content!: string;
}

export class DDGSearchResultItemDTO {
  constructor(init?: Partial<DDGSearchResultItemDTO>) {
    Object.assign(this, init);
  }
  title!: string;
  snippet!: string;
  url!: string;
  content!: string;
}
