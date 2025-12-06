export type NwepMethod = 'READ' | 'WRITE' | 'MODIFY' | 'DELETE' | 'PROBE' | 'TRACE';
export interface FetchOptions {
    method?: NwepMethod;
    headers?: Record<string, string>;
    body?: string | object;
}
export interface FetchResponse {
    status: string;
    statusText: string;
    headers: Map<string, string>;
    body: Buffer;
    text(): string;
    json<T = any>(): T;
}
export declare function fetch(url: string, options?: FetchOptions): Promise<FetchResponse>;
//# sourceMappingURL=fetch.d.ts.map