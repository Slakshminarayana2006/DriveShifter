import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import {
    Cloud,
    ArrowRightLeft,
    Loader2,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import logo1 from '../assets/DriveShifter.png' 

function GoogleGlyph({ className = "h-5 w-5" }) {
    return (
        <svg
            className={className}
            viewBox="0 0 48 48"
            aria-hidden="true"
        >
            <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />

            <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />

            <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />

            <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
        </svg>
    );
}

export default function Login() {

    const { handleLogin } = useAuth();

    const [loading, setLoading] = useState(false);

    const [showGoogleLogin, setShowGoogleLogin] = useState(false);

    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await handleLogin(
                credentialResponse.credential
            );

            if (!response.sourceDriveConnected) {
                window.location.href =
                    `${import.meta.env.VITE_API_URL}/api/drive/connect`;

                return;
            }

            navigate("/dashboard");

        } catch (error) {
            console.error("Google login failed:", error);
        }
    };

    const handleGoogleError = () => {

        setLoading(false);

        console.error(
            "Google authentication failed"
        );

        toast.error("Google Authentication Failed");
    };

    const handleContinue = () => {

        if (loading) return;

        setShowGoogleLogin(true);
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-slate-50 via-white to-cyan-50/50 px-4 font-sans">

            <motion.div
                initial={{
                    opacity: 0,
                    y: 18,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.35,
                    ease: "easeOut",
                }}
                className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
            >

                {/* Top accent */}

                <div className="h-1.5 w-full bg-linear-to-r from-teal-500 to-cyan-500" />

                <div className="flex flex-col items-center px-8 py-10 text-center">

                    {/* Logo */}

                    <motion.div
                        initial={{
                            scale: 0.85,
                            opacity: 0,
                        }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                        }}
                        transition={{
                            duration: 0.4,
                            delay: 0.1,
                            ease: "easeOut",
                        }}
                        className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >

                        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-cyan-500">

                            <img src={logo1} className="rounded" />

                            <ArrowRightLeft
                                className="absolute h-3 w-3 text-white"
                                strokeWidth={3}
                            />

                        </div>

                    </motion.div>

                    {/* Title */}

                    <motion.h1
                        initial={{
                            opacity: 0,
                            y: 8,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.35,
                            delay: 0.15,
                        }}
                        className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900"
                    >
                        DriveShifter
                    </motion.h1>

                    <motion.p
                        initial={{
                            opacity: 0,
                            y: 8,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.35,
                            delay: 0.2,
                        }}
                        className="mt-2 text-sm leading-relaxed text-slate-500"
                    >
                        Move your files between Google Drives,
                        <br />
                        simply and securely.
                    </motion.p>

                    {/* Custom Login Button */}

                    {!showGoogleLogin ? (

                        <motion.button
                            initial={{
                                opacity: 0,
                                y: 8,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                duration: 0.35,
                                delay: 0.28,
                            }}
                            whileHover={{
                                y: -1,
                            }}
                            whileTap={{
                                scale: 0.98,
                            }}
                            onClick={handleContinue}
                            disabled={loading}
                            className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 py-3 text-sm font-bold text-white shadow-sm shadow-teal-900/10 transition hover:from-teal-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-80"
                        >

                            {loading ? (

                                <>
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                    />

                                    Connecting to Google...
                                </>

                            ) : (

                                <>
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                                        <GoogleGlyph className="h-3.5 w-3.5" />
                                    </span>

                                    Continue with Google
                                </>

                            )}

                        </motion.button>

                    ) : (

                        /* Actual Google OAuth */

                        <div className="mt-7 flex w-full flex-col items-center gap-4">

                            {loading && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">

                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                    />

                                    Connecting to Google...

                                </div>
                            )}

                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                            />

                        </div>

                    )}

                    {/* Terms */}

                    <motion.p
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        transition={{
                            duration: 0.35,
                            delay: 0.35,
                        }}
                        className="mt-5 text-[11px] leading-relaxed text-slate-400"
                    >
                        By continuing you agree to DriveShifter's{" "}

                        <a
                            href="#"
                            className="font-medium text-slate-500 underline underline-offset-2 hover:text-teal-600"
                        >
                            Terms
                        </a>

                        {" "}and{" "}

                        <a
                            href="#"
                            className="font-medium text-slate-500 underline underline-offset-2 hover:text-teal-600"
                        >
                            Privacy Policy
                        </a>

                        .
                    </motion.p>

                </div>

            </motion.div>

            {/* Footer */}

            <motion.p
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.4,
                    delay: 0.4,
                }}
                className="absolute bottom-10 text-sm text-slate-400"
            >
                Enterprise-grade file migration.
            </motion.p>

        </div>
    );
}