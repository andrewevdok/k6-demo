export interface Config { url: string; token: string; org: string; bucket: string; timeoutMs: number }
export function loadConfig(): Config {
  const required = (name: string): string => {
    const value = process.env[name];
    if (!value?.trim()) throw new Error(`Missing environment variable ${name}`);
    return value;
  };
  const timeoutMs = Number(process.env.INFLUX_TIMEOUT_MS ?? '30000');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new Error('INFLUX_TIMEOUT_MS must be a positive integer');
  const url = required('INFLUX_URL');
  try { new URL(url); } catch { throw new Error('INFLUX_URL must be a valid URL'); }
  return { url, token: required('INFLUX_TOKEN'), org: required('INFLUX_ORG'), bucket: required('INFLUX_SUMMARY_BUCKET'), timeoutMs };
}
