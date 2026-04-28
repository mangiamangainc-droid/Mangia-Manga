import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { adminDb } from "@/lib/firebase/admin";
import { Collections } from "@/lib/firebase/firestore";

export async function POST(request: Request) {
  try {
    const { priceId, userId, userEmail } = await request.json();

    // Get or create Stripe customer
    const userRef = adminDb.collection(Collections.USERS).doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    let customerId: string = userData?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { firebaseUID: userId },
      });
      customerId = customer.id;
      await userRef.update({ stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?cancelled=true`,
      metadata: { userId },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
