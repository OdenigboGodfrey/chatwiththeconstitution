import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

export class ResponseDTO<T> {
  public constructor(init?: Partial<ResponseDTO<T>>) {
    Object.assign(this, init);
    if (init?.code && (init.code == '200' || init.code == '201')) {
      this.status = true;
    }
  }
  private _code = '400';
  status = false;
  get code(): string {
    return this._code;
  }
  set code(value: string) {
    this._code = value;
    this.status = value.startsWith('2');
  }
  data!: T;
  message = '';
  extra_data: any[] = [];
  getResponse() {
    switch (this.code) {
      case '201':
      case '200':
        this.status = true;
        return this;
      case '500':
        throw new InternalServerErrorException(this);
      case '404':
        throw new NotFoundException(this);
      case '409':
        throw new ConflictException(this);
      case '401':
        throw new UnauthorizedException(this);
      case '403':
      case '_403_AR':
        throw new ForbiddenException(this);
      default:
        throw new BadRequestException(this);
    }
  }
}
