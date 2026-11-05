import type { Scenario } from 'k6/options';

export type EndpointProfile = {
    numberOfUsers: number;
    reachRps: number;
    during: number;
    holdFor: number;
};

export type LoadProfile = Record<string, EndpointProfile>;

export function loadProfile(path: string): LoadProfile {
    return JSON.parse(open(path));
}

// One ramping-arrival-rate scenario per endpoint: ramp to reachRps over
// `during` seconds, then hold that rate for `holdFor` seconds.
export function createScenarios(
    endpointNames: string[],
    profile: LoadProfile,
): Record<string, Scenario> {
    return Object.fromEntries(endpointNames.map(name => {
        const p = profile[name];
        if (!p) {
            throw new Error(`No load profile for endpoint "${name}"`);
        }

        return [name, {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: p.numberOfUsers,
            maxVUs: p.numberOfUsers,
            stages: [
                { target: p.reachRps, duration: `${p.during}s` },
                { target: p.reachRps, duration: `${p.holdFor}s` },
            ],
            env: { ENDPOINT: name },
        }];
    }));
}
