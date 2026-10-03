// Test fixture: a trimmed copy of the `__NEXT_DATA__` payload that
// https://open.spotify.com/embed/playlist/{id} serves (captured 2026-10).

interface FixtureTrack {
	title: string;
	subtitle: string;
	duration: number;
	uri?: string;
	entityType?: string;
}

export function embedHtml({
	tracks,
	name = "Today’s Top Hits",
	subtitle = "Spotify",
}: {
	tracks: FixtureTrack[];
	name?: string;
	subtitle?: string;
}): string {
	const data = {
		props: {
			pageProps: {
				state: {
					data: {
						entity: {
							type: "playlist",
							name,
							title: name,
							subtitle,
							id: "37i9dQZF1DXcBWIGoYBM5M",
							coverArt: { sources: [{ url: "https://i.scdn.co/image/cover", width: null, height: null }] },
							trackList: tracks.map((t, i) => ({
								uri: t.uri ?? `spotify:track:${String(i).padStart(22, "0")}`,
								uid: String(i),
								title: t.title,
								subtitle: t.subtitle,
								duration: t.duration,
								isPlayable: true,
								entityType: t.entityType ?? "track",
							})),
						},
					},
					settings: { session: { accessToken: "x", isAnonymous: true } },
				},
			},
		},
	};
	return `<!DOCTYPE html><html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
		data
	)}</script></body></html>`;
}

// Same, for https://open.spotify.com/embed/track/{id}.
export function trackEmbedHtml({
	id,
	name,
	artists,
	duration,
}: {
	id: string;
	name: string;
	artists: string[];
	duration: number;
}): string {
	const data = {
		props: {
			pageProps: {
				state: {
					data: {
						entity: {
							type: "track",
							name,
							title: name,
							uri: `spotify:track:${id}`,
							id,
							artists: artists.map((a) => ({ name: a, uri: "spotify:artist:x" })),
							duration,
							isPlayable: true,
						},
					},
				},
			},
		},
	};
	return `<!DOCTYPE html><html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
		data
	)}</script></body></html>`;
}
