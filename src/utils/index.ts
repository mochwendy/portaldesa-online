export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export function safeJsonParse<T>(val: unknown, defaultValue: T = {} as T): T {
    if (typeof val === 'string') {
        try {
            return JSON.parse(val) as T;
        } catch {
            return defaultValue;
        }
    }
    return defaultValue;
}