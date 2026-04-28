import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import { Collections } from "@/lib/firebase/firestore";
import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    // Verify admin session
    const sessionCookie = cookies().get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await adminAuth.getUser(decoded.uid);
    if (user.customClaims?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { chapterId, mangaId, titleEn, titleAr, mangaNameEn, mangaNameAr } =
      await request.json();

    // Get all user FCM tokens
    const usersSnap = await adminDb
      .collection(Collections.USERS)
      .where("fcmToken", "!=", null)
      .get();

    const tokens = usersSnap.docs
      .map((d) => d.data().fcmToken as string)
      .filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({ message: "No subscribers to notify" });
    }

    // Send multicast notification
    const result = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: {
        title: `📖 New Chapter: ${mangaNameEn}`,
        body: titleEn,
        imageUrl: undefined,
      },
      data: {
        mangaId,
        chapterId,
        type: "new_chapter",
        url: `/manga/${mangaId}/chapter/${chapterId}`,
      },
      webpush: {
        notification: {
          title: `📖 New Chapter: ${mangaNameEn}`,
          body: titleEn,
          icon: "/icons/icon-192.png",
        },
      },
    });

    // Mark chapter notification as sent
    await adminDb
      .collection(Collections.CHAPTERS)
      .doc(chapterId)
      .update({ notificationSent: true });

    return NextResponse.json({
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
