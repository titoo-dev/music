"use client";

import { useEffect, useState } from "react";
import { fetchData, postToServer } from "@/utils/api";
import { useLoginStore } from "@/stores/useLoginStore";
import { qualities } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, LogOut, Save, Check } from "lucide-react";

export default function SettingsPage() {
	const {
		arl,
		setArl,
		loggedIn,
		user,
		setUser,
		setChilds,
		setCurrentChild,
		setLoggedIn,
		logout,
	} = useLoginStore();
	const [arlInput, setArlInput] = useState(arl);
	const [settings, setSettings] = useState<any>(null);
	const [spotifySettings, setSpotifySettings] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [loginStatus, setLoginStatus] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		async function loadSettings() {
			try {
				const data = await fetchData("settings");
				setSettings(data?.settings ?? data);
				setSpotifySettings(data?.spotifySettings ?? null);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		loadSettings();
	}, []);

	const handleLogin = async () => {
		if (!arlInput.trim()) return;
		setLoginStatus("Logging in...");
		try {
			const res = await postToServer("auth/login-arl", {
				arl: arlInput.trim(),
			});
			if (res.user) {
				setArl(arlInput.trim());
				setUser(res.user);
				setChilds(res.childs || []);
				setCurrentChild(res.currentChild || 0);
				setLoggedIn(true);
				setLoginStatus("Logged in!");
			} else {
				setLoginStatus("Login failed. Check your ARL.");
			}
		} catch {
			setLoginStatus("Login error.");
		}
	};

	const handleLogout = async () => {
		await postToServer("auth/logout");
		logout();
		setLoginStatus("");
	};

	const handleSaveSettings = async () => {
		setSaving(true);
		try {
			await postToServer("settings", { settings, spotifySettings });
			setLoginStatus("Settings saved!");
		} catch {
			setLoginStatus("Failed to save settings.");
		}
		setSaving(false);
	};

	const updateSetting = (key: string, value: any) => {
		setSettings((prev: any) => ({ ...prev, [key]: value }));
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Settings
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Manage your account and download preferences.
				</p>
			</div>

			{/* Login Section */}
			<Card>
				<CardHeader>
					<CardTitle>Deezer Account</CardTitle>
					<CardDescription>
						{loggedIn
							? "You are logged in to Deezer."
							: "Enter your ARL token to connect your Deezer account."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loggedIn && user ? (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Avatar size="lg">
									{user.picture ? (
										<AvatarImage
											src={`https://e-cdns-images.dzcdn.net/images/user/${user.picture}/56x56-000000-80-0-0.jpg`}
										/>
									) : (
										<AvatarFallback>
											{user.name?.charAt(0)?.toUpperCase() ||
												"U"}
										</AvatarFallback>
									)}
								</Avatar>
								<div>
									<p className="text-sm font-medium">{user.name}</p>
									<Badge variant="secondary" className="mt-1">
										{user.can_stream_lossless
											? "HiFi"
											: user.can_stream_hq
												? "Premium"
												: "Free"}
									</Badge>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleLogout}
								className="gap-1.5"
							>
								<LogOut className="size-3.5" />
								Log out
							</Button>
						</div>
					) : (
						<div className="space-y-3">
							<label className="text-sm font-medium" htmlFor="arl">
								ARL Token
							</label>
							<div className="flex gap-2">
								<Input
									id="arl"
									type="password"
									value={arlInput}
									onChange={(e) => setArlInput(e.target.value)}
									placeholder="Paste your ARL token here..."
									className="flex-1"
								/>
								<Button onClick={handleLogin}>Log in</Button>
							</div>
							{loginStatus && (
								<p className="text-sm text-muted-foreground">
									{loginStatus}
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Download Settings */}
			{settings && (
				<Card>
					<CardHeader>
						<CardTitle>Download Settings</CardTitle>
						<CardDescription>
							Configure how and where music is downloaded.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="downloadLocation"
							>
								Download location
							</label>
							<Input
								id="downloadLocation"
								type="text"
								value={settings.downloadLocation || ""}
								onChange={(e) =>
									updateSetting("downloadLocation", e.target.value)
								}
							/>
						</div>

						<Separator />

						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="maxBitrate"
							>
								Max bitrate
							</label>
							<select
								id="maxBitrate"
								value={settings.maxBitrate || 1}
								onChange={(e) =>
									updateSetting(
										"maxBitrate",
										parseInt(e.target.value)
									)
								}
								className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
							>
								{qualities.map((q) => (
									<option key={q.value} value={q.value}>
										{q.label}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="concurrency"
							>
								Concurrent downloads
							</label>
							<Input
								id="concurrency"
								type="number"
								min={1}
								max={50}
								value={settings.queueConcurrency || 10}
								onChange={(e) =>
									updateSetting(
										"queueConcurrency",
										parseInt(e.target.value)
									)
								}
								className="max-w-[120px]"
							/>
						</div>

						<Separator />

						<div className="space-y-3">
							<div className="flex items-center gap-2.5">
								<input
									type="checkbox"
									id="fallbackBitrate"
									checked={settings.fallbackBitrate || false}
									onChange={(e) =>
										updateSetting(
											"fallbackBitrate",
											e.target.checked
										)
									}
									className="size-4 rounded border-border accent-primary"
								/>
								<label
									htmlFor="fallbackBitrate"
									className="text-sm cursor-pointer"
								>
									Fallback to lower bitrate
								</label>
							</div>

							<div className="flex items-center gap-2.5">
								<input
									type="checkbox"
									id="fallbackSearch"
									checked={settings.fallbackSearch || false}
									onChange={(e) =>
										updateSetting(
											"fallbackSearch",
											e.target.checked
										)
									}
									className="size-4 rounded border-border accent-primary"
								/>
								<label
									htmlFor="fallbackSearch"
									className="text-sm cursor-pointer"
								>
									Search fallback
								</label>
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="tracknameTemplate"
							>
								Track name template
							</label>
							<Input
								id="tracknameTemplate"
								type="text"
								value={settings.tracknameTemplate || ""}
								onChange={(e) =>
									updateSetting(
										"tracknameTemplate",
										e.target.value
									)
								}
							/>
						</div>

						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="albumNameTemplate"
							>
								Album name template
							</label>
							<Input
								id="albumNameTemplate"
								type="text"
								value={settings.albumNameTemplate || ""}
								onChange={(e) =>
									updateSetting(
										"albumNameTemplate",
										e.target.value
									)
								}
							/>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Spotify Settings */}
			{spotifySettings && (
				<Card>
					<CardHeader>
						<CardTitle>Spotify Integration</CardTitle>
						<CardDescription>
							Connect Spotify to convert Spotify links to Deezer
							downloads.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="clientId"
							>
								Client ID
							</label>
							<Input
								id="clientId"
								type="text"
								value={spotifySettings.clientId || ""}
								onChange={(e) =>
									setSpotifySettings({
										...spotifySettings,
										clientId: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="clientSecret"
							>
								Client Secret
							</label>
							<Input
								id="clientSecret"
								type="password"
								value={spotifySettings.clientSecret || ""}
								onChange={(e) =>
									setSpotifySettings({
										...spotifySettings,
										clientSecret: e.target.value,
									})
								}
							/>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Save Button */}
			<div className="flex items-center gap-3 pb-8">
				<Button onClick={handleSaveSettings} disabled={saving} className="gap-1.5">
					{saving ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Save className="size-4" />
					)}
					Save Settings
				</Button>
				{loginStatus && !saving && (
					<span className="text-sm text-muted-foreground flex items-center gap-1.5">
						{loginStatus.includes("saved") && (
							<Check className="size-3.5 text-green-600" />
						)}
						{loginStatus}
					</span>
				)}
			</div>
		</div>
	);
}
