export function inviteUrl(tripId: string, token: string): string {
  return `waypoint://join/${tripId}?token=${encodeURIComponent(token)}`;
}
