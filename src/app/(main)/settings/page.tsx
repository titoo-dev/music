"use client";

import { useEffect, useState } from "react";
import { fetchData, postToServer } from "@/utils/api";
import { useLoginStore } from "@/stores/useLoginStore";
import { qualities } from "@/utils/helpers";

export default function SettingsPage() {
	const { arl, setArl, loggedIn, user, setUser, setChilds, setCurrentChild, setLoggedIn, logout } =
		useLoginStore();
	const [arlInput, setArlInput] = useState(arl);
	const [settings, setSettings] = useState<any>(null);
	const [spotifySettings, setSpotifySettings] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [loginStatus, setLoginStatus] = useState("");

	useEffect(() => {
		async function loadSettings() {
			try {
				const data = await fetchData("settings");
				setSettings(data.settings);
				setSpotifySettings(data.spotifySettings);
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
			const res = await postToServer("login-arl", { arl: arlInput.trim() });
			if (res.status === 1 || res.status === 3) {
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
		await postToServer("logout");
		logout();
		setLoginStatus("");
	};

	const handleSaveSettings = async () => {
		try {
			await postToServer("settings", { settings, spotifySettings });
			setLoginStatus("Settings saved!");
		} catch {
			setLoginStatus("Failed to save settings.");
		}
	};

	const updateSetting = (key: string, value: any) => {
		setSettings((prev: any) => ({ ...prev, [key]: value }));
	};

	if (loading) {
		return <div style={{ color: "var(--text-muted)" }}>Loading settings...</div>;
	}

	return (
		<div className="max-w-2xl">
			<h1 className="text-2xl font-bold mb-6">Settings</h1>

			{/* Login Section */}
			<section className="card mb-6">
				<h2 className="text-lg font-semibold mb-4">Deezer Account</h2>
				{loggedIn && user ? (
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							{user.picture ? (
								<img
									src={`https://e-cdns-images.dzcdn.net/images/user/${user.picture}/56x56-000000-80-0-0.jpg`}
									alt=""
									className="w-10 h-10 rounded-full"
								/>
							) : (
								<div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
									👤
								</div>
							)}
							<div>
								<div className="font-medium">{user.name}</div>
								<div className="text-xs" style={{ color: "var(--text-secondary)" }}>
									{user.can_stream_lossless ? "HiFi" : user.can_stream_hq ? "Premium" : "Free"}
								</div>
							</div>
						</div>
						<button onClick={handleLogout} className="btn btn-secondary text-sm">
							Logout
						</button>
					</div>
				) : (
					<div>
						<label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
							ARL Token
						</label>
						<div className="flex gap-2">
							<input
								type="password"
								value={arlInput}
								onChange={(e) => setArlInput(e.target.value)}
								placeholder="Paste your ARL token here..."
								className="input flex-1"
							/>
							<button onClick={handleLogin} className="btn btn-primary">
								Login
							</button>
						</div>
						{loginStatus && (
							<p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
								{loginStatus}
							</p>
						)}
					</div>
				)}
			</section>

			{/* Download Settings */}
			{settings && (
				<section className="card mb-6">
					<h2 className="text-lg font-semibold mb-4">Download Settings</h2>

					<div className="space-y-4">
						<div>
							<label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
								Download Location
							</label>
							<input
								type="text"
								value={settings.downloadLocation || ""}
								onChange={(e) => updateSetting("downloadLocation", e.target.value)}
								className="input"
							/>
						</div>

						<div>
							<label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
								Max Bitrate
							</label>
							<select
								value={settings.maxBitrate || 1}
								onChange={(e) => updateSetting("maxBitrate", parseInt(e.target.value))}
								className="input"
							>
								{qualities.map((q) => (
									<option key={q.value} value={q.value}>
										{q.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
								Concurrent Downloads
							</label>
							<input
								type="number"
								min={1}
								max={50}
								value={settings.queueConcurrency || 10}
								onChange={(e) => updateSetting("queueConcurrency", parseInt(e.target.value))}
								className="input"
								style={{ maxWidth: "100px" }}
							/>
						</div>

						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="fallbackBitrate"
								checked={settings.fallbackBitrate || false}
								onChange={(e) => updateSetting("fallbackBitrate", e.target.checked)}
							/>
							<label htmlFor="fallbackBitrate" className="text-sm">
								Fallback to lower bitrate
							</label>
						</div>

						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="fallbackSearch"
								checked={settings.fallbackSearch || false}
								onChange={(e) => updateSetting("fallbackSearch", e.target.checked)}
							/>
							<label htmlFor="fallbackSearch" className="text-sm">
								Search fallback
							</label>
						</div>

						<div>
							<label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
								Track Name Template
							</label>
							<input
								type="text"
								value={settings.tracknameTemplate || ""}
								onChange={(e) => updateSetting("tracknameTemplate", e.target.value)}
								className="input"
							/>
						</div>

						<div>
							<label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
								Album Name Template
							</label>
							<input
								type="text"
								value={settings.albumNameTemplate || ""}
								onChange={(e) => updateSetting("albumNameTemplate", e.target.value)}
								className="input"
							/>
						</div>
					</div>
				</section>
			)}

			{/* Spotify Settings */}
			{spotifySettings && (
				<section className="card mb-6">
					<h2 className="text-lg font-semibold mb-4">Spotify Integration</h2>
					<div className="space-y-4">
						<div>
							<label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
								Client ID
							</label>
							<input
								type="text"
								value={spotifySettings.clientId || ""}
								onChange={(e) => setSpotifySettings({ ...spotifySettings, clientId: e.target.value })}
								className="input"
							/>
						</div>
						<div>
							<label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
								Client Secret
							</label>
							<input
								type="password"
								value={spotifySettings.clientSecret || ""}
								onChange={(e) => setSpotifySettings({ ...spotifySettings, clientSecret: e.target.value })}
								className="input"
							/>
						</div>
					</div>
				</section>
			)}

			<button onClick={handleSaveSettings} className="btn btn-primary">
				Save Settings
			</button>
			{loginStatus && (
				<span className="ml-3 text-sm" style={{ color: "var(--text-secondary)" }}>
					{loginStatus}
				</span>
			)}
		</div>
	);
}
