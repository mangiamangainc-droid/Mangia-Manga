"use client";
import { useState, useRef } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";

export function useImageUpload(folder: string) {
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [uploadedURL, setUploadedURL] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => inputRef.current?.click();

  const handleFileSelect = (file: File) => {
    const localURL = URL.createObjectURL(file);
    setPreviewURL(localURL);
    setPendingFile(file);
    setShowPicker(true); // Show position picker BEFORE uploading
  };

  const saveWithPosition = async (pos: { x: number; y: number }) => {
    setShowPicker(false);
    setPosition(pos);
    if (!pendingFile) return null;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(pendingFile, folder);
      setUploadedURL(url);
      setUploading(false);
      return { url, position: pos };
    } catch (err) {
      setUploading(false);
      return null;
    }
  };

  const cancelPicker = () => {
    setShowPicker(false);
    setPreviewURL(null);
    setPendingFile(null);
  };

  return {
    inputRef,
    previewURL: uploadedURL || previewURL,
    position,
    showPicker,
    uploading,
    openFilePicker,
    handleFileSelect,
    saveWithPosition,
    cancelPicker,
    setPreviewURL,
    setPosition,
  };
}
