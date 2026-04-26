// Mock data — realistic music catalog for the prototype
// Covers use CSS gradients (no external image dependency)

const COVER_PALETTES = [
  ['#FF2E00', '#0500FF'], // red-blue
  ['#C8FF00', '#0D0D0D'], // lime-black
  ['#FF00E5', '#FFB800'], // magenta-amber
  ['#00FFD1', '#0500FF'], // cyan-blue
  ['#F0EBE3', '#FF2E00'], // bone-red
  ['#0D0D0D', '#C8FF00'], // black-lime
  ['#FF2E00', '#F0EBE3'], // red-bone
  ['#FFB800', '#0D0D0D'], // amber-black
  ['#00FFD1', '#FF00E5'], // cyan-magenta
  ['#6B6560', '#C8FF00'], // muted-lime
  ['#0500FF', '#F0EBE3'], // blue-bone
  ['#FF0044', '#0D0D0D'], // pink-black
];

function cover(seed, title) {
  const p = COVER_PALETTES[seed % COVER_PALETTES.length];
  return { palette: p, title };
}

const ARTISTS = [
  'CHAPPELL ROAN', 'SAULT', 'GEORGIA ANNE MULDROW', 'KAYTRANADA', 'YUSSEF DAYES',
  'KELLY LEE OWENS', 'MOSES SUMNEY', 'ARCA', 'OVERMONO', 'SHYGIRL',
  'MAVI', 'JPEGMAFIA', 'DEAN BLUNT', 'TIRZAH', 'ALFA MIST',
  'FLOATING POINTS', 'KHRUANGBIN', 'LITTLE SIMZ', 'YVES TUMOR', 'CARIBOU',
];

const TRACKS = [
  { id: 't01', title: 'GOOD LUCK, BABE!', artist: 'CHAPPELL ROAN', album: 'THE RISE AND FALL OF A MIDWEST PRINCESS', duration: 218, bitrate: 'FLAC', year: 2024, seed: 0 },
  { id: 't02', title: 'WILDFLOWER', artist: 'SAULT', album: '11', duration: 243, bitrate: 'FLAC', year: 2022, seed: 1 },
  { id: 't03', title: 'OVERLOAD', artist: 'GEORGIA ANNE MULDROW', album: 'VWETO III', duration: 187, bitrate: '320', year: 2022, seed: 2 },
  { id: 't04', title: 'IF NOT FOR YOU', artist: 'KAYTRANADA', album: 'TIMELESS', duration: 201, bitrate: 'FLAC', year: 2024, seed: 3 },
  { id: 't05', title: 'RAISINS UNDER THE SUN', artist: 'YUSSEF DAYES', album: 'BLACK CLASSICAL MUSIC', duration: 312, bitrate: 'FLAC', year: 2023, seed: 4 },
  { id: 't06', title: 'S.O.', artist: 'KELLY LEE OWENS', album: 'DREAMSTATE', duration: 256, bitrate: 'FLAC', year: 2024, seed: 5 },
  { id: 't07', title: 'CUT ME', artist: 'MOSES SUMNEY', album: 'GRÆ', duration: 227, bitrate: '320', year: 2020, seed: 6 },
  { id: 't08', title: 'KLK', artist: 'ARCA', album: 'KICK I', duration: 191, bitrate: 'FLAC', year: 2020, seed: 7 },
  { id: 't09', title: 'SO U KNO', artist: 'OVERMONO', album: 'GOOD LIES', duration: 214, bitrate: 'FLAC', year: 2023, seed: 8 },
  { id: 't10', title: 'TASTY', artist: 'SHYGIRL', album: 'CLUB SHY', duration: 176, bitrate: '320', year: 2024, seed: 9 },
  { id: 't11', title: 'GUY WHO FELL OFF A YACHT ONCE', artist: 'MAVI', album: 'SHADOWBOX', duration: 193, bitrate: '320', year: 2024, seed: 10 },
  { id: 't12', title: 'JESUS FORGIVE ME, I AM A THOT', artist: 'JPEGMAFIA', album: 'ALL MY HEROES ARE CORNBALLS', duration: 161, bitrate: 'FLAC', year: 2019, seed: 11 },
  { id: 't13', title: 'THE ROUND', artist: 'DEAN BLUNT', album: 'BLACK METAL 2', duration: 278, bitrate: '320', year: 2021, seed: 0 },
  { id: 't14', title: 'SINK IN', artist: 'TIRZAH', album: 'COLOURGRADE', duration: 204, bitrate: 'FLAC', year: 2021, seed: 2 },
  { id: 't15', title: 'BORDERS', artist: 'ALFA MIST', album: 'BRING BACKS', duration: 341, bitrate: 'FLAC', year: 2021, seed: 4 },
  { id: 't16', title: 'BIRTH4000', artist: 'FLOATING POINTS', album: 'CASCADE', duration: 398, bitrate: 'FLAC', year: 2024, seed: 3 },
  { id: 't17', title: 'MAY NINTH', artist: 'KHRUANGBIN', album: 'A LA SALA', duration: 237, bitrate: '320', year: 2024, seed: 5 },
  { id: 't18', title: 'GORILLA', artist: 'LITTLE SIMZ', album: 'NO THANK YOU', duration: 183, bitrate: 'FLAC', year: 2022, seed: 6 },
  { id: 't19', title: 'HEAVEN SURROUNDS YOU', artist: 'YVES TUMOR', album: 'HEAVEN TO A TORTURED MIND', duration: 221, bitrate: '320', year: 2020, seed: 7 },
  { id: 't20', title: 'HOME', artist: 'CARIBOU', album: 'SUDDENLY', duration: 208, bitrate: 'FLAC', year: 2020, seed: 8 },
];

