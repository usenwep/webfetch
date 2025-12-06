export { fetch, type FetchOptions, type FetchResponse, type NwepMethod } from './fetch.js';
import type { FetchOptions } from './fetch.js';
/**
 * READ request - retrieve a resource
 * @example
 * const res = await read('web://[::1]:4433/users/123');
 * console.log(res.json());
 */
export declare function read(url: string, options?: Omit<FetchOptions, 'method'>): Promise<import("./fetch.js").FetchResponse>;
/**
 * WRITE request - create or replace a resource
 * @example
 * await write('web://[::1]:4433/users', { name: 'alice', email: 'alice@example.com' });
 */
export declare function write(url: string, body: string | object, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<import("./fetch.js").FetchResponse>;
/**
 * MODIFY request - partially update a resource
 * @example
 * await modify('web://[::1]:4433/users/123', { name: 'alice cooper' });
 */
export declare function modify(url: string, body: string | object, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<import("./fetch.js").FetchResponse>;
/**
 * DELETE request - delete a resource
 * @example
 * await del('web://[::1]:4433/users/123');
 */
export declare function del(url: string, options?: Omit<FetchOptions, 'method'>): Promise<import("./fetch.js").FetchResponse>;
/**
 * PROBE request - query resource capabilities
 * @example
 * const res = await probe('web://[::1]:4433/api');
 * console.log(res.json());
 */
export declare function probe(url: string, options?: Omit<FetchOptions, 'method'>): Promise<import("./fetch.js").FetchResponse>;
/**
 * TRACE request - diagnostic echo
 * @example
 * const res = await trace('web://[::1]:4433/debug');
 * console.log(res.json());
 */
export declare function trace(url: string, options?: Omit<FetchOptions, 'method'>): Promise<import("./fetch.js").FetchResponse>;
//# sourceMappingURL=index.d.ts.map