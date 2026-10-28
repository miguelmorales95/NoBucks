// Location: NoBucks only ever keeps a rough spot (about a kilometre square), so the distance shown
// on a listing ("about 1.5 mi") can't be used to find someone's home.
export const roughCoord = (v: number | null | undefined) => (v == null ? null : Math.round(v * 100) / 100);

/** Distance for display: to the nearest half mile, never less than half a mile. */
export const roughMiles = (miles: number) => Math.max(0.5, Math.round(miles * 2) / 2);
