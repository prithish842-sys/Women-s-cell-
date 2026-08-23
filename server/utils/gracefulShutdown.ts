import type { Server } from 'http';
import type { Socket } from 'net';
import { setApplicationReady } from './readiness.js';

export type ShutdownReason =
  | 'SIGINT'
  | 'SIGTERM'
  | 'uncaughtException'
  | 'unhandledRejection'
  | 'startupFailure'
  | string;

export type ShutdownCoordinatorOptions = {
  server: Server;
  disconnectDatabase: () => Promise<void>;
  timeoutMs: number;
  logger?: Pick<Console, 'log' | 'warn' | 'error'>;
  exit?: (code: number) => void;
};

export type ShutdownRequest = {
  reason: ShutdownReason;
  error?: unknown;
  exitCode?: number;
};

function safeErrorSummary(error: unknown) {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: typeof error,
    message: String(error),
  };
}

export function createGracefulShutdownCoordinator({
  server,
  disconnectDatabase,
  timeoutMs,
  logger = console,
  exit = process.exit,
}: ShutdownCoordinatorOptions) {
  const sockets = new Set<Socket>();
  let shutdownPromise: Promise<void> | undefined;

  const trackConnection = (socket: Socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  };

  const requestShutdown = ({ reason, error, exitCode = 0 }: ShutdownRequest) => {
    if (shutdownPromise) {
      logger.warn(`Shutdown already in progress; ignoring duplicate request from ${reason}.`);
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      logger.log(`Shutdown requested: ${reason}`);
      const summary = safeErrorSummary(error);
      if (summary) logger.error('Fatal error summary:', summary);

      setApplicationReady(false);

      let timeoutReached = false;
      const timeout = setTimeout(() => {
        timeoutReached = true;
        logger.warn(`Graceful shutdown timeout exceeded after ${timeoutMs}ms; closing remaining connections.`);
        for (const socket of sockets) socket.destroy();
      }, timeoutMs);

      try {
        await new Promise<void>((resolve) => {
          server.close((closeError) => {
            if (closeError) logger.error('HTTP server close error:', safeErrorSummary(closeError));
            resolve();
          });
        });

        await disconnectDatabase();
        logger.log('Prisma disconnected.');
      } catch (shutdownError) {
        logger.error('Error during graceful shutdown:', safeErrorSummary(shutdownError));
        exitCode = exitCode === 0 ? 1 : exitCode;
      } finally {
        clearTimeout(timeout);
        if (timeoutReached && exitCode === 0) exitCode = 1;
        logger.log(`Exiting process with code ${exitCode}.`);
        exit(exitCode);
      }
    })();

    return shutdownPromise;
  };

  return {
    trackConnection,
    requestShutdown,
    isShuttingDown: () => Boolean(shutdownPromise),
  };
}
