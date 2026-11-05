export interface DurationMetrics {
  'p(90)': number;
  'p(95)': number;
  'p(99)': number;
  count: number;
  avg: number;
  min: number;
  max: number;
}
export interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  rps: number;
}
export interface MetricGroup {
  http_req_duration: DurationMetrics;
  requests: RequestMetrics;
}
export interface EndpointSummary extends MetricGroup { name: string }
export interface TestSummary {
  testId: string;
  testName: string;
  startTime: string;
  durationMs: number;
  global: MetricGroup;
  endpoints: EndpointSummary[];
}
