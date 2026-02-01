export function log1p(x: number): number {
  return Math.log(x + 1);
}

export function zScore(x: number, mean: number, std: number): number {
  if (std < 1e-6) return 0; // 防 σ=0
  return (x - mean) / std;
}

export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function std(values: number[], mu: number): number {
  const variance =
    values.reduce((sum, v) => sum + (v - mu) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
