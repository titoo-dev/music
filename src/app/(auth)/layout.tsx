export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 overflow-hidden">
			{/* Diagonal brutalist stripes */}
			<div className="fixed inset-0 opacity-[0.05] brutal-stripe pointer-events-none" />
			{/* Corner labels */}
			<div className="fixed top-4 left-4 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground hidden sm:block pointer-events-none">
				DEEMIX · NEXT
			</div>
			<div className="fixed bottom-4 right-4 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground hidden sm:block pointer-events-none">
				v0.1.0 · AUTH
			</div>
			{children}
		</div>
	);
}
