import { Global, Module } from '@nestjs/common';
import { MastraModule } from '@mastra/nestjs';
import { mastra } from './../../mastra/mastra';

@Global()
@Module({
  imports: [
    MastraModule.register({
      mastra: mastra,
    }),
  ],
  exports: [MastraModule],
})
export class MastraGlobalModuleModule {}
