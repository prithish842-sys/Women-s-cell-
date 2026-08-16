export function calculatedWorkshopStatus(workshop: {
  isCancelled: boolean;
  isCompleted: boolean;
  startDateTime: Date;
  endDateTime: Date;
}) {
  if (workshop.isCancelled) return 'CANCELLED';
  if (workshop.isCompleted) return 'COMPLETED';
  const now = new Date();
  if (now < workshop.startDateTime) return 'UPCOMING';
  if (now <= workshop.endDateTime) return 'ONGOING';
  return 'COMPLETED';
}

export function serializeWorkshop(workshop: any) {
  return {
    ...workshop,
    _id: workshop.id,
    status: calculatedWorkshopStatus(workshop),
    interestedCount: workshop.participations?.filter((p: any) => ['INTERESTED', 'REGISTERED'].includes(p.status)).length,
    attendedCount: workshop.participations?.filter((p: any) => p.status === 'ATTENDED').length,
  };
}
