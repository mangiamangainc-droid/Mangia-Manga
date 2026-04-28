"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  preview?: string;
  label?: string;
  hint?: string;
  accept?: string[];
  maxSize?: number;
  className?: string;
}

export function ImageUpload({
  onFileSelect,
  onClear,
  preview,
  label = "Upload Image",
  hint,
  accept = ["image/jpeg", "image/png", "image/webp"],
  maxSize = 10 * 1024 * 1024,
  className,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: { errors: { code: string }[] }[]) => {
      setError(null);
      if (rejected.length > 0) {
        const code = rejected[0].errors[0].code;
        if (code === "file-too-large") setError("File is too large");
        else if (code === "file-invalid-type") setError("Invalid file type");
        else setError("Upload failed");
        return;
      }
      if (accepted[0]) onFileSelect(accepted[0]);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
  });

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text)]">{label}</label>
      )}

      {preview ? (
        <div className="relative rounded-xl overflow-hidden bg-dark-muted border border-dark-border group">
          <img
            src={preview}
            alt="Preview"
            style={{ width: "100%", height: "200px", objectFit: "cover" }}
            className="max-h-52"
          />
          <button
            onClick={onClear}
            type="button"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-dark-border hover:border-primary/50 hover:bg-dark-muted/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-primary animate-bounce" />
            ) : (
              <ImageIcon className="w-8 h-8 text-dark-subtext" />
            )}
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                {isDragActive ? "Drop here" : "Drag & drop or click to upload"}
              </p>
              {hint && <p className="text-xs text-dark-subtext mt-0.5">{hint}</p>}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
