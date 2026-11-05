import http, { type Response } from 'k6/http';

export function executeRequest(
    name: string,
    url: string,
): Response {
    return http.get(url, {
        tags: { name },
    });
}