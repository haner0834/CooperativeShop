export function sortKeysRecursive(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(this.sortKeysRecursive);
  }

  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: any = {};

  for (const key of sortedKeys) {
    sortedObj[key] = this.sortKeysRecursive(obj[key]);
  }

  return sortedObj;
}
