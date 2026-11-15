import Profile from "@/components/profile"
import ImageUpload from "@/components/imageUpload"
import ImageGallery from "@/components/imageGallery"
import { Container, Paper, Box, Typography } from "@mui/material"

export default function Home() {
    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
            <Profile />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        Upload Images
                    </Typography>
                    <ImageUpload />
                </Paper>
                <ImageGallery />
            </Container>
        </Box>
    )
}
