import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// This runs when called - checks for scheduled notifications past their time
export async function GET() {
  try {
    const now = new Date();
    const snap = await getDocs(
      query(collection(db, "notifications"),
      where("status", "==", "scheduled"),
      where("scheduledAt", "<=", now))
    );

    if (snap.empty) {
      return Response.json({ success: true, sent: 0 });
    }

    await Promise.all(snap.docs.map(async (d) => {
      const data = d.data();
      
      // 1. Update status in Firestore
      await updateDoc(d.ref, { 
        status: "sent", 
        sentAt: now 
      });

      // 2. Trigger the broadcast API for Push Notifications
      try {
        // We use the absolute URL or relative if on same host
        const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await fetch(`${origin}/api/notifications/broadcast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titleEN: data.titleEN,
            messageEN: data.messageEN,
            secret: "mangia_internal_2024" // Use the same secret as in broadcast/route.ts
          }),
        });
      } catch (err) {
        console.error(`Failed to broadcast scheduled notification ${d.id}:`, err);
      }
    }));

    return Response.json({ success: true, sent: snap.size });
  } catch (error: any) {
    console.error("Failed to check scheduled notifications:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
