// Soft cap on number of blacklist entries a user can define.
// Helps protect sync storage quota and maintain predictable performance
// for exclusion filtering.
export const BLACKLIST_MAX_ENTRIES = 1000;