const ALBUMS = [
  { id: 'al01', title: 'THE RISE AND FALL OF A MIDWEST PRINCESS', artist: 'CHAPPELL ROAN', year: 2023, tracks: 14, duration: 2891, seed: 0, genre: 'POP' },
  { id: 'al02', title: '11', artist: 'SAULT', year: 2022, tracks: 10, duration: 2430, seed: 1, genre: 'R&B / SOUL' },
  { id: 'al03', title: 'TIMELESS', artist: 'KAYTRANADA', year: 2024, tracks: 21, duration: 4021, seed: 3, genre: 'ELECTRONIC' },
  { id: 'al04', title: 'BLACK CLASSICAL MUSIC', artist: 'YUSSEF DAYES', year: 2023, tracks: 19, duration: 4532, seed: 4, genre: 'JAZZ' },
  { id: 'al05', title: 'DREAMSTATE', artist: 'KELLY LEE OWENS', year: 2024, tracks: 10, duration: 2340, seed: 5, genre: 'ELECTRONIC' },
  { id: 'al06', title: 'CASCADE', artist: 'FLOATING POINTS', year: 2024, tracks: 9, duration: 3212, seed: 3, genre: 'ELECTRONIC' },
  { id: 'al07', title: 'A LA SALA', artist: 'KHRUANGBIN', year: 2024, tracks: 12, duration: 2740, seed: 5, genre: 'INSTRUMENTAL' },
  { id: 'al08', title: 'SHADOWBOX', artist: 'MAVI', year: 2024, tracks: 14, duration: 2143, seed: 10, genre: 'HIP-HOP' },
];

const PLAYLISTS = [
  { id: 'pl01', title: 'LATE NIGHT RENDER', description: 'Headphone music for 3am code commits', tracks: 42, duration: 10231, seeds: [0, 3, 5, 7] },
  { id: 'pl02', title: 'KITCHEN, COFFEE, 7:30AM', description: 'Soft landing for weekday mornings', tracks: 28, duration: 6420, seeds: [1, 4, 6, 8] },
  { id: 'pl03', title: 'RIDE CYMBAL', description: 'Drum-forward. Jazz-forward. Loud.', tracks: 37, duration: 8812, seeds: [4, 11, 2, 9] },
  { id: 'pl04', title: 'DECEMBER 2024', description: null, tracks: 19, duration: 4203, seeds: [10, 0, 7, 5] },
  { id: 'pl05', title: 'LO-FI STUDY', description: 'Mellow beats for focus', tracks: 54, duration: 12001, seeds: [2, 6, 10, 1] },
  { id: 'pl06', title: 'PARTY 01', description: 'Turn it the fuck up', tracks: 32, duration: 7540, seeds: [9, 11, 3, 0] },
];

