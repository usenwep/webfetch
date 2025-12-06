export declare function isNapiError(value: unknown): value is Error;
export declare function unwrapNapiResult<T>(result: T | Error, context: string): T;
export declare function checkNapiResult<T>(result: T | Error, context: string): T | null;
export declare function safeNapiCall<T>(fn: () => T | Error, context: string): T | null;
//# sourceMappingURL=napi-helpers.d.ts.map