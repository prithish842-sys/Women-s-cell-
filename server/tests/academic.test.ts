import { describe, expect, it, vi, afterEach } from 'vitest';
import { calculateAcademicStatus, calculateCurrentStudyYear } from '../utils/academic.js';

describe('academic status calculation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks students active outside final-year and passing windows', () => {
    vi.setSystemTime(new Date('2026-07-20T05:00:00Z'));
    const year = calculateCurrentStudyYear(2025, 3, '2028-04-30');
    expect(year).toBe(2);
    expect(calculateAcademicStatus('2028-04-30', year, 3)).toBe('ACTIVE');
  });

  it('marks final-year students when completion is more than 90 days away', () => {
    vi.setSystemTime(new Date('2026-07-20T05:00:00Z'));
    const year = calculateCurrentStudyYear(2024, 3, '2027-04-30');
    expect(year).toBe(3);
    expect(calculateAcademicStatus('2027-04-30', year, 3)).toBe('FINAL_YEAR');
  });

  it('marks completion today as passing out soon', () => {
    vi.setSystemTime(new Date('2026-07-20T05:00:00Z'));
    expect(calculateAcademicStatus('2026-07-20', 3, 3)).toBe('PASSING_OUT_SOON');
  });

  it('marks completion within 90 days as passing out soon', () => {
    vi.setSystemTime(new Date('2026-07-20T05:00:00Z'));
    expect(calculateAcademicStatus('2026-09-15', 3, 3)).toBe('PASSING_OUT_SOON');
  });

  it('marks students passed out after completion date', () => {
    vi.setSystemTime(new Date('2026-07-20T05:00:00Z'));
    const year = calculateCurrentStudyYear(2022, 3, '2025-04-30');
    expect(year).toBe('Passed Out');
    expect(calculateAcademicStatus('2025-04-30', year, 3)).toBe('PASSED_OUT');
  });
});
