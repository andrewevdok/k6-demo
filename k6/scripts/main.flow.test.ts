import {
    createOptions,
} from './config.ts';

import {
    createScenarios,
    loadProfile,
} from './profile.ts';

import {
    executeRequest,
} from './requests.ts';

import {
    createSummary,
} from './summary.ts';

const BASE_URL = __ENV.BASE_URL ?? 'http://dummy-api:8000';

const endpoints = {
    users: `${BASE_URL}/api/users?limit=10`,
    user: `${BASE_URL}/api/users/42`,
    products: `${BASE_URL}/api/products?limit=20`,
    orders: `${BASE_URL}/api/orders?limit=20`,
    search: `${BASE_URL}/api/search?q=k6`,
};

const profile = loadProfile(__ENV.LOAD_PROFILE ?? './profiles/load.profile.json');

export const options = createOptions(endpoints, {
    scenarios: createScenarios(Object.keys(endpoints), profile),
});

export default function (): void {
    const name = __ENV.ENDPOINT as keyof typeof endpoints;
    executeRequest(name, endpoints[name]);
}

export const handleSummary = createSummary(endpoints);
