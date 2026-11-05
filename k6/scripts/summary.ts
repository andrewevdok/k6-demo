import type { SummaryData } from 'k6';
import type { Endpoints } from './config.ts';

function getStats(data: SummaryData, name?: string) {
    const suffix = name ? `{name:${name}}` : '';

    const duration = data.metrics[
        `http_req_duration${suffix}`
        ]?.values;

    const requests = data.metrics[
        `http_reqs${suffix}`
        ]?.values;

    const failedRate = data.metrics[
        `http_req_failed${suffix}`
        ]?.values?.rate ?? 0;

    const total = requests?.count ?? 0;
    const failed = Math.round(total * failedRate);

    return {
        http_req_duration: duration ?? null,
        requests: {
            total,
            successful: total - failed,
            failed,
            rps: requests?.rate ?? 0,
        },
    };
}

export function createSummary(endpoints: Endpoints) {
    return (data: SummaryData) => {
        const endTime = Date.now();
        const durationMs = data.state.testRunDurationMs;
        const startTime = endTime - durationMs;

        return {
            '/scripts/summary.json': JSON.stringify({
                testId: __ENV.TEST_ID ?? 'unknown',
                testName: __ENV.TEST_NAME ?? 'unknown',

                startTime: new Date(startTime).toISOString(),
                durationMs,

                global: getStats(data),

                endpoints: Object.keys(endpoints).map(name => ({
                    name,
                    ...getStats(data, name),
                })),
            }, null, 2),
        };
    };
}