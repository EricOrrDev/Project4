import { get } from "@vercel/blob"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const fileUrl = searchParams.get("url")

        if (!fileUrl) {
            return new Response("Missing url parameter", { status: 400 })
        }

        const blobResult = await get(fileUrl, { access: "private" })
        if (!blobResult || !blobResult.stream) {
            return new Response("Image not found", { status: 404 })
        }

        const contentType = blobResult.headers.get("content-type") || "image/webp"

        return new Response(blobResult.stream, {
            headers: {
                "content-type": contentType,
                "cache-control": "public, max-age=31536000, immutable",
            },
        })
    } catch (error: unknown) {
        const err = error as { digest?: string; message?: string }
        if (err?.digest === "NEXT_PRERENDER_INTERRUPTED" || err?.message?.includes("bail out of prerendering")) {
            throw error
        }
        console.error("Error serving private blob:", error)
        return new Response("Error fetching image", { status: 500 })
    }
}
