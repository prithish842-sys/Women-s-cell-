export type ProgramLevel = 'UG' | 'PG';

const pgPattern =
  /\b(m\.?\s?sc|msc|m\.?\s?com|mcom|m\.?\s?ca|mca|m\.?\s?ba|mba|m\.?\s?a|ma|master|post\s*graduate|postgraduate|pg)\b/i;

const ugPattern =
  /\b(b\.?\s?sc|bsc|b\.?\s?com|bcom|b\.?\s?ca|bca|b\.?\s?ba|bba|b\.?\s?a|ba|bachelor|under\s*graduate|undergraduate|ug)\b/i;

export function classifyProgramLevel(
  course?: string | null,
  durationYears?: number | null,
): ProgramLevel {
  const normalized = String(course || '').trim();

  if (pgPattern.test(normalized)) {
    return 'PG';
  }

  if (ugPattern.test(normalized)) {
    return 'UG';
  }

  if (
    Number.isFinite(Number(durationYears)) &&
    Number(durationYears) <= 2
  ) {
    return 'PG';
  }

  return 'UG';
}
