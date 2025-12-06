export function isNapiError(value: unknown): value is Error {
  return value instanceof Error;
}

export function unwrapNapiResult<T>(result: T | Error, context: string): T {
  if (isNapiError(result)) {
    throw new Error(`${context}: ${result.message}`, { cause: result });
  }
  return result;
}

export function checkNapiResult<T>(result: T | Error, context: string): T | null {
  if (isNapiError(result)) {
    console.error(`${context}: ${result.message}`, result);
    return null;
  }
  return result;
}

export function safeNapiCall<T>(fn: () => T | Error, context: string): T | null {
  try {
    const result = fn();
    return checkNapiResult(result, context);
  } catch (error) {
    console.error(`${context}:`, error);
    return null;
  }
}
