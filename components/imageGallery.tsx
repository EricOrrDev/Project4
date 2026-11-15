'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
    Box,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Paper,
    Skeleton,
    Tooltip
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import CloseIcon from '@mui/icons-material/Close'
import CollectionsIcon from '@mui/icons-material/Collections'
import { useImageContext } from '@/context/imageContext'

export default function ImageGallery() {
    const { imageUrls = [], deleteImage, isLoading } = useImageContext() as {
        imageUrls?: string[]
        deleteImage?: (url: string) => Promise<boolean | void>
        isLoading?: boolean
    }

    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
    const [confirmDeleteUrl, setConfirmDeleteUrl] = useState<string | null>(null)

    const handleDelete = async (url: string) => {
        if (!deleteImage) return
        setDeletingUrl(url)
        try {
            await deleteImage(url)
            if (selectedImage === url) {
                setSelectedImage(null)
            }
        } finally {
            setDeletingUrl(null)
            setConfirmDeleteUrl(null)
        }
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CollectionsIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Your Gallery
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    {imageUrls.length} {imageUrls.length === 1 ? 'image' : 'images'}
                </Typography>
            </Box>

            {isLoading ? (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'repeat(1, 1fr)',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)'
                        },
                        gap: 2.5
                    }}
                >
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                        <Skeleton
                            key={key}
                            variant="rounded"
                            height={240}
                            sx={{ borderRadius: 3 }}
                        />
                    ))}
                </Box>
            ) : imageUrls.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                        borderRadius: 3,
                        border: '2px dashed',
                        borderColor: 'grey.300'
                    }}
                >
                    <CollectionsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No images yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Upload some images using the form above to build your gallery!
                    </Typography>
                </Paper>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'repeat(1, 1fr)',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)'
                        },
                        gap: 2.5
                    }}
                >
                    {imageUrls.map((url, index) => {
                        const isThisDeleting = deletingUrl === url
                        return (
                            <Paper
                                key={url}
                                elevation={2}
                                sx={{
                                    position: 'relative',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    aspectRatio: '1',
                                    bgcolor: 'grey.100',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 6,
                                        '& .gallery-overlay': {
                                            opacity: 1
                                        }
                                    }
                                }}
                            >
                                <Image
                                    src={url}
                                    alt={`Gallery photo ${index + 1}`}
                                    fill
                                    unoptimized={url.includes('/api/images/serve')}
                                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                    style={{ objectFit: 'cover' }}
                                    priority={index < 4}
                                />

                                {/* Hover action overlay */}
                                <Box
                                    className="gallery-overlay"
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        bgcolor: 'rgba(0, 0, 0, 0.35)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1.5,
                                        opacity: isThisDeleting ? 1 : 0,
                                        transition: 'opacity 0.2s ease'
                                    }}
                                >
                                    {isThisDeleting ? (
                                        <CircularProgress size={32} sx={{ color: 'white' }} />
                                    ) : (
                                        <>
                                            <Tooltip title="Preview">
                                                <IconButton
                                                    onClick={() => setSelectedImage(url)}
                                                    sx={{
                                                        bgcolor: 'white',
                                                        color: 'text.primary',
                                                        '&:hover': { bgcolor: 'grey.200' }
                                                    }}
                                                >
                                                    <ZoomInIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    onClick={() => setConfirmDeleteUrl(url)}
                                                    sx={{
                                                        bgcolor: 'error.main',
                                                        color: 'white',
                                                        '&:hover': { bgcolor: 'error.dark' }
                                                    }}
                                                >
                                                    <DeleteOutlineIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </Box>
                            </Paper>
                        )
                    })}
                </Box>
            )}

            {/* Confirmation Dialog */}
            <Dialog
                open={Boolean(confirmDeleteUrl)}
                onClose={() => setConfirmDeleteUrl(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Delete Image?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to permanently delete this image from your gallery? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        onClick={() => setConfirmDeleteUrl(null)}
                        disabled={Boolean(deletingUrl)}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => confirmDeleteUrl && handleDelete(confirmDeleteUrl)}
                        disabled={Boolean(deletingUrl)}
                        startIcon={deletingUrl ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Fullscreen Preview Dialog */}
            <Dialog
                open={Boolean(selectedImage)}
                onClose={() => setSelectedImage(null)}
                maxWidth="md"
                fullWidth
            >
                <Box sx={{ position: 'relative', bgcolor: 'black', p: 1 }}>
                    <IconButton
                        onClick={() => setSelectedImage(null)}
                        sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            zIndex: 2,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    {selectedImage && (
                        <Box sx={{ position: 'relative', width: '100%', height: { xs: 300, sm: 500, md: 600 } }}>
                            <Image
                                src={selectedImage}
                                alt="Expanded view"
                                fill
                                unoptimized={selectedImage.includes('/api/images/serve')}
                                style={{ objectFit: 'contain' }}
                                sizes="(max-width: 900px) 100vw, 850px"
                            />
                        </Box>
                    )}
                </Box>
            </Dialog>
        </Box>
    )
}
