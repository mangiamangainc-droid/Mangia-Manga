export async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "mangia_uploads");
  formData.append("folder", folder);

  const isVideo = file.type.startsWith("video/");
  const endpoint = isVideo
    ? `https://api.cloudinary.com/v1_1/ddofyuprl/video/upload`
    : `https://api.cloudinary.com/v1_1/ddofyuprl/image/upload`;

  const res = await fetch(endpoint, { method: "POST", body: formData });
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload failed");
  return data.secure_url;
}
