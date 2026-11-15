export function generateFileName(extension: string = "webp"): string {
    return `${crypto.randomUUID()}.${extension}`
}

export function isOwner(url: string, userId: string): boolean {
    return url.includes(`/${userId}/`)
}