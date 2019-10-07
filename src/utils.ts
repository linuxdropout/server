export function parsePath(path: string) {
    return path
        .split('/')
        .filter(pathPart => pathPart)
}
