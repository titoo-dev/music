import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Shared track on deemix";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
	params,
}: {
	params: Promise<{ shareId: string }>;
}) {
	const { shareId } = await params;

	const shared = await prisma.sharedTrack.findUnique({
		where: { shareId },
		select: {
			title: true,
			artist: true,
			album: true,
			coverUrl: true,
			user: { select: { name: true } },
		},
	});

	if (!shared) {
		return new ImageResponse(
			(
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "#F0EBE3",
						fontFamily: "sans-serif",
					}}
				>
					<span style={{ fontSize: 48, fontWeight: 900, color: "#0D0D0D" }}>
						Track not found
					</span>
				</div>
			),
			{ ...size }
		);
	}

	const coverHiRes = shared.coverUrl?.replace(/\/\d+x\d+-/, "/500x500-");

	// Fetch the font
	const fontData = await fetch(
		"https://fonts.gstatic.com/s/spacegrotest/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.ttf"
	).then((res) => res.arrayBuffer());

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					backgroundColor: "#F0EBE3",
					fontFamily: "Space Grotesk",
					position: "relative",
					overflow: "hidden",
				}}
			>
				{/* Decorative stripe pattern top-right */}
				<div
					style={{
						position: "absolute",
						top: 0,
						right: 0,
						width: 300,
						height: 12,
						backgroundColor: "#FF2E00",
						display: "flex",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						width: "100%",
						height: 12,
						backgroundColor: "#0D0D0D",
						display: "flex",
					}}
				/>

				{/* Content */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						width: "100%",
						height: "100%",
						padding: "60px 70px",
						gap: 60,
					}}
				>
					{/* Cover Art */}
					{coverHiRes ? (
						<div
							style={{
								display: "flex",
								position: "relative",
								flexShrink: 0,
							}}
						>
							{/* Shadow */}
							<div
								style={{
									position: "absolute",
									top: 8,
									left: 8,
									width: 380,
									height: 380,
									backgroundColor: "#0D0D0D",
									display: "flex",
								}}
							/>
							{/* Image */}
							<img
								src={coverHiRes}
								width={380}
								height={380}
								style={{
									border: "4px solid #0D0D0D",
									objectFit: "cover",
									position: "relative",
								}}
							/>
						</div>
					) : (
						<div
							style={{
								width: 380,
								height: 380,
								backgroundColor: "#DDD8CF",
								border: "4px solid #0D0D0D",
								boxShadow: "8px 8px 0px #0D0D0D",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<span
								style={{
									fontSize: 120,
									color: "#6B6560",
									fontWeight: 900,
								}}
							>
								?
							</span>
						</div>
					)}

					{/* Track Info */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							flex: 1,
							minWidth: 0,
							gap: 12,
						}}
					>
						{/* Logo */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 12,
								marginBottom: 16,
							}}
						>
							<div
								style={{
									width: 40,
									height: 40,
									backgroundColor: "#FF2E00",
									border: "3px solid #0D0D0D",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "white",
									fontSize: 20,
									fontWeight: 900,
								}}
							>
								D
							</div>
							<span
								style={{
									fontSize: 22,
									fontWeight: 900,
									color: "#0D0D0D",
									letterSpacing: "-0.5px",
									textTransform: "uppercase",
								}}
							>
								deemix
							</span>
						</div>

						{/* Title */}
						<span
							style={{
								fontSize: 52,
								fontWeight: 900,
								color: "#0D0D0D",
								lineHeight: 1.1,
								overflow: "hidden",
								textOverflow: "ellipsis",
								display: "-webkit-box",
								WebkitLineClamp: 2,
								WebkitBoxOrient: "vertical",
							}}
						>
							{shared.title}
						</span>

						{/* Artist */}
						<span
							style={{
								fontSize: 30,
								fontWeight: 700,
								color: "#6B6560",
								textTransform: "uppercase",
								letterSpacing: "1px",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{shared.artist}
						</span>

						{/* Album */}
						{shared.album && (
							<span
								style={{
									fontSize: 22,
									fontWeight: 600,
									color: "#6B6560",
									opacity: 0.7,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{shared.album}
							</span>
						)}

						{/* Shared by */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								marginTop: 20,
								gap: 8,
							}}
						>
							<div
								style={{
									width: 4,
									height: 20,
									backgroundColor: "#FF2E00",
									display: "flex",
								}}
							/>
							<span
								style={{
									fontSize: 18,
									fontWeight: 600,
									color: "#6B6560",
								}}
							>
								Shared by {shared.user.name}
							</span>
						</div>
					</div>
				</div>
			</div>
		),
		{
			...size,
			fonts: [
				{
					name: "Space Grotesk",
					data: fontData,
					style: "normal",
					weight: 700,
				},
			],
		}
	);
}
