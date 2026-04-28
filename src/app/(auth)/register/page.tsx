"use client";

import { useState, useEffect } from "react";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { BookOpen, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { registerWithEmail, loginWithGoogle } from "@/services/authService";
import { doc, getDoc, getDocs, query, collection, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useLogo } from "@/hooks/useLogo";
import { UsernameModal } from "@/components/ui/UsernameModal";

const registerSchema = z
  .object({
    username: z.string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterMediaData {
  mediaURL?: string;
  title?: string;
  subtitle?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const logoURL = useLogo();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registerMedia, setRegisterMedia] = useState<RegisterMediaData | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"available"|"taken"|"invalid">("idle");
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [googleUid, setGoogleUid] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  // Fetch admin-configurable media from Firestore
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "registerPage"));
        if (snap.exists()) {
          setRegisterMedia(snap.data() as RegisterMediaData);
        }
      } catch (error) {
        console.error("Failed to load register page media:", error);
      }
    })();
  }, []);

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    if (username.length < 3) return false;
    const reserved = ["admin", "mangia", "root", "moderator"];
    if (reserved.includes(username.toLowerCase())) return false;
    
    const snap = await getDoc(doc(db, "usernames", username.toLowerCase()));
    return !snap.exists();
  };

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("username", value, { shouldValidate: true });
    
    if (value.length === 0) {
      setUsernameStatus("idle");
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(value) || value.length < 3) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const available = await checkUsernameAvailable(value);
    setUsernameStatus(available ? "available" : "taken");
  };

  const onSubmit = async (data: RegisterFormValues) => {
    if (usernameStatus !== "available") {
      toast.error("Please choose a valid and available username.");
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(data.email, data.password, data.name, data.username);
      toast.success("Account created successfully!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.needsUsername) {
        setGoogleUid(result.uid);
        setShowUsernameModal(true);
      } else {
        toast.success("Welcome!");
        router.push("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Google registration failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-dark-bg">
      {showUsernameModal && googleUid && (
        <UsernameModal 
          uid={googleUid} 
          onSuccess={() => {
            setShowUsernameModal(false);
            toast.success("Welcome!");
            router.push("/");
          }} 
        />
      )}

      {/* ─── Left Image Section (Flipped for Register) ───────────────── */}
      <div className="hidden lg:block lg:w-[55%] relative">
        <div className="absolute inset-0 bg-dark-bg/20 z-10 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-l from-dark-bg via-dark-bg/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent z-10" />
        
        <MediaDisplay
          url={registerMedia?.mediaURL}
          alt="MANGIA Register"
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          className="object-cover"
        />

        <div className="absolute bottom-16 left-16 z-20 max-w-md">
          <h2 className="text-4xl font-black text-white drop-shadow-lg mb-2">
            {registerMedia?.title || "Join the Community."}
          </h2>
          <p className="text-lg text-white/80 drop-shadow-md">
            {registerMedia?.subtitle || "Create an account to save your reading progress, build your library, and rate your favorite manga."}
          </p>
        </div>
      </div>

      {/* ─── Right Form Section ────────────────────────────────────────── */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 xl:px-24 relative z-10">
        
        {/* Logo */}
        <Link href="/" className="absolute top-8 right-8 sm:right-16 xl:right-24 flex items-center gap-2 group">
          {logoURL ? (
            <img src={logoURL} alt="MANGIA" style={{ height: "40px", objectFit: "contain" }} />
          ) : (
            <>
              <span className="text-xl font-black tracking-tight text-white">
                MAN<span className="text-primary">GIA</span>
              </span>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4 text-dark-bg" />
              </div>
            </>
          )}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto mt-16"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Create Account</h1>
            <p className="text-dark-subtext">Join MANGIA to start your reading journey.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Full Name</label>
              <input
                {...register("name")}
                type="text"
                placeholder="John Doe"
                className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-subtext font-bold">@</span>
                <input
                  {...register("username")}
                  onChange={handleUsernameChange}
                  type="text"
                  placeholder="manga_fan"
                  className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-10 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-bold"
                  maxLength={20}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  {usernameStatus === "available" && <div className="w-2 h-2 rounded-full bg-primary glow-primary" />}
                  {(usernameStatus === "taken" || usernameStatus === "invalid") && <div className="w-2 h-2 rounded-full bg-red-500" />}
                </div>
              </div>
              {errors.username ? (
                <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>
              ) : usernameStatus === "available" ? (
                <p className="text-xs text-primary font-medium mt-1">Username is available!</p>
              ) : usernameStatus === "taken" ? (
                <p className="text-xs text-red-400 font-medium mt-1">Username is already taken.</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="reader@mangia.com"
                className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                dir="ltr"
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full btn-primary py-3 mt-6 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Register
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-dark-border" />
            <span className="text-xs text-dark-subtext font-medium uppercase tracking-wider">Or register with</span>
            <div className="flex-1 h-px bg-dark-border" />
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 bg-dark-card border border-dark-border rounded-xl px-4 py-3 hover:bg-dark-muted transition-all"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-dark-subtext" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                  <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                </svg>
              )}
              <span className="text-sm font-semibold text-white">Continue with Google</span>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-dark-subtext">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in instead
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
