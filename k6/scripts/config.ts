import type { Options } from 'k6/options';

export type Endpoints = Record<string, string>;

export function createOptions(
    endpoints: Endpoints,
    options: Options,
): Options {
    const thresholds = Object.keys(endpoints).flatMap(name => [
        [`http_req_duration{name:${name}}`, []],
        [`http_req_failed{name:${name}}`, []],
        [`http_reqs{name:${name}}`, []],
    ]);

    return {
        ...options,
        summaryTrendStats: [
            'count', 'avg', 'min', 'max',
            'p(90)', 'p(95)', 'p(99)',
        ],
        thresholds: {
            ...Object.fromEntries(thresholds),
            ...options.thresholds,
        },
    };
}