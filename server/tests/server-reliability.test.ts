import { EventEmitter } from 'events';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../server.js';
import { isApplicationReady, setApplicationReady } from '../utils/readiness.js';
import { createGracefulShutdownCoordinator } from '../utils/gracefulShutdown.js';

describe('health endpoints', () => {
  beforeEach(() => {
    setApplicationReady(true);
  });

  it('keeps the existing health endpoint compatible', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.server).toBe('connected');
    expect(response.body.data.database).toBe('connected');
  });

  it('reports process liveness without depending on readiness state', async () => {
    setApplicationReady(false);

    const response = await request(app).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('alive');
    expect(typeof response.body.data.uptimeSeconds).toBe('number');
  });

  it('reports readiness when the app is ready and the database responds', async () => {
    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ready');
    expect(response.body.data.database).toBe('connected');
  });

  it('returns 503 when the app is not ready', async () => {
    setApplicationReady(false);

    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.data.status).toBe('not_ready');
  });
});

describe('graceful shutdown coordinator', () => {
  it('runs shutdown cleanup only once for duplicate requests', async () => {
    const close = vi.fn((callback: (error?: Error) => void) => callback());
    const server = Object.assign(new EventEmitter(), { close }) as any;
    const disconnectDatabase = vi.fn(async () => undefined);
    const exit = vi.fn();
    const logger = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    setApplicationReady(true);

    const coordinator = createGracefulShutdownCoordinator({
      server,
      disconnectDatabase,
      timeoutMs: 1000,
      logger,
      exit,
    });

    const first = coordinator.requestShutdown({ reason: 'SIGTERM', exitCode: 0 });
    const second = coordinator.requestShutdown({ reason: 'unhandledRejection', exitCode: 1 });
    await Promise.all([first, second]);

    expect(close).toHaveBeenCalledTimes(1);
    expect(disconnectDatabase).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
    expect(coordinator.isShuttingDown()).toBe(true);
  });

  it('marks the app not ready before closing server resources', async () => {
    const readinessAtClose: boolean[] = [];
    const close = vi.fn((callback: (error?: Error) => void) => {
      readinessAtClose.push(isApplicationReady());
      callback();
    });
    const server = Object.assign(new EventEmitter(), { close }) as any;
    const exit = vi.fn();
    setApplicationReady(true);

    const coordinator = createGracefulShutdownCoordinator({
      server,
      disconnectDatabase: vi.fn(async () => undefined),
      timeoutMs: 1000,
      logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
      exit,
    });

    await coordinator.requestShutdown({ reason: 'SIGINT', exitCode: 0 });

    expect(readinessAtClose).toEqual([false]);
    const readyResponse = await request(app).get('/api/v1/health/ready');
    expect(readyResponse.status).toBe(503);
  });
});
