/**
 * Core API Client
 * Used to fetch Master Data from the Core Platform.
 */
const CORE_API_URL = process.env.CORE_API_URL || '/rdi_mis/api';

export const getCoreUser = async (userId: string) => {
  const res = await fetch(`${CORE_API_URL}/users/${userId}`);
  return res.json();
};

export const getActiveFiscalYear = async () => {
  const res = await fetch(`${CORE_API_URL}/fiscal-year/active`);
  return res.json();
};
