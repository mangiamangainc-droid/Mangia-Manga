import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
  StorageError,
} from "firebase/storage";
import { storage } from "./config";

export type UploadProgress = {
  progress: number;
  downloadURL?: string;
  error?: string;
};

// ─── Upload file with progress ───────────────────────────────────────
export const uploadFile = (
  file: File,
  path: string,
  onProgress?: (snapshot: UploadTaskSnapshot) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => onProgress?.(snapshot),
      (error: StorageError) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
};

// ─── Delete file ─────────────────────────────────────────────────────
export const deleteFile = async (path: string) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

// ─── Upload paths ─────────────────────────────────────────────────────
export const StoragePaths = {
  mangaBanner: (mangaId: string) => `manga/${mangaId}/banner`,
  mangaPoster: (mangaId: string) => `manga/${mangaId}/poster`,
  seasonPoster: (mangaId: string, seasonId: string) =>
    `manga/${mangaId}/seasons/${seasonId}/poster`,
  chapterPage: (mangaId: string, chapterId: string, pageIndex: number) =>
    `manga/${mangaId}/chapters/${chapterId}/page_${pageIndex}`,
  chapterPdf: (mangaId: string, chapterId: string) =>
    `manga/${mangaId}/chapters/${chapterId}/chapter.pdf`,
  loginImage: () => `settings/login_image`,
  userAvatar: (userId: string) => `users/${userId}/avatar`,
  adImage: (adId: string) => `ads/${adId}/image`,
};
