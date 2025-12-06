export { fetch, type FetchOptions, type FetchResponse, type NwepMethod } from './fetch.js';
import type { FetchOptions } from './fetch.js';
import { fetch } from './fetch.js';

/**
 * READ request - retrieve a resource
 * @example
 * const res = await read('web://[::1]:4433/users/123');
 * console.log(res.json());
 */
export async function read(url: string, options?: Omit<FetchOptions, 'method'>) {
  return fetch(url, { ...options, method: 'READ' });
}

/**
 * WRITE request - create or replace a resource
 * @example
 * await write('web://[::1]:4433/users', { name: 'alice', email: 'alice@example.com' });
 */
export async function write(url: string, body: string | object, options?: Omit<FetchOptions, 'method' | 'body'>) {
  return fetch(url, { ...options, method: 'WRITE', body });
}

/**
 * MODIFY request - partially update a resource
 * @example
 * await modify('web://[::1]:4433/users/123', { name: 'alice cooper' });
 */
export async function modify(url: string, body: string | object, options?: Omit<FetchOptions, 'method' | 'body'>) {
  return fetch(url, { ...options, method: 'MODIFY', body });
}

/**
 * DELETE request - delete a resource
 * @example
 * await del('web://[::1]:4433/users/123');
 */
export async function del(url: string, options?: Omit<FetchOptions, 'method'>) {
  return fetch(url, { ...options, method: 'DELETE' });
}

/**
 * PROBE request - query resource capabilities
 * @example
 * const res = await probe('web://[::1]:4433/api');
 * console.log(res.json());
 */
export async function probe(url: string, options?: Omit<FetchOptions, 'method'>) {
  return fetch(url, { ...options, method: 'PROBE' });
}

/**
 * TRACE request - diagnostic echo
 * @example
 * const res = await trace('web://[::1]:4433/debug');
 * console.log(res.json());
 */
export async function trace(url: string, options?: Omit<FetchOptions, 'method'>) {
  return fetch(url, { ...options, method: 'TRACE' });
}
