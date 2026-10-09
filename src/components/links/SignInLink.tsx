"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLoginHref } from "@/hooks/useLoginHref";

/** A link to the sign-in page that comes back to the current page afterwards. */
export function SignInLink({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<Link href={useLoginHref()} className={className}>
			{children}
		</Link>
	);
}
