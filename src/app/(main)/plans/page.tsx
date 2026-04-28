"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import { SubscriptionPlan } from "@/types";
import { Check, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, Collections.PLANS),
      where("isActive", "==", true)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const plansData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubscriptionPlan[];
      
      // Sort by price
      setPlans(plansData.sort((a, b) => a.price - b.price));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load subscription plans");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubscribe = async (planId: string) => {
    const selectedPlan = plans.find((plan) => plan.id === planId);
    toast.loading("Redirecting to checkout...", { id: "checkout" });
    // In a real app, you'd call a Stripe checkout session creation endpoint here
    setTimeout(() => {
      toast.success(`Stripe integration for ${selectedPlan?.nameEn || "this plan"} coming soon!`, { id: "checkout" });
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Pricing Plans
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white"
          >
            Choose Your <span className="text-primary">Adventure</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-dark-subtext max-w-2xl mx-auto text-lg"
          >
            Join thousands of readers and get unlimited access to the world&apos;s most premium manga collection.
          </motion.p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-500 group overflow-hidden ${
                plan.isPopular 
                  ? "bg-[#0B0B0E] border-primary ring-1 ring-primary/20 scale-105 z-10" 
                  : "bg-black/40 border-white/5 hover:border-white/20"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-black text-white mb-2">{plan.nameEn}</h3>
                <p className="text-sm text-dark-subtext uppercase tracking-widest font-bold">{plan.nameAr}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-white">${plan.price}</span>
                <span className="text-dark-subtext font-bold uppercase tracking-widest text-xs">
                  / {plan.interval === 'month' ? 'month' : 'year'}
                </span>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Features Included</p>
                <ul className="space-y-4">
                  {(plan.featuresEn || []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 group/item">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-dark-subtext group-hover/item:text-white transition-colors">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  plan.isPopular 
                    ? "bg-primary text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(1,255,72,0.3)]" 
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                Subscribe Now
              </button>

              {/* Background Decoration */}
              <div className={`absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-[100px] transition-opacity duration-500 opacity-20 group-hover:opacity-40 ${
                plan.isPopular ? "bg-primary" : "bg-white/10"
              }`} />
            </motion.div>
          ))}
        </div>

        {/* FAQ / Info */}
        <div className="text-center pt-10">
          <p className="text-dark-subtext text-sm">
            All plans include a 7-day money-back guarantee. No hidden fees. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