const DOWNLOAD_HISTORY = [
  { id: 'dh01', trackId: 't01', title: 'GOOD LUCK, BABE!', artist: 'CHAPPELL ROAN', bitrate: 'FLAC', size: '42.1 MB', date: '2026-04-19T14:22:00', seed: 0 },
  { id: 'dh02', trackId: 't02', title: 'WILDFLOWER', artist: 'SAULT', bitrate: 'FLAC', size: '38.7 MB', date: '2026-04-19T14:21:18', seed: 1 },
  { id: 'dh03', trackId: 't06', title: 'S.O.', artist: 'KELLY LEE OWENS', bitrate: 'FLAC', size: '45.2 MB', date: '2026-04-19T14:20:03', seed: 5 },
  { id: 'dh04', trackId: 't05', title: 'RAISINS UNDER THE SUN', artist: 'YUSSEF DAYES', bitrate: 'FLAC', size: '51.8 MB', date: '2026-04-19T13:58:44', seed: 4 },
  { id: 'dh05', trackId: 't09', title: 'SO U KNO', artist: 'OVERMONO', bitrate: 'FLAC', size: '39.4 MB', date: '2026-04-19T13:42:12', seed: 8 },
  { id: 'dh06', trackId: 't16', title: 'BIRTH4000', artist: 'FLOATING POINTS', bitrate: 'FLAC', size: '67.2 MB', date: '2026-04-18T22:11:00', seed: 3 },
  { id: 'dh07', trackId: 't17', title: 'MAY NINTH', artist: 'KHRUANGBIN', bitrate: '320', size: '9.1 MB', date: '2026-04-18T22:10:14', seed: 5 },
  { id: 'dh08', trackId: 't20', title: 'HOME', artist: 'CARIBOU', bitrate: 'FLAC', size: '40.2 MB', date: '2026-04-18T19:03:08', seed: 8 },
  { id: 'dh09', trackId: 't14', title: 'SINK IN', artist: 'TIRZAH', bitrate: 'FLAC', size: '37.8 MB', date: '2026-04-17T11:22:45', seed: 2 },
  { id: 'dh10', trackId: 't19', title: 'HEAVEN SURROUNDS YOU', artist: 'YVES TUMOR', bitrate: '320', size: '8.7 MB', date: '2026-04-17T11:22:17', seed: 7 },
  { id: 'dh11', trackId: 't18', title: 'GORILLA', artist: 'LITTLE SIMZ', bitrate: 'FLAC', size: '36.4 MB', date: '2026-04-16T18:44:00', seed: 6 },
  { id: 'dh12', trackId: 't15', title: 'BORDERS', artist: 'ALFA MIST', bitrate: 'FLAC', size: '58.1 MB', date: '2026-04-16T18:43:22', seed: 4 },
];

// Active downloads (simulated state snapshot)
const ACTIVE_DOWNLOADS = [
  { id: 'd01', title: 'TIMELESS', artist: 'KAYTRANADA', type: 'album', status: 'downloading', progress: 67, downloaded: 14, size: 21, bitrate: 'FLAC', seed: 3 },
  { id: 'd02', title: 'CASCADE', artist: 'FLOATING POINTS', type: 'album', status: 'downloading', progress: 22, downloaded: 2, size: 9, bitrate: 'FLAC', seed: 3 },
  { id: 'd03', title: 'A LA SALA', artist: 'KHRUANGBIN', type: 'album', status: 'inQueue', progress: 0, downloaded: 0, size: 12, bitrate: '320', seed: 5 },
  { id: 'd04', title: 'NO THANK YOU', artist: 'LITTLE SIMZ', type: 'album', status: 'inQueue', progress: 0, downloaded: 0, size: 10, bitrate: 'FLAC', seed: 6 },
  { id: 'd05', title: 'BIRTH4000', artist: 'FLOATING POINTS', type: 'track', status: 'completed', progress: 100, downloaded: 1, size: 1, bitrate: 'FLAC', seed: 3 },
  { id: 'd06', title: 'OVERLOAD', artist: 'GEORGIA ANNE MULDROW', type: 'track', status: 'completed', progress: 100, downloaded: 1, size: 1, bitrate: '320', seed: 2 },
  { id: 'd07', title: 'KLK', artist: 'ARCA', type: 'track', status: 'failed', progress: 0, downloaded: 0, size: 1, bitrate: 'FLAC', seed: 7, error: 'NETWORK TIMEOUT' },
];

