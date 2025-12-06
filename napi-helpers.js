export function isNapiError(value) {
    return value instanceof Error;
}
export function unwrapNapiResult(result, context) {
    if (isNapiError(result)) {
        throw new Error(`${context}: ${result.message}`, { cause: result });
    }
    return result;
}
export function checkNapiResult(result, context) {
    if (isNapiError(result)) {
        console.error(`${context}: ${result.message}`, result);
        return null;
    }
    return result;
}
export function safeNapiCall(fn, context) {
    try {
        const result = fn();
        return checkNapiResult(result, context);
    }
    catch (error) {
        console.error(`${context}:`, error);
        return null;
    }
}
//# sourceMappingURL=napi-helpers.js.map