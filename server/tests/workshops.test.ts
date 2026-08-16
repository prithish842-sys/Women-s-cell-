import { describe, expect, it, vi } from 'vitest';
import { calculatedWorkshopStatus } from '../utils/workshops.js';

describe('calculatedWorkshopStatus', () => {
  it('prioritizes cancellation over dates', () => {
    expect(calculatedWorkshopStatus({
      isCancelled: true,
      isCompleted: false,
      startDateTime: new Date('2026-01-01T10:00:00.000Z'),
      endDateTime: new Date('2026-01-01T11:00:00.000Z'),
    })).toBe('CANCELLED');
  });

  it('returns ongoing when the current time is inside the workshop window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-22T10:30:00.000Z'));
    expect(calculatedWorkshopStatus({
      isCancelled: false,
      isCompleted: false,
      startDateTime: new Date('2026-07-22T10:00:00.000Z'),
      endDateTime: new Date('2026-07-22T12:00:00.000Z'),
    })).toBe('ONGOING');
    vi.useRealTimers();
  });
});
