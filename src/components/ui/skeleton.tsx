function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`animate-pulse bg-muted border-2 border-foreground/10 ${className}`}
			{...props}
		/>
	);
}

export { Skeleton };
