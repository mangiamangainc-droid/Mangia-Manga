import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/config";
import { adminDb } from "@/lib/firebase/admin";
import { Collections } from "@/lib/firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = adminDb;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await db.collection(Collections.USERS).doc(userId).update({
        subscriptionStatus: "active",
        stripeSubscriptionId: subscription.id,
        subscriptionEndDate: Timestamp.fromMillis(
          subscription.current_period_end * 1000
        ),
        updatedAt: Timestamp.now(),
      });

      // Record subscription
      await db.collection(Collections.SUBSCRIPTIONS).add({
        userId,
        stripeSubscriptionId: subscription.id,
        status: "active",
        startDate: Timestamp.fromMillis(subscription.current_period_start * 1000),
        endDate: Timestamp.fromMillis(subscription.current_period_end * 1000),
        createdAt: Timestamp.now(),
      });
      break;
    }

    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const usersSnap = await db
        .collection(Collections.USERS)
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

      if (!usersSnap.empty) {
        const userDoc = usersSnap.docs[0];
        const status =
          subscription.status === "active" ? "active" : "inactive";
        await userDoc.ref.update({
          subscriptionStatus: status,
          subscriptionEndDate: Timestamp.fromMillis(
            subscription.current_period_end * 1000
          ),
          updatedAt: Timestamp.now(),
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
