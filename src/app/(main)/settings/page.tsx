"use client";

import { useEffect, useState } from "react";
import { fetchData, postToServer } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { qualities } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from "@/components/ui/collapsible";
import { Loader2, LogOut, Save, Check } from "lucide-react";

const overwriteOptions = [
	{ value: "y", label: "Overwrite" },
	{ value: "n", label: "Don't overwrite" },
	{ value: "e", label: "Don't check extension" },
	{ value: "b", label: "Keep both" },
	{ value: "t", label: "Overwrite tags only" },
	{ value: "l", label: "Overwrite lower bitrates only" },
];

const featuredOptions = [
	{ value: "0", label: "No change" },
	{ value: "1", label: "Remove from title" },
	{ value: "2", label: "Move to title" },
	{ value: "3", label: "Remove from title & album" },
];

const casingOptions = [
	{ value: "nothing", label: "No change" },
	{ value: "lower", label: "lowercase" },
	{ value: "upper", label: "UPPERCASE" },
	{ value: "start", label: "Start Case" },
	{ value: "sentence", label: "Sentence case" },
];

const multiArtistOptions = [
	{ value: "default", label: "Default" },
	{ value: "andFeat", label: "& / feat." },
	{ value: "nothing", label: "Nothing (single string)" },
];

const artworkSizes = [
	{ value: 56, label: "56px" },
	{ value: 264, label: "264px" },
	{ value: 500, label: "500px" },
	{ value: 800, label: "800px" },
	{ value: 1000, label: "1000px" },
	{ value: 1200, label: "1200px" },
	{ value: 1400, label: "1400px" },
	{ value: 1800, label: "1800px" },
];

const localArtworkFormatOptions = [
	{ value: "jpg", label: "JPG" },
	{ value: "png", label: "PNG" },
	{ value: "jpg,png", label: "Both (JPG + PNG)" },
];

function Hint({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-xs text-muted-foreground mt-1">{children}</p>
	);
}

