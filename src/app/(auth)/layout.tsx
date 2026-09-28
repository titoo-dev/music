export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-dvh overflow-hidden bg-background">
			<div aria-hidden className="pointer-events-none absolute inset-0 bg-grid" />
			<div className="relative">{children}</div>
		</div>
	);
}
