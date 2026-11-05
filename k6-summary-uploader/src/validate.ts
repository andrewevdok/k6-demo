import type { DurationMetrics, MetricGroup, RequestMetrics, TestSummary } from './types.js';

type RecordValue = Record<string, unknown>;
const object = (v: unknown, path: string): RecordValue => {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) throw new Error(`${path} must be an object`);
  return v as RecordValue;
};
const string = (v: unknown, path: string): string => {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`${path} must be a non-empty string`);
  return v;
};
const number = (v: unknown, path: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${path} must be a finite number`);
  return v;
};
const integer = (v: unknown, path: string): number => {
  const n = number(v, path);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`${path} must be a non-negative safe integer`);
  return n;
};
const date = (v: unknown, path: string): string => {
  const s = string(v, path);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,9}Z$/.test(s) || !Number.isFinite(Date.parse(s))) {
    throw new Error(`${path} must be an ISO-8601 UTC timestamp with fractional seconds`);
  }
  const normalized = new Date(s).toISOString().slice(0, 19);
  if (normalized !== s.slice(0, 19)) throw new Error(`${path} is not a valid calendar timestamp`);
  return s;
};
export function toNanoseconds(iso: string): bigint {
  const match = /^(.*?)(?:\.(\d{1,9}))Z$/.exec(iso);
  if (!match) throw new Error(`Invalid timestamp ${iso}`);
  const seconds = BigInt(Date.parse(`${match[1]}Z`) / 1000);
  return seconds * 1_000_000_000n + BigInt(match[2].padEnd(9, '0'));
}
function metrics(v: unknown, path: string): MetricGroup {
  const group = object(v, path);
  const d = object(group.http_req_duration, `${path}.http_req_duration`);
  const r = object(group.requests, `${path}.requests`);
  const duration: DurationMetrics = {
    'p(90)': number(d['p(90)'], `${path}.http_req_duration.p(90)`),
    'p(95)': number(d['p(95)'], `${path}.http_req_duration.p(95)`),
    'p(99)': number(d['p(99)'], `${path}.http_req_duration.p(99)`),
    count: integer(d.count, `${path}.http_req_duration.count`),
    avg: number(d.avg, `${path}.http_req_duration.avg`),
    min: number(d.min, `${path}.http_req_duration.min`),
    max: number(d.max, `${path}.http_req_duration.max`),
  };
  const requests: RequestMetrics = {
    total: integer(r.total, `${path}.requests.total`),
    successful: integer(r.successful, `${path}.requests.successful`),
    failed: integer(r.failed, `${path}.requests.failed`),
    rps: number(r.rps, `${path}.requests.rps`),
  };
  if (requests.successful + requests.failed !== requests.total) throw new Error(`${path}: successful + failed must equal total`);
  if (duration.count !== requests.total) throw new Error(`${path}: http_req_duration.count must equal requests.total`);
  if (requests.rps < 0) throw new Error(`${path}.requests.rps must be non-negative`);
  for (const [key, value] of Object.entries(duration)) {
    if (value < 0) throw new Error(`${path}.http_req_duration.${key} must be non-negative`);
  }
  if (!(duration.min <= duration.avg && duration.avg <= duration.max && duration.min <= duration['p(90)'] && duration['p(90)'] <= duration['p(95)'] && duration['p(95)'] <= duration['p(99)'] && duration['p(99)'] <= duration.max)) {
    throw new Error(`${path}: duration metrics are inconsistent`);
  }
  return { http_req_duration: duration, requests };
}
export function validateSummary(input: unknown): TestSummary {
  const root = object(input, 'summary');
  const testId = string(root.testId, 'testId');
  const testName = string(root.testName, 'testName');
  const startTime = date(root.startTime, 'startTime');
  const durationMs = number(root.durationMs, 'durationMs');
  if (durationMs < 0) throw new Error('durationMs must be non-negative');
  const global = metrics(root.global, 'global');
  if (!Array.isArray(root.endpoints)) throw new Error('endpoints must be an array (can be empty)');
  const names = new Set<string>();
  const endpoints = root.endpoints.map((value, i) => {
    const endpoint = object(value, `endpoints[${i}]`);
    const name = string(endpoint.name, `endpoints[${i}].name`);
    if (names.has(name)) throw new Error(`Duplicate endpoint name: ${name}`);
    names.add(name);
    return { name, ...metrics(endpoint, `endpoints[${i}]`) };
  });
  return { testId, testName, startTime, durationMs, global, endpoints };
}
