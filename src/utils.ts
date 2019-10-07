export function parsePath(path: string) {
    return path
        .split('/')
        .filter(path => path)
}