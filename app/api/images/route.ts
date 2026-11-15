import { put, list, del } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { generateFileName, isOwner } from "@/lib/file"

async function getAuthUser() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    return data?.user ?? null
}

function formatImageUrl(blobUrl: string): string {
    if (blobUrl.includes(".private.blob.")) {
        return `/api/images/serve?url=${encodeURIComponent(blobUrl)}`
    }
    return blobUrl
}

export async function POST(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return Response.json({ error: "User not authenticated" }, { status: 401 })
        }

        const id = user.id

        const formData = await request.formData()
        const images = formData.getAll("images")

        if (!images || images.length === 0) {
            return Response.json({ error: "No images provided" }, { status: 400 })
        }

        const urls: string[] = []

        for (let i = 0; i < images.length; i++) {
            const image = images[i]
            if (!(image instanceof Blob)) continue

            let blobResult
            try {
                blobResult = await put(`${id}/${generateFileName()}`, image, { access: 'public' })
            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : String(err)
                // If the store is configured with private access, fallback to private
                if (errMsg.includes("private store") || errMsg.includes("private access")) {
                    blobResult = await put(`${id}/${generateFileName()}`, image, { access: 'private' })
                } else {
                    throw err
                }
            }
            urls.push(formatImageUrl(blobResult.url))
        }

        return Response.json({ imageUrls: urls })
    } catch (error) {
        console.error("POST /api/images error:", error)
        const message = error instanceof Error ? error.message : "Failed to upload images"
        return Response.json({ error: message }, { status: 500 })
    }
}

export async function GET() {
    try {
        const user = await getAuthUser()
        if (!user) {
            return Response.json({ error: "User not authenticated" }, { status: 401 })
        }

        const id = user.id

        const blobs = (await list({ prefix: id })).blobs
        blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        const imageUrls = blobs.map(blob => formatImageUrl(blob.url))

        return Response.json({ imageUrls })
    } catch (error) {
        console.error("GET /api/images error:", error)
        const message = error instanceof Error ? error.message : "Failed to fetch images"
        return Response.json({ error: message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return Response.json({ error: "User not authenticated" }, { status: 401 })
        }

        const id = user.id
        const body = await request.json()
        let targetUrl = body?.url

        if (!targetUrl) {
            return Response.json({ error: "URL is required" }, { status: 400 })
        }

        // If the URL is wrapped in our proxy endpoint, extract the underlying blob URL
        if (targetUrl.includes("/api/images/serve?url=")) {
            try {
                const parsed = new URL(targetUrl, "http://localhost")
                const extracted = parsed.searchParams.get("url")
                if (extracted) {
                    targetUrl = extracted
                }
            } catch {
                // keep targetUrl as is
            }
        }

        // Verify the user owns this file
        if (!isOwner(targetUrl, id)) {
            return Response.json({ error: "Unauthorized to delete this file" }, { status: 403 })
        }

        await del(targetUrl)
        return Response.json({ success: true })
    } catch (error) {
        console.error("DELETE /api/images error:", error)
        const message = error instanceof Error ? error.message : "Failed to delete image"
        return Response.json({ error: message }, { status: 500 })
    }
}
