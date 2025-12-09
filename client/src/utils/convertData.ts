export const convertProxyToArray = <T>(proxyData: any): T[] => {
  if (!proxyData) return [];
  if (Array.isArray(proxyData)) return proxyData;

  // Nếu array-like
  if (proxyData[0] !== undefined) {
    const result = [];
    let index = 0;
    while (proxyData[index] !== undefined) {
      result.push(proxyData[index]);
      index++;
    }
    return result as T[];
  }

  // Nếu object/map/set
  if (proxyData instanceof Set) return Array.from(proxyData) as T[];
  if (proxyData instanceof Map) return Array.from(proxyData.values()) as T[];
  if (typeof proxyData === "object") return Object.values(proxyData) as T[];

  // fallback: trả về mảng chứa giá trị
  return [proxyData] as T[];
};
