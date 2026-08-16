export function calculateSchemeStatus(startDateStr: string, endDateStr: string): 'UPCOMING' | 'ACTIVE' | 'EXPIRED' {
  const now = new Date();
  // Strip time for accurate day boundary comparisons
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const start = new Date(startDateStr);
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  
  const end = new Date(endDateStr);
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (today < startDate) {
    return 'UPCOMING';
  } else if (today >= startDate && today <= endDate) {
    return 'ACTIVE';
  } else {
    return 'EXPIRED';
  }
}

export function enrichSchemeDetails(scheme: any) {
  if (!scheme) return null;
  return {
    ...scheme,
    status: scheme.status || calculateSchemeStatus(scheme.startDate, scheme.endDate)
  };
}
