"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const FEATURES = [
	"FLAC / 1411 KBPS",
	"3× CONCURRENT DOWNLOADS",
	"ALBUMS · PLAYLISTS · ARTISTS",
	"LYRICS SYNCED",
	"SPOTIFY IMPORT",
];

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
		<div className="grid min-h-screen lg:grid-cols-2">
			{/* Left: brutalist collage */}
			<div className="relative hidden flex-col overflow-hidden bg-foreground p-8 text-background lg:flex lg:p-12">
				{/* Repeating label bg */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 overflow-hidden whitespace-nowrap font-black leading-[0.9] opacity-[0.06]"
					style={{ fontSize: 80, letterSpacing: "-0.03em" }}
				>
					{Array.from({ length: 20 }).map((_, i) => (
						<div key={i}>DEEMIX · DEEMIX · DEEMIX · DEEMIX</div>
					))}
				</div>

				<div className="relative mb-12 flex items-center gap-2.5">
					<div className="size-7 border-2 border-background bg-primary" />
					<div className="text-[22px] font-black tracking-[-0.03em]">DEEMIX</div>
				</div>

				<div className="relative flex flex-1 flex-col justify-center">
					<div
						className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
						style={{ color: "var(--accent)" }}
					>
						V0.1.0 · OPEN-SOURCE · SELF-HOSTED
					</div>
					<h1 className="m-0 font-black tracking-[-0.04em] text-[clamp(48px,6vw,80px)]">
						<span className="block leading-[0.95]">OWN YOUR</span>
						<span className="mt-2 inline-block bg-primary px-3 pt-1 pb-2 leading-[0.85] text-white">
							LIBRARY.
						</span>
					</h1>
					<p className="mt-6 max-w-[38ch] text-[18px] font-medium leading-[1.4] opacity-80">
						DOWNLOAD LOSSLESS FLAC FROM DEEZER. NO ACCOUNTS. NO STREAMS. JUST FILES ON YOUR DISK.
					</p>

					<div className="mt-10 flex flex-wrap gap-4">
						{FEATURES.map((f) => (
							<div
								key={f}
								className="border-2 border-background bg-transparent px-2.5 py-1.5 font-mono text-[10px] tracking-[0.12em]"
							>
								▸ {f}
							</div>
						))}
					</div>
				</div>

				<div className="relative mt-10 flex justify-between font-mono text-[10px] tracking-[0.1em] opacity-50">
					<span>GITHUB.COM/TITOO-DEV/MUSIC</span>
					<span>APR 2026</span>
				</div>
			</div>

			{/* Right: login form */}
			<div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
				{/* Mobile-only top brand */}
				<div className="mb-8 flex items-center gap-2.5 lg:hidden">
					<div className="size-7 border-2 border-foreground bg-primary" />
					<div className="text-[22px] font-black tracking-[-0.03em]">DEEMIX</div>
				</div>

				<div className="w-full max-w-[480px]">
					<p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						STEP 01 / 01 · CONNECT ACCOUNT
					</p>
					<h2 className="m-0 mb-3.5 text-[40px] font-black leading-none tracking-[-0.03em]">
						LOG IN.
					</h2>
					<p className="mb-9 max-w-[44ch] text-[14px] font-medium leading-[1.5] text-muted-foreground">
						SIGN IN WITH GOOGLE TO SYNC YOUR PLAYLISTS, DOWNLOAD HISTORY, AND PREFERENCES — OR CONTINUE AS A GUEST AND BROWSE WITHOUT AN ACCOUNT.
					</p>

					<Button
						onClick={handleGoogleSignIn}
						disabled={loading}
						size="lg"
						className="h-16 w-full gap-2.5 text-[15px]"
					>
						{loading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<svg className="size-4" viewBox="0 0 24 24">
								<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
								<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
								<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
								<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
							</svg>
						)}
						{loading ? "SIGNING IN…" : "CONTINUE WITH GOOGLE →"}
					</Button>

					{error && (
						<div className="mt-3 border-2 border-destructive bg-destructive/10 px-3 py-2">
							<p className="text-center font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-destructive">
								{error}
							</p>
						</div>
					)}

					<div className="my-5 flex items-center gap-3">
						<div className="h-[2px] flex-1 bg-foreground" />
						<span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
							OR
						</span>
						<div className="h-[2px] flex-1 bg-foreground" />
					</div>

					<Link href="/" className="block no-underline">
						<Button variant="outline" size="lg" className="h-13 w-full">
							CONTINUE AS GUEST
						</Button>
					</Link>

					<div className="mt-10 font-mono text-[10px] leading-[1.6] tracking-[0.08em] text-muted-foreground">
						BY CONTINUING YOU AGREE THIS IS A SELF-HOSTED TOOL. RESPECT ARTIST RIGHTS.
						<br />
						DEEMIX IS NOT AFFILIATED WITH DEEZER S.A.
					</div>
				</div>

				{/* Corner version label */}
				<div className="pointer-events-none absolute bottom-4 right-4 hidden font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
					v0.1.0 · AUTH
				</div>
			</div>
		</div>
	);
}