function SettingRow({
	label,
	description,
	children,
}: {
	label: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="space-y-0.5 flex-1">
				<Label className="text-sm font-bold">{label}</Label>
				{description && (
					<p className="text-xs text-muted-foreground">{description}</p>
				)}
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}

function TagCheckbox({
	label,
	checked,
	onCheckedChange,
}: {
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<label className="flex items-center gap-2 cursor-pointer">
			<Checkbox checked={checked} onCheckedChange={onCheckedChange} />
			<span className="text-sm">{label}</span>
		</label>
	);
}

export default function SettingsPage() {
	const {
		isAuthenticated,
		isDeezerConnected,
		deezerUser,
		setDeezerUser,
		setChilds,
		setCurrentChild,
	} = useAuthStore();
	const [arlInput, setArlInput] = useState("");
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

	const handleDeezerConnect = async () => {
		if (!arlInput.trim()) return;
		setLoginStatus("Connecting to Deezer...");
		try {
			const res = await postToServer("auth/login-arl", {
				arl: arlInput.trim(),
			});
			if (res.user) {
				setDeezerUser(res.user);
				setChilds(res.childs || []);
				setCurrentChild(res.currentChild || 0);
				setLoginStatus("Connected to Deezer!");
				setArlInput("");
			} else {
				setLoginStatus("Connection failed. Check your ARL.");
			}
		} catch {
			setLoginStatus("Connection error.");
		}
	};

	const handleDeezerDisconnect = async () => {
		await postToServer("auth/logout");
		setDeezerUser(null);
		setLoginStatus("");
	};

	const handleSaveSettings = async () => {
		setSaving(true);
		try {
			await postToServer("settings", { settings, spotifySettings });
			// Re-fetch to confirm settings were persisted
			const data = await fetchData("settings");
			setSettings(data?.settings ?? data);
			setSpotifySettings(data?.spotifySettings ?? null);
			setLoginStatus("Settings saved!");
		} catch (e) {
			console.error("Failed to save settings:", e);
			setLoginStatus("Failed to save settings.");
		}
		setSaving(false);
	};

	const updateSetting = (key: string, value: any) => {
		setSettings((prev: any) => ({ ...prev, [key]: value }));
	};

	const updateTag = (key: string, value: any) => {
		setSettings((prev: any) => ({
			...prev,
			tags: { ...prev.tags, [key]: value },
		}));
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
				<h1 className="text-brutal-lg">
					Settings
				</h1>
				<p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-bold">
					Manage your account and download preferences.
				</p>
			</div>

			{/* Login Section */}
			<Card>
				<CardHeader>
					<CardTitle>Deezer Account</CardTitle>
					<CardDescription>
						{isDeezerConnected
							? "Your Deezer account is connected."
							: "Enter your ARL token to connect your Deezer account. You need this to download music."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isDeezerConnected && deezerUser ? (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Avatar size="lg" className="border-[2px] border-foreground">
									{deezerUser.picture ? (
										<AvatarImage
											src={`https://e-cdns-images.dzcdn.net/images/user/${deezerUser.picture}/56x56-000000-80-0-0.jpg`}
										/>
									) : (
										<AvatarFallback>
											{deezerUser.name?.charAt(0)?.toUpperCase() ||
												"U"}
										</AvatarFallback>
									)}
								</Avatar>
								<div>
									<p className="text-sm font-bold">{deezerUser.name}</p>
									<Badge variant="secondary" className="mt-1">
										{deezerUser.can_stream_lossless
											? "HiFi"
											: deezerUser.can_stream_hq
												? "Premium"
												: "Free"}
									</Badge>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleDeezerDisconnect}
								className="gap-1.5"
							>
								<LogOut className="size-3.5" />
								Disconnect
							</Button>
						</div>
					) : (
						<div className="space-y-3">
							<Label htmlFor="arl">ARL Token</Label>
							<div className="flex gap-2">
								<Input
									id="arl"
									type="password"
									value={arlInput}
									onChange={(e) => setArlInput(e.target.value)}
									placeholder="Paste your ARL token here..."
									className="flex-1"
								/>
								<Button onClick={handleDeezerConnect}>Connect</Button>
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

			{settings && (
				<>
					{/* Download Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Download Settings</CardTitle>
							<CardDescription>
								Configure how and where music is downloaded.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="downloadLocation">
									Download location
								</Label>
								<Input
									id="downloadLocation"
									type="text"
									value={settings.downloadLocation || ""}
									onChange={(e) =>
										updateSetting("downloadLocation", e.target.value)
									}
								/>
								<Hint>The folder on your computer where all your downloaded music will be saved. Example: C:\Users\Music or /home/user/Music</Hint>
							</div>

							<Separator />

							<div className="space-y-2">
								<Label>Max bitrate</Label>
								<Select
									value={String(settings.maxBitrate || 1)}
									onValueChange={(value) =>
										updateSetting("maxBitrate", parseInt(value as string))
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{qualities.map((q) => (
											<SelectItem key={q.value} value={String(q.value)}>
												{q.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Hint>The audio quality of your downloads. FLAC is lossless (best quality, bigger files), MP3 320 is high quality, MP3 128 is smaller but lower quality. Higher qualities require a Deezer Premium or HiFi subscription.</Hint>
							</div>

							<div className="space-y-2">
								<Label htmlFor="concurrency">
									Concurrent downloads
								</Label>
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
								<Hint>How many tracks download at the same time. A higher number is faster but uses more bandwidth. If you have a slow connection, lower this value.</Hint>
							</div>

							<Separator />

							<div className="space-y-2">
								<Label>Overwrite existing files</Label>
								<Select
									value={settings.overwriteFile || "n"}
									onValueChange={(value) =>
										updateSetting("overwriteFile", value)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{overwriteOptions.map((o) => (
											<SelectItem key={o.value} value={o.value}>
												{o.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Hint>What happens when you download a song that already exists in your library. "Don't overwrite" skips it, "Overwrite" replaces it, "Keep both" saves a second copy, "Tags only" updates the metadata without re-downloading the audio, "Lower bitrates only" replaces only if the new version is better quality.</Hint>
							</div>

							<Separator />

							<div className="space-y-4">
								<SettingRow label="Fallback to lower bitrate" description="If a track isn't available in your chosen quality (e.g. FLAC), it will automatically try a lower quality (e.g. MP3 320) instead of skipping it entirely.">
									<Switch
										checked={settings.fallbackBitrate || false}
										onCheckedChange={(checked) =>
											updateSetting("fallbackBitrate", checked)
										}
									/>
								</SettingRow>

								<SettingRow label="Fallback ISRC search" description="If a track can't be found, search for the same song in other albums using its international code (ISRC). Useful when a track is removed from one album but still exists on another.">
									<Switch
										checked={settings.fallbackISRC || false}
										onCheckedChange={(checked) =>
											updateSetting("fallbackISRC", checked)
										}
									/>
								</SettingRow>

								<SettingRow label="Search fallback" description="As a last resort, search Deezer by artist name and song title to find an alternative version of the track. This may find a different recording or remix.">
									<Switch
										checked={settings.fallbackSearch || false}
										onCheckedChange={(checked) =>
											updateSetting("fallbackSearch", checked)
										}
									/>
								</SettingRow>
							</div>
						</CardContent>
					</Card>

					{/* Lyrics */}
					<Card>
						<CardHeader>
							<CardTitle>Lyrics</CardTitle>
							<CardDescription>
								Control how song lyrics are saved with your music.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<SettingRow label="Save synced lyrics (.lrc)" description="Creates a separate .lrc file next to each song with time-stamped lyrics. Most music players (like foobar2000, MusicBee, or your phone) can read this file to show lyrics that scroll in sync with the music, karaoke-style.">
								<Switch
									checked={settings.syncedLyrics || false}
									onCheckedChange={(checked) =>
										updateSetting("syncedLyrics", checked)
									}
								/>
							</SettingRow>

							<SettingRow label="Embed lyrics in tags" description="Stores the full song lyrics directly inside the audio file's metadata. This way the lyrics travel with the file and show up in players that support embedded lyrics, without needing a separate file.">
								<Switch
									checked={settings.tags?.lyrics || false}
									onCheckedChange={(checked) => updateTag("lyrics", checked)}
								/>
							</SettingRow>

							<SettingRow label="Embed synced lyrics in tags" description="Stores time-stamped lyrics directly inside the audio file (MP3 only, using the SYLT tag). Some advanced players can read this to show synced lyrics without a separate .lrc file. Not all players support this format.">
								<Switch
									checked={settings.tags?.syncedLyrics || false}
									onCheckedChange={(checked) => updateTag("syncedLyrics", checked)}
								/>
							</SettingRow>
						</CardContent>
					</Card>

					{/* Artwork / Covers */}
					<Card>
						<CardHeader>
							<CardTitle>Artwork</CardTitle>
							<CardDescription>
								Manage how album covers and artist images are saved.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<SettingRow label="Save album artwork" description="Downloads the album cover as a separate image file (e.g. cover.jpg) in the album folder. Useful for music players that display folder artwork, or if you want to keep a high-res copy of the cover.">
								<Switch
									checked={settings.saveArtwork ?? true}
									onCheckedChange={(checked) =>
										updateSetting("saveArtwork", checked)
									}
								/>
							</SettingRow>

							<SettingRow label="Save artist artwork" description="Downloads the artist's profile picture as a separate image file in the artist folder. Handy for music libraries like Plex or Jellyfin that display artist photos.">
								<Switch
									checked={settings.saveArtworkArtist || false}
									onCheckedChange={(checked) =>
										updateSetting("saveArtworkArtist", checked)
									}
								/>
							</SettingRow>

							<Separator />

							<div className="space-y-2">
								<Label>Cover image filename template</Label>
								<Input
									type="text"
									value={settings.coverImageTemplate || "cover"}
									onChange={(e) =>
										updateSetting("coverImageTemplate", e.target.value)
									}
								/>
								<Hint>The filename for the saved album cover image (without extension). Default is "cover", which creates "cover.jpg". Many music players look for "cover" or "folder" automatically.</Hint>
							</div>

							<div className="space-y-2">
								<Label>Artist image filename template</Label>
								<Input
									type="text"
									value={settings.artistImageTemplate || "folder"}
									onChange={(e) =>
										updateSetting("artistImageTemplate", e.target.value)
									}
								/>
								<Hint>The filename for the saved artist image (without extension). Default is "folder". Some media servers like Plex expect "folder.jpg" in the artist directory.</Hint>
							</div>

							<Separator />

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Embedded artwork size</Label>
									<Select
										value={String(settings.embeddedArtworkSize || 800)}
										onValueChange={(value) =>
											updateSetting("embeddedArtworkSize", parseInt(value as string))
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{artworkSizes.map((s) => (
												<SelectItem key={s.value} value={String(s.value)}>
													{s.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Hint>The cover art size embedded inside the audio file itself. Bigger = better quality but larger file size. 800px is a good balance.</Hint>
								</div>

								<div className="space-y-2">
									<Label>Local artwork size</Label>
									<Select
										value={String(settings.localArtworkSize || 1200)}
										onValueChange={(value) =>
											updateSetting("localArtworkSize", parseInt(value as string))
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{artworkSizes.map((s) => (
												<SelectItem key={s.value} value={String(s.value)}>
													{s.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Hint>The size of the separate cover image file saved in the folder. Can be bigger than the embedded one since it doesn't increase the audio file size.</Hint>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Local artwork format</Label>
									<Select
										value={settings.localArtworkFormat || "jpg"}
										onValueChange={(value) =>
											updateSetting("localArtworkFormat", value)
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{localArtworkFormatOptions.map((f) => (
												<SelectItem key={f.value} value={f.value}>
													{f.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Hint>JPG is smaller, PNG is lossless (no compression artifacts). "Both" saves two copies for maximum compatibility.</Hint>
								</div>

								<div className="space-y-2">
									<Label>JPEG quality</Label>
									<Input
										type="number"
										min={1}
										max={100}
										value={settings.jpegImageQuality ?? 90}
										onChange={(e) =>
											updateSetting("jpegImageQuality", parseInt(e.target.value))
										}
										className="max-w-[120px]"
									/>
									<Hint>1 = very compressed (smallest file, worst quality), 100 = almost no compression (biggest file, best quality). 90 is a good default.</Hint>
								</div>
							</div>

							<SettingRow label="Use PNG for embedded artwork" description="Embed cover art as PNG instead of JPEG inside the audio file. PNG is lossless but makes files significantly larger. Only recommended if image quality is a priority.">
								<Switch
									checked={settings.embeddedArtworkPNG || false}
									onCheckedChange={(checked) =>
										updateSetting("embeddedArtworkPNG", checked)
									}
								/>
							</SettingRow>
						</CardContent>
					</Card>

					{/* Folder Structure */}
					<Card>
						<CardHeader>
							<CardTitle>Folder Structure</CardTitle>
							<CardDescription>
								Choose how your downloaded music is organized into folders. This determines the hierarchy of folders created in your download location.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<SettingRow label="Create artist folder" description="Creates a folder with the artist's name. Your music will be sorted like: Music/Artist Name/Album Name/track.mp3. Without this, all albums go directly in the download folder.">
								<Switch
									checked={settings.createArtistFolder || false}
									onCheckedChange={(checked) =>
										updateSetting("createArtistFolder", checked)
									}
								/>
							</SettingRow>
							{settings.createArtistFolder && (
								<div className="space-y-2 pl-4 border-l-2 border-muted">
									<Label>Artist folder template</Label>
									<Input
										type="text"
										value={settings.artistNameTemplate || "%artist%"}
										onChange={(e) =>
											updateSetting("artistNameTemplate", e.target.value)
										}
									/>
									<Hint>Customize the artist folder name. Use %artist% for the artist name, %artist_id% for their Deezer ID. Default: "%artist%" creates "Daft Punk/".</Hint>
								</div>
							)}

							<SettingRow label="Create album folder" description="Creates a folder for each album. Your tracks will be organized inside album folders instead of being loose files. Recommended to keep your library tidy.">
								<Switch
									checked={settings.createAlbumFolder ?? true}
									onCheckedChange={(checked) =>
										updateSetting("createAlbumFolder", checked)
									}
								/>
							</SettingRow>
							{(settings.createAlbumFolder ?? true) && (
								<div className="space-y-2 pl-4 border-l-2 border-muted">
									<Label>Album folder template</Label>
									<Input
										type="text"
										value={settings.albumNameTemplate || "%artist% - %album%"}
										onChange={(e) =>
											updateSetting("albumNameTemplate", e.target.value)
										}
									/>
									<Hint>Customize the album folder name. Example: "%artist% - %album%" creates "Daft Punk - Discovery/". Available: %album%, %album_id%, %artist%, %genre%, %year%, %date%, %type%, %label%, %bitrate%.</Hint>
								</div>
							)}

							<SettingRow label="Create CD subfolder" description="For albums with multiple discs (like a double album), creates separate subfolders for each disc (CD1/, CD2/, etc.). Useful if your music player supports multi-disc albums.">
								<Switch
									checked={settings.createCDFolder ?? true}
									onCheckedChange={(checked) =>
										updateSetting("createCDFolder", checked)
									}
								/>
							</SettingRow>

							<SettingRow label="Create playlist folder" description="When you download a playlist, puts all its tracks inside a dedicated folder with the playlist name instead of scattering them in your download folder.">
								<Switch
									checked={settings.createPlaylistFolder ?? true}
									onCheckedChange={(checked) =>
										updateSetting("createPlaylistFolder", checked)
									}
								/>
							</SettingRow>
							{(settings.createPlaylistFolder ?? true) && (
								<div className="space-y-2 pl-4 border-l-2 border-muted">
									<Label>Playlist folder template</Label>
									<Input
										type="text"
										value={settings.playlistNameTemplate || "%playlist%"}
										onChange={(e) =>
											updateSetting("playlistNameTemplate", e.target.value)
										}
									/>
									<Hint>Customize the playlist folder name. Use %playlist% for the playlist name, %owner% for the creator's name. Default creates "My Playlist/".</Hint>
								</div>
							)}

							<SettingRow label="Apply folder structure for playlists" description="When downloading a playlist, also creates artist and album subfolders inside the playlist folder. Without this, all playlist tracks are saved flat in one folder.">
								<Switch
									checked={settings.createStructurePlaylist || false}
									onCheckedChange={(checked) =>
										updateSetting("createStructurePlaylist", checked)
									}
								/>
							</SettingRow>

							<SettingRow label="Create folder for single tracks" description="When downloading a single track (not from an album or playlist), creates its own artist/album folder structure. Without this, single tracks are saved directly in the download folder.">
								<Switch
									checked={settings.createSingleFolder || false}
									onCheckedChange={(checked) =>
										updateSetting("createSingleFolder", checked)
									}
								/>
							</SettingRow>
						</CardContent>
					</Card>

					{/* File Templates */}
					<Card>
						<CardHeader>
							<CardTitle>File Templates</CardTitle>
							<CardDescription>
								Control how downloaded files are named. Use variables like %artist% and %title% that get replaced with the actual track info.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Track name template</Label>
								<Input
									type="text"
									value={settings.tracknameTemplate || ""}
									onChange={(e) =>
										updateSetting("tracknameTemplate", e.target.value)
									}
								/>
								<Hint>How individual tracks are named. Default "%artist% - %title%" creates files like "Daft Punk - One More Time.mp3".</Hint>
							</div>

							<div className="space-y-2">
								<Label>Album track name template</Label>
								<Input
									type="text"
									value={settings.albumTracknameTemplate || ""}
									onChange={(e) =>
										updateSetting("albumTracknameTemplate", e.target.value)
									}
								/>
								<Hint>How tracks inside albums are named. Default "%tracknumber% - %title%" creates "01 - One More Time.mp3". The artist is usually in the folder name already, so it's omitted here.</Hint>
							</div>

							<div className="space-y-2">
								<Label>Playlist track name template</Label>
								<Input
									type="text"
									value={settings.playlistTracknameTemplate || ""}
									onChange={(e) =>
										updateSetting("playlistTracknameTemplate", e.target.value)
									}
								/>
								<Hint>How tracks inside playlists are named. Since playlists have multiple artists, including %artist% is recommended (e.g. "%artist% - %title%").</Hint>
							</div>

							<Hint>Available variables for track names: %title%, %artist%, %artists%, %album%, %albumartist%, %tracknumber%, %tracktotal%, %discnumber%, %genre%, %year%, %date%, %bpm%, %label%, %isrc%, %explicit%, %track_id%, %album_id%</Hint>

							<Separator />

							<div className="space-y-2">
								<Label>Playlist filename template</Label>
								<Input
									type="text"
									value={settings.playlistFilenameTemplate || "playlist"}
									onChange={(e) =>
										updateSetting("playlistFilenameTemplate", e.target.value)
									}
								/>
								<Hint>The name for generated .m3u8 playlist files (if M3U8 creation is enabled below). Default "playlist" creates "playlist.m3u8". Variables: %title%, %artist%, %size%, %type%, %id%, %bitrate%.</Hint>
							</div>
						</CardContent>
					</Card>

					{/* File Naming */}
					<Card>
						<CardHeader>
							<CardTitle>File Naming</CardTitle>
							<CardDescription>
								Fine-tune how track numbers and special characters are handled in filenames.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<SettingRow label="Pad track numbers" description="Adds leading zeros to track numbers so they sort correctly in file managers. For example, track 1 of 12 becomes '01' instead of '1'. This ensures tracks display in the right order.">
								<Switch
									checked={settings.padTracks ?? true}
									onCheckedChange={(checked) =>
										updateSetting("padTracks", checked)
									}
								/>
							</SettingRow>

							<SettingRow label="Pad single digits" description="Also pads track numbers on short albums (fewer than 10 tracks). For example, track 3 of 8 becomes '03'. Turn this off if you only want padding on longer albums.">
								<Switch
									checked={settings.padSingleDigit ?? true}
									onCheckedChange={(checked) =>
										updateSetting("padSingleDigit", checked)
									}
								/>
							</SettingRow>

							<div className="space-y-2">
								<Label>Padding size</Label>
								<Input
									type="number"
									min={0}
									max={10}
									value={settings.paddingSize ?? 0}
									onChange={(e) =>
										updateSetting("paddingSize", parseInt(e.target.value))
									}
									className="max-w-[120px]"
								/>
								<Hint>Set to 0 for automatic padding (recommended). When set to 0, an album with 12 tracks pads to 2 digits (01-12), and an album with 120 tracks pads to 3 digits (001-120). Set a fixed number to always use that many digits.</Hint>
							</div>

							<div className="space-y-2">
								<Label>Illegal character replacer</Label>
								<Input
									type="text"
									value={settings.illegalCharacterReplacer ?? "_"}
									onChange={(e) =>
										updateSetting("illegalCharacterReplacer", e.target.value)
									}
									className="max-w-[120px]"
								/>
								<Hint>Some characters like / \ : * ? are not allowed in file names. This character replaces them. Default "_" turns "What?" into "What_". Leave empty to simply remove them.</Hint>
							</div>
						</CardContent>
					</Card>

					{/* Metadata Tags */}
					<Card>
						<CardHeader>
							<CardTitle>Metadata Tags</CardTitle>
							<CardDescription>
								Tags are information stored inside each audio file (like title, artist, album art). Your music player reads these to display track info. Check the tags you want to include.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
								<TagCheckbox label="Title" checked={settings.tags?.title ?? true} onCheckedChange={(c) => updateTag("title", c)} />
								<TagCheckbox label="Artist" checked={settings.tags?.artist ?? true} onCheckedChange={(c) => updateTag("artist", c)} />
								<TagCheckbox label="Artists" checked={settings.tags?.artists ?? true} onCheckedChange={(c) => updateTag("artists", c)} />
								<TagCheckbox label="Album" checked={settings.tags?.album ?? true} onCheckedChange={(c) => updateTag("album", c)} />
								<TagCheckbox label="Cover" checked={settings.tags?.cover ?? true} onCheckedChange={(c) => updateTag("cover", c)} />
								<TagCheckbox label="Track number" checked={settings.tags?.trackNumber ?? true} onCheckedChange={(c) => updateTag("trackNumber", c)} />
								<TagCheckbox label="Track total" checked={settings.tags?.trackTotal ?? false} onCheckedChange={(c) => updateTag("trackTotal", c)} />
								<TagCheckbox label="Disc number" checked={settings.tags?.discNumber ?? true} onCheckedChange={(c) => updateTag("discNumber", c)} />
								<TagCheckbox label="Disc total" checked={settings.tags?.discTotal ?? false} onCheckedChange={(c) => updateTag("discTotal", c)} />
								<TagCheckbox label="Album artist" checked={settings.tags?.albumArtist ?? true} onCheckedChange={(c) => updateTag("albumArtist", c)} />
								<TagCheckbox label="Genre" checked={settings.tags?.genre ?? true} onCheckedChange={(c) => updateTag("genre", c)} />
								<TagCheckbox label="Year" checked={settings.tags?.year ?? true} onCheckedChange={(c) => updateTag("year", c)} />
								<TagCheckbox label="Date" checked={settings.tags?.date ?? true} onCheckedChange={(c) => updateTag("date", c)} />
								<TagCheckbox label="Explicit" checked={settings.tags?.explicit ?? false} onCheckedChange={(c) => updateTag("explicit", c)} />
								<TagCheckbox label="ISRC" checked={settings.tags?.isrc ?? true} onCheckedChange={(c) => updateTag("isrc", c)} />
								<TagCheckbox label="Length" checked={settings.tags?.length ?? true} onCheckedChange={(c) => updateTag("length", c)} />
								<TagCheckbox label="Barcode" checked={settings.tags?.barcode ?? true} onCheckedChange={(c) => updateTag("barcode", c)} />
								<TagCheckbox label="BPM" checked={settings.tags?.bpm ?? true} onCheckedChange={(c) => updateTag("bpm", c)} />
								<TagCheckbox label="Replay gain" checked={settings.tags?.replayGain ?? false} onCheckedChange={(c) => updateTag("replayGain", c)} />
								<TagCheckbox label="Label" checked={settings.tags?.label ?? true} onCheckedChange={(c) => updateTag("label", c)} />
								<TagCheckbox label="Copyright" checked={settings.tags?.copyright ?? false} onCheckedChange={(c) => updateTag("copyright", c)} />
								<TagCheckbox label="Composer" checked={settings.tags?.composer ?? false} onCheckedChange={(c) => updateTag("composer", c)} />
								<TagCheckbox label="Involved people" checked={settings.tags?.involvedPeople ?? false} onCheckedChange={(c) => updateTag("involvedPeople", c)} />
								<TagCheckbox label="Source" checked={settings.tags?.source ?? false} onCheckedChange={(c) => updateTag("source", c)} />
								<TagCheckbox label="Rating" checked={settings.tags?.rating ?? false} onCheckedChange={(c) => updateTag("rating", c)} />
							</div>
							<Hint>Each checked tag will be written into your audio files. Most music players use Title, Artist, Album, Cover, and Track Number. The others are optional and useful for advanced library management.</Hint>

							<Separator />

							<Collapsible>
								<CollapsibleTrigger>Advanced tag options</CollapsibleTrigger>
								<CollapsibleContent>
									<div className="space-y-4 pt-4">
										<SettingRow label="Save playlist as compilation" description="When downloading a playlist, marks it as a compilation album in the tags. Some players group compilation tracks differently and won't split them across individual artist pages.">
											<Switch
												checked={settings.tags?.savePlaylistAsCompilation || false}
												onCheckedChange={(checked) =>
													updateTag("savePlaylistAsCompilation", checked)
												}
											/>
										</SettingRow>

										<SettingRow label="Single album artist" description="Only saves the main artist in the album artist tag, even if the album has multiple artists. Keeps your library cleaner by avoiding long 'Artist A, Artist B, Artist C' album entries.">
											<Switch
												checked={settings.tags?.singleAlbumArtist || false}
												onCheckedChange={(checked) =>
													updateTag("singleAlbumArtist", checked)
												}
											/>
										</SettingRow>

										<SettingRow label="Save ID3v1 tags" description="Also writes the old ID3v1 tag format alongside the modern ID3v2 tags. Only useful for very old music players or car stereos that don't support ID3v2. Can be safely turned off for modern use.">
											<Switch
												checked={settings.tags?.saveID3v1 ?? true}
												onCheckedChange={(checked) =>
													updateTag("saveID3v1", checked)
												}
											/>
										</SettingRow>

										<SettingRow label="Use null separator" description="Uses a special null character to separate multiple artists in the tag, instead of a visible separator like '/'. Some advanced players (like foobar2000) can read this to properly split artists. May cause display issues in simpler players.">
											<Switch
												checked={settings.tags?.useNullSeparator || false}
												onCheckedChange={(checked) =>
													updateTag("useNullSeparator", checked)
												}
											/>
										</SettingRow>

										<SettingRow label="Cover description UTF-8" description="Uses UTF-8 encoding for the embedded cover art description field. Turn this on if cover art descriptions with accents or non-Latin characters display incorrectly in your player.">
											<Switch
												checked={settings.tags?.coverDescriptionUTF8 || false}
												onCheckedChange={(checked) =>
													updateTag("coverDescriptionUTF8", checked)
												}
											/>
										</SettingRow>

										<div className="space-y-2">
											<Label>Multi-artist separator</Label>
											<Select
												value={settings.tags?.multiArtistSeparator || "default"}
												onValueChange={(value) =>
													updateTag("multiArtistSeparator", value)
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{multiArtistOptions.map((o) => (
														<SelectItem key={o.value} value={o.value}>
															{o.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Hint>How multiple artists are displayed in the artist tag. "Default" uses Deezer's format, "& / feat." writes "Artist A & Artist B feat. Artist C", "Nothing" combines them into one string without separators.</Hint>
										</div>
									</div>
								</CollapsibleContent>
							</Collapsible>
						</CardContent>
					</Card>

					{/* Text Processing & Other */}
					<Card>
						<CardHeader>
							<CardTitle>Other Options</CardTitle>
							<CardDescription>
								Text processing, playlist files, logging, and post-download actions.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Text processing */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Featured artists handling</Label>
									<Select
										value={settings.featuredToTitle || "0"}
										onValueChange={(value) =>
											updateSetting("featuredToTitle", value)
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{featuredOptions.map((o) => (
												<SelectItem key={o.value} value={o.value}>
													{o.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Hint>Controls "feat." mentions in track names. "No change" keeps them as-is. "Remove from title" strips "(feat. X)" from song titles. "Move to title" adds featured artists into the title if they're not already there.</Hint>
								</div>

								<div className="space-y-2">
									<Label>Date format</Label>
									<Input
										type="text"
										value={settings.dateFormat || "Y-M-D"}
										onChange={(e) =>
											updateSetting("dateFormat", e.target.value)
										}
									/>
									<Hint>How dates appear in tags and filenames. Y = year, M = month, D = day. "Y-M-D" gives "2024-03-15", "D-M-Y" gives "15-03-2024".</Hint>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Title casing</Label>
									<Select
										value={settings.titleCasing || "nothing"}
										onValueChange={(value) =>
											updateSetting("titleCasing", value)
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{casingOptions.map((o) => (
												<SelectItem key={o.value} value={o.value}>
													{o.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Hint>Automatically changes how song titles are capitalized. "No change" keeps the original. "Start Case" capitalizes Each Word. Useful if Deezer's capitalization is inconsistent.</Hint>
								</div>

								<div className="space-y-2">
									<Label>Artist casing</Label>
									<Select
										value={settings.artistCasing || "nothing"}
										onValueChange={(value) =>
											updateSetting("artistCasing", value)
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{casingOptions.map((o) => (
												<SelectItem key={o.value} value={o.value}>
													{o.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Hint>Same as title casing but for artist names. "No change" is recommended since artist names often have intentional styling (e.g. "deadmau5", "TOOL").</Hint>
								</div>
							</div>

							<Separator />

							<SettingRow label="Remove album version" description={'Removes the "(Album Version)" label that Deezer sometimes adds to track titles. Turns "Song Name (Album Version)" into just "Song Name" for a cleaner library.'}>
								<Switch
									checked={settings.removeAlbumVersion || false}
									onCheckedChange={(checked) =>
										updateSetting("removeAlbumVersion", checked)
									}
								/>
							</SettingRow>

							<SettingRow label="Remove duplicate artists" description="If the same artist appears multiple times in a track's credits (e.g. as both main artist and featured), removes the duplicate. Prevents seeing 'Drake, Drake' in your music player.">
								<Switch
									checked={settings.removeDuplicateArtists ?? true}
									onCheckedChange={(checked) =>
										updateSetting("removeDuplicateArtists", checked)
									}
								/>
							</SettingRow>

							<SettingRow label="Various Artists in album title" description={'When an album has many different artists (like a soundtrack or compilation), includes "Various Artists" as the album artist. Helps group these albums together in your library.'}>
								<Switch
									checked={settings.albumVariousArtists ?? true}
									onCheckedChange={(checked) =>
										updateSetting("albumVariousArtists", checked)
									}
								/>
							</SettingRow>

							<Separator />

							<SettingRow label="Create M3U8 playlist file" description="When downloading an album or playlist, creates a .m3u8 file listing all the tracks in order. You can open this file in any music player to instantly load the playlist without importing each song manually.">
								<Switch
									checked={settings.createM3U8File || false}
									onCheckedChange={(checked) =>
										updateSetting("createM3U8File", checked)
									}
								/>
							</SettingRow>

							<SettingRow label="Log errors" description="Saves an errors.txt file in the download folder listing any tracks that failed to download. Useful for reviewing and retrying failed downloads later.">
								<Switch
									checked={settings.logErrors ?? true}
									onCheckedChange={(checked) =>
										updateSetting("logErrors", checked)
									}
								/>
							</SettingRow>

							<SettingRow label="Log searched tracks" description="Saves a searched.txt file listing tracks that couldn't be found directly and were matched using the search fallback. Lets you verify that the right versions were downloaded.">
								<Switch
									checked={settings.logSearched || false}
									onCheckedChange={(checked) =>
										updateSetting("logSearched", checked)
									}
								/>
							</SettingRow>

							<Separator />

							<div className="space-y-2">
								<Label>Execute command after download</Label>
								<Input
									type="text"
									value={settings.executeCommand || ""}
									onChange={(e) =>
										updateSetting("executeCommand", e.target.value)
									}
									placeholder="e.g., notify-send 'Download complete' %filename%"
								/>
								<Hint>Run a custom script or command on your computer after each download finishes. Use %folder% for the download folder path and %filename% for the downloaded file. Leave empty to disable. Example: a notification, a file mover, or a media library updater.</Hint>
							</div>
						</CardContent>
					</Card>

					{/* Spotify Settings */}
					{spotifySettings && (
						<Card>
							<CardHeader>
								<CardTitle>Spotify Integration</CardTitle>
								<CardDescription>
									Paste a Spotify link and download the music from Deezer. You need Spotify API credentials to convert Spotify links into Deezer tracks.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="clientId">Client ID</Label>
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
									<Hint>Your Spotify API Client ID. Get one for free at developer.spotify.com by creating an app. This is needed to read Spotify playlist and track data.</Hint>
								</div>
								<div className="space-y-2">
									<Label htmlFor="clientSecret">Client Secret</Label>
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
									<Hint>Your Spotify API Client Secret (keep this private). Found alongside the Client ID on your Spotify developer dashboard.</Hint>
								</div>
								<SettingRow label="Spotify fallback search" description="When a Spotify track can't be matched to a Deezer track by ID, tries to find it by searching the artist and title on Deezer. Increases download success rate but may occasionally find a slightly different version.">
									<Switch
										checked={spotifySettings.fallbackSearch || false}
										onCheckedChange={(checked) =>
											setSpotifySettings({
												...spotifySettings,
												fallbackSearch: checked,
											})
										}
									/>
								</SettingRow>
							</CardContent>
						</Card>
					)}
				</>
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
					<span className="text-sm text-muted-foreground flex items-center gap-1.5 font-bold uppercase">
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
