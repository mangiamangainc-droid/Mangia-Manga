"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, Star, Loader2, DollarSign } from "lucide-react";
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import { SubscriptionPlan } from "@/types";
import toast from "react-hot-toast";

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    const q = query(collection(db, Collections.PLANS));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPlan)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this plan? Users currently on this plan will not be affected but no new users can join.")) {
      try {
        await deleteDoc(doc(db, Collections.PLANS, id));
        toast.success("Plan deleted");
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
          <p className="text-sm text-dark-subtext mt-1">Manage Premium tier pricing and features.</p>
        </div>
        <button 
          onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ADD NEW PLAN
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`bg-[#0B0B0E] p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col ${
              plan.isPopular ? "border-primary/50 ring-1 ring-primary/20" : "border-white/5"
            }`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
                Most Popular
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">{plan.nameEn}</h3>
              <p className="text-xs text-dark-subtext uppercase font-bold tracking-widest mt-1">{plan.nameAr}</p>
            </div>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white">${plan.price}</span>
              <span className="text-dark-subtext text-sm">/{plan.interval === 'month' ? 'mo' : 'yr'}</span>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Included Features</p>
              <ul className="space-y-2.5">
                {plan.featuresEn.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-dark-subtext">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 pt-6 border-t border-white/5">
              <button 
                onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" /> EDIT
              </button>
              <button 
                onClick={() => handleDelete(plan.id)}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {plans.length === 0 && !loading && (
          <div className="col-span-full bg-[#0B0B0E] p-24 rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center">
            <CreditCard className="w-12 h-12 text-dark-muted mb-4" />
            <h3 className="text-lg font-bold text-white">No active plans</h3>
            <p className="text-dark-subtext max-w-sm mt-2">You haven't created any subscription plans yet. Add one to start monetizing your content.</p>
          </div>
        )}
      </div>

      <PlanModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={editingPlan}
      />
    </div>
  );
}

function PlanModal({ isOpen, onClose, plan }: { isOpen: boolean, onClose: () => void, plan: SubscriptionPlan | null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nameEn: "",
    nameAr: "",
    price: 0,
    interval: "month" as "month" | "year",
    isPopular: false,
    featuresEn: "",
    featuresAr: "",
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        nameEn: plan.nameEn,
        nameAr: plan.nameAr,
        price: plan.price,
        interval: plan.interval,
        isPopular: plan.isPopular,
        featuresEn: plan.featuresEn.join("\n"),
        featuresAr: plan.featuresAr.join("\n"),
      });
    } else {
      setFormData({
        nameEn: "",
        nameAr: "",
        price: 9.99,
        interval: "month",
        isPopular: false,
        featuresEn: "Unlimited Access\nNo Ads\nEarly Access",
        featuresAr: "وصول غير محدود\nبدون إعلانات\nوصول مبكر",
      });
    }
  }, [plan, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = {
        ...formData,
        featuresEn: formData.featuresEn.split("\n").filter(f => f.trim() !== ""),
        featuresAr: formData.featuresAr.split("\n").filter(f => f.trim() !== ""),
        updatedAt: Timestamp.now(),
        isActive: true,
      };

      if (plan) {
        await updateDoc(doc(db, Collections.PLANS, plan.id), data);
        toast.success("Plan updated!");
      } else {
        await addDoc(collection(db, Collections.PLANS), {
          ...data,
          createdAt: Timestamp.now(),
        });
        toast.success("Plan created!");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-[#0B0B0E] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{plan ? "Edit Plan" : "New Subscription Plan"}</h2>
          <button onClick={onClose} className="text-dark-subtext hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-subtext mb-2 uppercase">Plan Name (EN)</label>
              <input 
                value={formData.nameEn}
                onChange={e => setFormData({...formData, nameEn: e.target.value})}
                placeholder="e.g. Premium Monthly"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div dir="rtl">
              <label className="block text-xs font-bold text-dark-subtext mb-2 uppercase text-right">اسم الخطة (AR)</label>
              <input 
                value={formData.nameAr}
                onChange={e => setFormData({...formData, nameAr: e.target.value})}
                placeholder="مثال: بريميوم شهري"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white text-right focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-subtext mb-2 uppercase">Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-subtext" />
                <input 
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-subtext mb-2 uppercase">Billing Interval</label>
              <select 
                value={formData.interval}
                onChange={e => setFormData({...formData, interval: e.target.value as "month" | "year"})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
              >
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-dark-subtext mb-2 uppercase">Features (EN) - One per line</label>
              <textarea 
                rows={5}
                value={formData.featuresEn}
                onChange={e => setFormData({...formData, featuresEn: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none resize-none"
              />
            </div>
            <div className="space-y-2" dir="rtl">
              <label className="block text-xs font-bold text-dark-subtext mb-2 uppercase text-right">المميزات (AR) - واحدة لكل سطر</label>
              <textarea 
                rows={5}
                value={formData.featuresAr}
                onChange={e => setFormData({...formData, featuresAr: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white text-right focus:border-primary/50 focus:outline-none resize-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group w-fit">
            <input 
              type="checkbox" 
              checked={formData.isPopular}
              onChange={e => setFormData({...formData, isPopular: e.target.checked})}
              className="w-4 h-4 rounded border-white/10 bg-black text-primary focus:ring-primary/50" 
            />
            <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">Mark as "Most Popular"</span>
          </label>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/30 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-dark-subtext hover:text-white transition-colors">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="btn-primary min-w-[140px] flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (plan ? "Save Changes" : "Create Plan")}
          </button>
        </div>
      </div>
    </div>
  );
}

import { X, CreditCard } from "lucide-react";
