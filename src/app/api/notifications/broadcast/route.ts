import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import { Collections } from "@/lib/firebase/firestore";
import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    // 1. Verify admin session (Optional but recommended for manual triggers)
    // For internal calls from check-scheduled, we might want to allow a secret key or just trust it
    const { titleEN, messageEN, secret } = await request.json();
    
    // Simple internal security check if called from check-scheduled
    const internalSecret = process.env.INTERNAL_SECRET || "mangia_internal_2024";
    if (secret !== internalSecret) {
      // If not internal, check for admin session
      const sessionCookie = cookies().get("session")?.value;
      if (!sessionCookie) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      const user = await adminAuth.getUser(decoded.uid);
      if (user.customClaims?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 2. Get all user FCM tokens
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

    // 3. Send multicast notification
    const result = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: {
        title: titleEN,
        body: messageEN,
      },
      webpush: {
        notification: {
          title: titleEN,
          body: messageEN,
          icon: "/icons/icon-192.png",
        },
      },
    });

    return NextResponse.json({
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error: any) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
