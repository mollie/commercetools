/**
 * Generates an ISO string date
 * @returns {String} Returns the current date converted to ISO.
 */
export function createDateNowString() {
  return new Date().toISOString();
}
