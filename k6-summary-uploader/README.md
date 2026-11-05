# k6 summary uploader

Node.js 22 / TypeScript / InfluxDB 2.x. Reads the `summary.json` that k6 writes in `handleSummary`
(see `k6/scripts/summary.ts`) and stores one run summary in the `k6_summaries` bucket.

In the project it runs automatically inside the `k6` container right after `k6 run` (see `run-performance-test.sh`).

## Install and run locally

```bash
npm install
npm run build
INFLUX_URL=http://localhost:8086 INFLUX_TOKEN=... INFLUX_ORG=performance INFLUX_SUMMARY_BUCKET=k6_summaries \
  npm run upload -- ../k6/scripts/summary.json
```

| Env var | Required | Default |
|---|---|---|
| `INFLUX_URL` | yes | |
| `INFLUX_TOKEN` | yes | |
| `INFLUX_ORG` | yes | |
| `INFLUX_SUMMARY_BUCKET` | yes | |
| `INFLUX_TIMEOUT_MS` | no | 30000 |
| `TEST_ENV` | no | written as the `env` tag when set |

## Data model

One `test_summary` point for the whole run and one `endpoint_summary` point per endpoint.

| | `test_summary` | `endpoint_summary` |
|---|---|---|
| Tags | `test_name`, `test_id`, `env` | `test_name`, `test_id`, `request_name`, `env` |
| Fields | `duration_ms`, metrics below | metrics below |

Metric fields: `p90`, `p95`, `p99`, `avg`, `min`, `max` (ms), `requests`, `successful`, `failed` (integers),
`rps`, `error_rate` (`failed / total`, 0 when total is 0).

`_time` is the run `startTime` with nanosecond precision.

## Validation

The input is checked before writing: required fields, non-negative numbers, `successful + failed == total`,
`http_req_duration.count == requests.total`, and ordered durations (`min <= avg <= max`, `p90 <= p95 <= p99`).
Invalid input or a failed write exits with a non-zero code.

## Assumptions

Each run is uploaded once. There is no de-duplication: a point is identified by measurement, tags and timestamp,
so uploading the same `summary.json` twice overwrites the same points.
