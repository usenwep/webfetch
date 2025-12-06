export interface FetchOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: Buffer | string;
}
export interface FetchResponse {
    status: string;
    statusText: string;
    headers: Map<string, string>;
    body: Buffer;
}
export declare function fetch(url: string, options?: FetchOptions): Promise<FetchResponse>;
//# sourceMappingURL=fetch.d.ts.map