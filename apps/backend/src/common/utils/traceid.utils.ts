// trace.context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>()

export function runWithTrace<T>(traceId: string, fn: () => T | Promise<T>): T | Promise<T> {
    const store = new Map<string, any>()
    store.set('traceId', traceId)
    return asyncLocalStorage.run(store, fn)
}

export function getTraceId(): string | undefined {
    return asyncLocalStorage.getStore()?.get('traceId')
}
