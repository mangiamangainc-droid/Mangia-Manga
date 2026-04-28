"use client";

import { useState, useEffect } from "react";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import { UsernameModal } from "@/components/ui/UsernameModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { BookOpen, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { loginWithEmail, loginWithGoogle } from "@/services/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useUIStore } from "@/store/uiStore";
import { useLogo } from "@/hooks/useLogo";

const loginSchema = z.object({
  identifier: z.string().min(3, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginMediaData {
  mediaURL?: string;
  title?: string;
  subtitle?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useUIStore();
  const logoURL = useLogo();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginMedia, setLoginMedia] = useState<LoginMediaData | null>(null);
  
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [googleUid, setGoogleUid] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Fetch admin-configurable media from Firestore
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "loginPage"));
        if (snap.exists()) {
          setLoginMedia(snap.data() as LoginMediaData);
        }
      } catch (error) {
        console.error("Failed to load login page media:", error);
      }
    })();
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      await loginWithEmail(data.identifier, data.password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to login. Check your credentials.");
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
        toast.success("Welcome back!");
        router.push("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    toast.error("Facebook login is not configured yet.");
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

      {/* ─── Left Form Section ────────────────────────────────────────── */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 xl:px-24 relative z-10">
        
        {/* Logo */}
        <Link href="/" className="absolute top-8 left-8 sm:left-16 xl:left-24 flex items-center gap-2 group">
          {logoURL ? (
            <img src={logoURL} alt="MANGIA" style={{ height: "40px", objectFit: "contain" }} />
          ) : (
            <>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4 text-dark-bg" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                MAN<span className="text-primary">GIA</span>
              </span>
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
            <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
            <p className="text-dark-subtext">Enter your details to access your library.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Email or Username</label>
              <input
                {...register("identifier")}
                type="text"
                placeholder="reader@mangia.com or username"
                className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                dir="ltr"
              />
              {errors.identifier && <p className="text-xs text-red-400 mt-1">{errors.identifier.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-white">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full btn-primary py-3 mt-4 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-dark-border" />
            <span className="text-xs text-dark-subtext font-medium uppercase tracking-wider">Or continue with</span>
            <div className="flex-1 h-px bg-dark-border" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="flex items-center justify-center gap-2 bg-dark-card border border-dark-border rounded-xl px-4 py-2.5 hover:bg-dark-muted transition-all"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-dark-subtext" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                  <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                </svg>
              )}
              <span className="text-sm font-semibold text-white">Google</span>
            </button>

            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading || googleLoading}
              className="flex items-center justify-center gap-2 bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-xl px-4 py-2.5 hover:bg-[#1877F2]/20 transition-all text-[#1877F2]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-semibold">Facebook</span>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-dark-subtext">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ─── Right Image Section ───────────────────────────────────────── */}
      <div className="hidden lg:block lg:w-[55%] relative">
        <div className="absolute inset-0 bg-dark-bg/20 z-10 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent z-10" />
        
        <MediaDisplay
          url={loginMedia?.mediaURL}
          alt="MANGIA Login"
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          className="object-cover"
        />

        <div className="absolute bottom-16 right-16 z-20 text-right max-w-md">
          <h2 className="text-4xl font-black text-white drop-shadow-lg mb-2">
            {loginMedia?.title || "Unlimited Manga."}
          </h2>
          <p className="text-lg text-white/80 drop-shadow-md">
            {loginMedia?.subtitle || "Read the latest chapters in HD, switch between Arabic and English, and track your progress seamlessly."}
          </p>
        </div>
      </div>
    </div>
  );
}
