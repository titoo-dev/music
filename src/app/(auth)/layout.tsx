/** Outside the main shell (no nav): a fixed night stage for the login backdrop. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return <div className="relative min-h-dvh overflow-x-hidden bg-[#0a0a12]">{children}</div>;
}
