export const BUSINESS_TIME_ZONE = 'Asia/Colombo';

const colomboDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The business (Asia/Colombo) calendar date of an instant, as YYYY-MM-DD. */
export function toColomboDate(instant: Date): string {
  if (Number.isNaN(instant.getTime())) {
    throw new RangeError('Invalid date');
  }
  return colomboDate.format(instant);
}
