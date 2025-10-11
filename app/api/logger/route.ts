import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/app/lib/logger/logger.service';
export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { level, fileName, message } = (await request.json()) as {
      level: 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG' | 'SUCCESS' | 'CHECKPOINT';
      fileName: string;
      message: string;
    };
    const logger = Logger.getInstance();
    await logger.init();

    switch (level) {
      case 'ERROR':
        await logger.error(fileName, message);
        break;
      case 'WARNING':
        await logger.warning(fileName, message);
        break;
      case 'INFO':
        await logger.info(fileName, message);
        break;
      case 'DEBUG':
        await logger.debug(fileName, message);
        break;
      case 'SUCCESS':
        await logger.success(fileName, message);
        break;
      case 'CHECKPOINT':
        await logger.checkpoint(fileName, message);
        break;
      default:
        await logger.info(
          'api/logger',
          `Unknown level: ${String(level)} - ${fileName} - ${message}`
        );
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Unknown error';
    const logger = Logger.getInstance();
    await logger.init();
    await logger.error('api/logger/route.ts', `[api/logger] failed: ${m}`);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
