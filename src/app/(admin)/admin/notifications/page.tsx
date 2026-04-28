"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bell, Loader2, Send } from "lucide-react";
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

const notificationSchema = z.object({
  titleEN: z.string().min(2, "English title is required"),
  titleAR: z.string().min(2, "Arabic title is required"),
  messageEN: z.string().min(5, "English message is required"),
  messageAR: z.string().min(5, "Arabic message is required"),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function AdminNotificationsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [sendType, setSendType] = useState<"now" | "scheduled">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
  });

  // Fetch all notifications ordered by date
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      setSentNotifications(notifs);
    });

    // Check for any scheduled notifications that should be sent now
    fetch("/api/notifications/check-scheduled").catch(err => console.error("Check failed", err));

    return () => unsub();
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const scheduledAt = sendType === "scheduled" && scheduleDate && scheduleTime
        ? new Date(`${scheduleDate}T${scheduleTime}`)
        : null;

      await addDoc(collection(db, "notifications"), {
        titleEN: data.titleEN,
        titleAR: data.titleAR,
        messageEN: data.messageEN,
        messageAR: data.messageAR,
        createdAt: new Date(),
        sentBy: user?.uid || null,
        readBy: [],
        status: sendType === "now" ? "sent" : "scheduled",
        scheduledAt: scheduledAt,
        sentAt: sendType === "now" ? new Date() : null,
      });

      // If sending now, trigger the push API
      if (sendType === "now") {
        try {
          await fetch("/api/notifications/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titleEN: data.titleEN,
              messageEN: data.messageEN
            }),
          });
        } catch (err) {
          console.error("Broadcast API failed", err);
        }
      }

      toast.success(sendType === "now" ? "Notification sent!" : "Notification scheduled!");
      reset();
      setScheduleDate("");
      setScheduleTime("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          Notifications Management
        </h1>
        <p className="text-dark-subtext mt-2">Broadcast alerts and manage scheduled notifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 1: SEND NOTIFICATION */}
        <div className="card space-y-6 h-fit">
          <h2 className="text-xl font-bold text-white mb-4">Send New Notification</h2>
          
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => setSendType("now")}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                background: sendType === "now" ? "#01FF48" : "#1a1a1a",
                color: sendType === "now" ? "#000" : "#888",
                border: "none", fontWeight: 700, cursor: "pointer",
              }}
            >
              Send Now
            </button>
            <button
              type="button"
              onClick={() => setSendType("scheduled")}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                background: sendType === "scheduled" ? "#FFA500" : "#1a1a1a",
                color: sendType === "scheduled" ? "#000" : "#888",
                border: "none", fontWeight: 700, cursor: "pointer",
              }}
            >
              Schedule
            </button>
          </div>

          {sendType === "scheduled" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "4px" }}>DATE</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #FFA500", color: "#fff", padding: "8px 12px", borderRadius: "8px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "4px" }}>TIME</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #FFA500", color: "#fff", padding: "8px 12px", borderRadius: "8px" }}
                />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase">Title (EN)</label>
                  <input {...register("titleEN")} className="input-field" placeholder="System Update" />
                  {errors.titleEN && <p className="text-[10px] text-red-500 mt-1">{errors.titleEN.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase">Message (EN)</label>
                  <textarea {...register("messageEN")} rows={3} className="input-field resize-none" placeholder="Enter message..." />
                  {errors.messageEN && <p className="text-[10px] text-red-500 mt-1">{errors.messageEN.message}</p>}
                </div>
              </div>

              <div className="space-y-4" dir="rtl">
                <div>
                  <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase text-right">العنوان (AR)</label>
                  <input {...register("titleAR")} className="input-field text-right" placeholder="تحديث النظام" />
                  {errors.titleAR && <p className="text-[10px] text-red-500 mt-1 text-right">{errors.titleAR.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase text-right">الرسالة (AR)</label>
                  <textarea {...register("messageAR")} rows={3} className="input-field resize-none text-right" placeholder="أدخل الرسالة..." />
                  {errors.messageAR && <p className="text-[10px] text-red-500 mt-1 text-right">{errors.messageAR.message}</p>}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || (sendType === "scheduled" && (!scheduleDate || !scheduleTime))} className="btn-primary w-full h-12">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> {sendType === "now" ? "BROADCAST NOTIFICATION" : "SCHEDULE NOTIFICATION"}</>}
            </button>
          </form>
        </div>

        {/* SECTION 2: MESSAGE HISTORY */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Message History</h2>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {sentNotifications.map(notif => {
              const isScheduled = notif.status === "scheduled";
              let scheduledAt = null;
              if (notif.scheduledAt) {
                if (typeof notif.scheduledAt.toDate === "function") {
                  scheduledAt = notif.scheduledAt.toDate();
                } else {
                  scheduledAt = new Date(notif.scheduledAt);
                }
              }
              const isPending = isScheduled && scheduledAt && scheduledAt > new Date();

              return (
                <div key={notif.id} style={{
                  background: "#1a1a1a",
                  border: `1px solid ${isPending ? "#FFA500" : "#2a2a2a"}`,
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Status badge */}
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "2px 10px",
                      borderRadius: "20px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      marginBottom: "8px",
                      background: isPending ? "rgba(255,165,0,0.15)" : "rgba(1,255,72,0.1)",
                      color: isPending ? "#FFA500" : "#01FF48",
                    }}>
                      {isPending ? "⏰ SCHEDULED" : "✅ SENT"}
                    </div>

                    <div style={{ fontWeight: 700, marginBottom: "4px", color: "#fff" }}>{notif.titleEN}</div>
                    <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: "8px" }}>{notif.messageEN}</div>

                    {/* Show countdown for scheduled */}
                    {isPending && scheduledAt && (
                      <div style={{ fontSize: "0.8rem", color: "#FFA500" }}>
                        📅 Scheduled for: {scheduledAt.toLocaleDateString()} at {scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}

                    {/* Sent info */}
                    {!isPending && (
                      <div style={{ fontSize: "0.75rem", color: "#555" }}>
                        Sent: {notif.createdAt?.toDate?.()?.toLocaleDateString() || new Date(notif.createdAt).toLocaleDateString()} • Read by {notif.readBy?.length || 0} users
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this notification?")) return;
                      await deleteDoc(doc(db, "notifications", notif.id));
                      toast.success("Deleted!");
                    }}
                    style={{
                      background: "rgba(255,50,50,0.1)",
                      border: "none",
                      color: "#ff5555",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      marginLeft: "12px",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              );
            })}
            
            {sentNotifications.length === 0 && (
              <div className="text-center text-dark-subtext py-12">
                No notifications found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