const QUEUE = [
  { ...TRACKS[0], queuePos: 0, playing: true },
  { ...TRACKS[3], queuePos: 1 },
  { ...TRACKS[8], queuePos: 2 },
  { ...TRACKS[15], queuePos: 3 },
  { ...TRACKS[17], queuePos: 4 },
];

const SEARCH_RESULTS = {
  tracks: [TRACKS[0], TRACKS[1], TRACKS[2], TRACKS[7], TRACKS[9]],
  albums: [ALBUMS[0], ALBUMS[2], ALBUMS[4]],
  artists: [
    { id: 'ar01', name: 'CHAPPELL ROAN', fans: 2_410_000, seed: 0 },
    { id: 'ar02', name: 'KAYTRANADA', fans: 1_820_000, seed: 3 },
  ],
};

// Synced lyrics — original placeholder lines with [time] marks for "GOOD LUCK, BABE!" (218s)
// Pure invention; keeps the prototype self-contained and avoids reproducing real song text.
const LYRICS_T01 = [
  { t:   0, line: '[ INTRO ]', kind: 'tag' },
  { t:   8, line: 'It was a slow drive home,' },
  { t:  13, line: 'the radio playing static again' },
  { t:  19, line: 'You said you didn\'t mean it' },
  { t:  24, line: 'but the door was already open' },
  { t:  30, line: '' },
  { t:  31, line: '[ VERSE I ]', kind: 'tag' },
  { t:  34, line: 'Tell me you remember the summer' },
  { t:  40, line: 'when we slept on the roof in July' },
  { t:  46, line: 'You held my hand like a promise,' },
  { t:  52, line: 'soft as a paper kite in the sky' },
  { t:  59, line: '' },
  { t:  60, line: '[ PRE-CHORUS ]', kind: 'tag' },
  { t:  62, line: 'And every road we ever drove,' },
  { t:  68, line: 'every red light that we ran,' },
  { t:  74, line: 'every name we never told them' },
  { t:  80, line: 'is a city in my hands' },
  { t:  86, line: '' },
  { t:  88, line: '[ CHORUS ]', kind: 'tag' },
  { t:  90, line: 'Good luck, babe — I mean it kindly' },
  { t:  97, line: 'Take the long way through the dark' },
  { t: 103, line: 'You can call me when you find me' },
  { t: 109, line: 'somewhere quieter than your heart' },
  { t: 116, line: '' },
  { t: 118, line: 'Good luck, babe — wherever you go' },
  { t: 124, line: 'I left the porch light on for two' },
  { t: 130, line: 'And every song the morning sings' },
  { t: 136, line: 'is the one I made for you' },
  { t: 143, line: '' },
  { t: 145, line: '[ VERSE II ]', kind: 'tag' },
  { t: 148, line: 'You used to laugh at the freeway,' },
  { t: 154, line: 'I used to laugh at the rain' },
  { t: 160, line: 'Now the windows roll up by themselves' },
  { t: 166, line: 'and the kitchen table\'s the same' },
  { t: 173, line: '' },
  { t: 175, line: '[ BRIDGE ]', kind: 'tag' },
  { t: 178, line: 'Maybe one day we\'ll be older,' },
  { t: 184, line: 'softer, easier to find' },
  { t: 190, line: 'Until then keep the radio on,' },
  { t: 196, line: 'the volume right up to nine' },
  { t: 203, line: '' },
  { t: 205, line: '[ OUTRO ]', kind: 'tag' },
  { t: 208, line: 'Good luck, babe.' },
  { t: 213, line: '' },
];

window.DMX_DATA = {
  ARTISTS, TRACKS, ALBUMS, PLAYLISTS,
  DOWNLOAD_HISTORY, ACTIVE_DOWNLOADS, QUEUE, SEARCH_RESULTS,
  COVER_PALETTES, cover,
  LYRICS: { t01: LYRICS_T01 },
};
