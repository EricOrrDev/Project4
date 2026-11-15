"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

type ImageContextProps = {
	imageUrls: string[];
	isLoading: boolean;
	uploadImages: (images: File[]) => Promise<boolean>;
	deleteImage: (url: string) => Promise<boolean>;
	fetchImages: () => Promise<void>;
};

const ImageContext = createContext<ImageContextProps | undefined>(undefined);

export function ImageContextProvider(props: { children: ReactNode }) {
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const fetchImages = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/images", { method: "GET" });
			if (response.ok) {
				const data = await response.json();
				setImageUrls(data.imageUrls || []);
			} else {
				console.error("Failed to fetch images:", response.statusText);
			}
		} catch (error) {
			console.error("Error fetching images:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchImages();
	}, [fetchImages]);

	async function uploadImages(images: File[]): Promise<boolean> {
		try {
			const formData = new FormData();
			images.forEach((image) => formData.append("images", image));

			const response = await fetch("/api/images", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => null);
				console.error("Failed to upload images:", errData?.error || response.statusText);
				return false;
			}

			const data = await response.json();
			if (data.imageUrls && Array.isArray(data.imageUrls)) {
				setImageUrls((prev) => [...data.imageUrls, ...prev]);
			} else {
				await fetchImages();
			}
			return true;
		} catch (error) {
			console.error("Error uploading images:", error);
			return false;
		}
	}

	async function deleteImage(url: string): Promise<boolean> {
		try {
			const response = await fetch("/api/images", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url }),
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => null);
				console.error("Failed to delete image:", errData?.error || response.statusText);
				return false;
			}

			setImageUrls((prev) => prev.filter((imgUrl) => imgUrl !== url));
			return true;
		} catch (error) {
			console.error("Error deleting image:", error);
			return false;
		}
	}

	return (
		<ImageContext.Provider
			value={{ imageUrls, isLoading, uploadImages, deleteImage, fetchImages }}
		>
			{props.children}
		</ImageContext.Provider>
	);
}

export function useImageContext() {
	const context = useContext(ImageContext);
	if (!context) {
		throw new Error(
			"useImageContext must be used within an ImageContextProvider",
		);
	}
	return context;
}
