export const convertProxyToArray = <T>(proxyData: any): T[] => {
  if (!proxyData) return [];
  if (Array.isArray(proxyData)) return proxyData;
  return Array.from(proxyData) as T[];
};