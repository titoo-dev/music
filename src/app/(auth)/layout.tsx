export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			{/* Diagonal stripe background for brutalist flair */}
			<div className="fixed inset-0 opacity-[0.03] brutal-stripe pointer-events-none" />
			{children}
		</div>
	);
}
