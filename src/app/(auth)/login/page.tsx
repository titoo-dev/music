"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogoMark, Spinner } from "@/components/motion/icons";

export default function LoginPage() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	useRouter();

	const handleGoogleSignIn = async () => {
		setLoading(true);
		setError("");
		try {
			const result = await authClient.signIn.social({
				provider: "google",
				callbackURL: "/",
			});
			const data = result as any;
			if (data?.error) {
				setError(data.error.message || "Sign in failed. Please try again.");
				setLoading(false);
				return;
			}
			const url = data?.url || data?.data?.url;
			if (url) {
				window.location.href = url;
			} else {
				setError("No redirect URL received. Check your Google OAuth configuration.");
				setLoading(false);
			}
		} catch (e: any) {
			setError(e?.message || "Sign in failed. Please try again.");
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className="w-full max-w-sm"
			>
				<div className="mb-8 flex flex-col items-center text-center">
					<LogoMark animated className="size-11" />
					<h1 className="mt-5 text-2xl font-semibold tracking-tight m-0">Sign in to deemix</h1>
					<p className="mt-2 text-sm text-muted-foreground text-balance">
						Sync your playlists, download history and preferences — or continue as a guest.
					</p>
				</div>

				<div className="rounded-xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0_0_0/0.04)]">
					<Button
						onClick={handleGoogleSignIn}
						disabled={loading}
						size="lg"
						className="w-full"
					>
						{loading ? (
							<Spinner />
						) : (
							<svg className="size-4" viewBox="0 0 24 24" aria-hidden>
								<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
								<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
								<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
								<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
							</svg>
						)}
						{loading ? "Signing in…" : "Continue with Google"}
					</Button>

					<AnimatePresence initial={false}>
						{error && (
							<motion.div
								key="error"
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="overflow-hidden"
							>
								<p
									role="alert"
									className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
								>
									{error}
								</p>
							</motion.div>
						)}
					</AnimatePresence>

					<div className="my-5 flex items-center gap-3">
						<div className="h-px flex-1 bg-border" />
						<span className="text-xs text-muted-foreground">or</span>
						<div className="h-px flex-1 bg-border" />
					</div>

					<Link href="/" className="block no-underline">
						<Button variant="outline" size="lg" className="w-full">
							Continue as guest
						</Button>
					</Link>
				</div>

				<p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground text-balance">
					A self-hosted tool — respect artist rights. deemix is not affiliated with Deezer S.A.
				</p>
			</motion.div>
		</div>
	);
}
