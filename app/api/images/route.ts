import { put, list, del, get } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { generateFileName, isOwner } from "@/lib/file"

async function getAuthUser() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    return data?.user ?? null
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
            } catch (err: any) {
                // If the store is configured with private access, fallback to private
                if (err?.message?.includes("private store") || err?.message?.includes("private access")) {
                    blobResult = await put(`${id}/${generateFileName()}`, image, { access: 'private' })
                } else {
                    throw err
                }
            }
            urls.push(blobResult.url)
        }

        return Response.json({ imageUrls: urls })
    } catch (error: any) {
        console.error("POST /api/images error:", error)
        return Response.json({ error: error?.message || "Failed to upload images" }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return Response.json({ error: "User not authenticated" }, { status: 401 })
        }

        const id = user.id

        const { searchParams } = new URL(request.url)
        const fileUrl = searchParams.get("url")

        if (fileUrl) {
            if (!isOwner(fileUrl, id)) {
                return Response.json({ error: "Unauthorized to view this file" }, { status: 403 })
            }

            const blobResult = await get(fileUrl, { access: 'private' })
            if (!blobResult) {
                return Response.json({ error: "Image not found" }, { status: 404 })
            }
            return new Response(blobResult.stream, {
                headers: {
                    'content-type': blobResult.headers.get('content-type') || 'application/octet-stream',
                    'cache-control': 'public, max-age=31536000, immutable'
                }
            })
        }

        const blobs = (await list({ prefix: id })).blobs
        blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        const imageUrls = blobs.map(blob => blob.url)

        return Response.json({ imageUrls })
    } catch (error: any) {
        console.error("GET /api/images error:", error)
        return Response.json({ error: error?.message || "Failed to fetch images" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return Response.json({ error: "User not authenticated" }, { status: 401 })
        }

        const id = user.id
        const { url } = await request.json()
        if (!url) {
            return Response.json({ error: "URL is required" }, { status: 400 })
        }

        if (!isOwner(url, id)) {
            return Response.json({ error: "Unauthorized to delete this file" }, { status: 403 })
        }

        await del(url)
        return Response.json({ success: true })
    } catch (error: any) {
        console.error("DELETE /api/images error:", error)
        return Response.json({ error: error?.message || "Failed to delete image" }, { status: 500 })
    }
}
