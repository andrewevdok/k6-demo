import { InfluxDB } from '@influxdata/influxdb-client';
import type { Config } from './config.js';
import type { TestSummary } from './types.js';
import { mapPoints } from './mapper.js';
import { toNanoseconds } from './validate.js';

export class SummaryUploader {
  constructor(private readonly config: Config) {}

  async upload(summary: TestSummary): Promise<{ points: number; timestamp: string }> {
    const timestamp = toNanoseconds(summary.startTime);
    const points = mapPoints(summary);
    const client = new InfluxDB({
      url: this.config.url,
      token: this.config.token,
      timeout: this.config.timeoutMs,
    });
    const writer = client.getWriteApi(this.config.org, this.config.bucket, 'ns', {
      batchSize: 500,
      flushInterval: 0,
      maxRetries: 3,
    });
    try {
      writer.writePoints(points);
      await writer.close(); // flush and wait for the server response
    } catch (error) {
      throw new Error(`InfluxDB write failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { points: points.length, timestamp: timestamp.toString() };
  }
}
