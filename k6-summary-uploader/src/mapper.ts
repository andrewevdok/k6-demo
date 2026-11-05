import { Point } from '@influxdata/influxdb-client';
import type { MetricGroup, TestSummary } from './types.js';

function addMetrics(point: Point, group: MetricGroup): void {
  const d = group.http_req_duration;
  const r = group.requests;

  point
      .floatField('p90', d['p(90)'])
      .floatField('p95', d['p(95)'])
      .floatField('p99', d['p(99)'])
      .floatField('avg', d.avg)
      .floatField('min', d.min)
      .floatField('max', d.max)
      .intField('requests', r.total)
      .intField('successful', r.successful)
      .intField('failed', r.failed)
      .floatField('rps', r.rps)
      .floatField('error_rate', r.total === 0 ? 0 : r.failed / r.total);
}

export function mapPoints(summary: TestSummary): Point[] {
  const startTimeMs = Date.parse(summary.startTime);

  if (!Number.isFinite(startTimeMs)) {
    throw new Error(`Invalid startTime: ${summary.startTime}`);
  }

  const timestamp = (BigInt(startTimeMs) * 1_000_000n).toString();

  const global = new Point('test_summary')
      .tag('test_name', summary.testName)
      .tag('test_id', summary.testId)
      .floatField('duration_ms', summary.durationMs)
      .timestamp(timestamp);

  addMetaTags(global);
  addMetrics(global, summary.global);

  const points = [global];

  for (const endpoint of summary.endpoints) {
    const point = new Point('endpoint_summary')
        .tag('test_name', summary.testName)
        .tag('test_id', summary.testId)
        .tag('request_name', endpoint.name)
        .timestamp(timestamp);

    addMetaTags(point);
    addMetrics(point, endpoint);
    points.push(point);
  }

  return points;
}

function addMetaTags(point: Point): void {
  const env = process.env.TEST_ENV;

  if (env) {
    point.tag('env', env);
  }
}