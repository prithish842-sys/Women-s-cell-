export function getCurrentAcademicYear(startMonthSetting?: number): { label: string; year: number } {
  // Configured start month default is 6 (June)
  const startMonth = startMonthSetting !== undefined ? startMonthSetting : Number(process.env.ACADEMIC_YEAR_START_MONTH || 6);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  let startYear = currentYear;
  if (currentMonth < startMonth) {
    startYear = currentYear - 1;
  }
  
  return {
    label: `${startYear}-${startYear + 1}`,
    year: startYear
  };
}

export function calculateCurrentStudyYear(joiningYear: number, courseDurationYears: number, expectedCompletionDate: string): number | string {
  const now = new Date();
  const completionDate = new Date(expectedCompletionDate);
  
  // Strip time for clean comparison
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const completionOnly = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate());

  if (todayOnly > completionOnly) {
    return 'Passed Out';
  }

  const { year: currentAcademicStartYear } = getCurrentAcademicYear();
  const yearDiff = currentAcademicStartYear - joiningYear + 1;

  if (yearDiff <= 0) {
    return 1; // default starting year
  } else if (yearDiff > courseDurationYears) {
    return 'Passed Out';
  }

  return yearDiff;
}

export function calculateAcademicStatus(
  expectedCompletionDate: string,
  currentStudyYear: number | string,
  courseDurationYears: number
): 'ACTIVE' | 'FINAL_YEAR' | 'PASSING_OUT_SOON' | 'PASSED_OUT' {
  const now = new Date();
  const completionDate = new Date(expectedCompletionDate);
  
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const completionOnly = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate());

  if (todayOnly > completionOnly || currentStudyYear === 'Passed Out') {
    return 'PASSED_OUT';
  }

  const timeDiff = completionOnly.getTime() - todayOnly.getTime();
  const daysUntilCompletion = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysUntilCompletion >= 0 && daysUntilCompletion <= 90) {
    return 'PASSING_OUT_SOON';
  }

  if (currentStudyYear === courseDurationYears) {
    return 'FINAL_YEAR';
  }

  return 'ACTIVE';
}

/**
 * Enriches student profile with dynamically computed academic variables.
 */
export function enrichStudentAcademicDetails(profile: any) {
  if (!profile) return null;
  
  const currentStudyYear = calculateCurrentStudyYear(
    profile.joiningYear,
    profile.courseDurationYears,
    profile.expectedCompletionDate
  );
  
  const academicStatus = calculateAcademicStatus(
    profile.expectedCompletionDate,
    currentStudyYear,
    profile.courseDurationYears
  );

  return {
    ...profile,
    currentStudyYear,
    academicStatus
  };
}
