import { useCallback, useEffect, useRef, useState } from "react";
import { alpha, Box, IconButton, Stack, SvgIcon, Typography } from "@mui/material";

// The kitchen Pi runs go-librespot as a Spotify Connect speaker, with its API on this port.
// Only the kitchen screen asks for it (?spotify in its URL), so other browsers never try.
const PLAYER_URL = "http://localhost:3678";
const POLL_MS = 2000;
// A song left paused this long stops being shown
const HIDE_PAUSED_AFTER_MS = 15 * 60 * 1000;

// Material icon paths, to save pulling in the whole icon package for four of them
const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  next: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  prev: "M6 6h2v12H6zm3.5 6l8.5 6V6z",
};

const Icon = ({ name }: { name: keyof typeof ICONS }) => <SvgIcon><path d={ICONS[name]} /></SvgIcon>;

interface PlayerStatus {
  paused: boolean;
  stopped: boolean;
  track?: {
    name: string;
    artist_names: string[];
    album_cover_url?: string;
  } | null;
}

export const spotifyEnabled = () => new URLSearchParams(window.location.search).has("spotify");

const usePlayerStatus = () => {
  const [status, setStatus] = useState<PlayerStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${PLAYER_URL}/status`);
      // 204 means nobody is connected to the speaker
      setStatus(response.status === 200 ? await response.json() : null);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const command = useCallback(async (action: "playpause" | "next" | "prev") => {
    if (action === "playpause") {
      setStatus(s => s && { ...s, paused: !s.paused });
    }
    try {
      await fetch(`${PLAYER_URL}/player/${action}`, { method: "POST" });
    } finally {
      refresh();
    }
  }, [refresh]);

  return { status, command };
};

// What's playing on the kitchen speaker, in the corner of the slideshow
export const NowPlaying = () => {
  const { status, command } = usePlayerStatus();
  const pausedSince = useRef<number | null>(null);

  const track = status && !status.stopped ? status.track : null;
  if (!status?.paused) {
    pausedSince.current = null;
  } else if (pausedSince.current === null) {
    pausedSince.current = Date.now();
  }
  const pausedTooLong = pausedSince.current !== null && Date.now() - pausedSince.current > HIDE_PAUSED_AFTER_MS;

  if (!status || !track || pausedTooLong) {
    return null;
  }

  const buttonSx = { width: 56, height: 56, color: "text.primary", "& svg": { fontSize: 36 } };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      // Taps here are for the music, not the slideshow's controls or swipes
      onPointerDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      sx={{
        position: "absolute",
        top: 16,
        left: 20,
        maxWidth: "min(560px, 55vw)",
        p: 1,
        pr: 1.5,
        borderRadius: 2,
        bgcolor: theme => alpha(theme.palette.background.paper, 0.9),
        boxShadow: 3,
        animation: "nowPlayingIn 400ms ease-out",
        "@keyframes nowPlayingIn": { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      {track.album_cover_url && (
        <Box
          component="img"
          src={track.album_cover_url}
          alt=""
          sx={{ width: 72, height: 72, borderRadius: 1, flexShrink: 0, display: "block" }}
        />
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontWeight: "fontWeightBold", fontSize: "1.25rem", lineHeight: 1.3 }}>
          {track.name}
        </Typography>
        <Typography noWrap color="text.secondary" sx={{ fontSize: "1.05rem" }}>
          {track.artist_names.join(", ")}
        </Typography>
      </Box>
      <Stack direction="row" sx={{ flexShrink: 0 }}>
        <IconButton aria-label="Previous song" onClick={() => command("prev")} sx={buttonSx}>
          <Icon name="prev" />
        </IconButton>
        <IconButton aria-label={status.paused ? "Play" : "Pause"} onClick={() => command("playpause")} sx={buttonSx}>
          <Icon name={status.paused ? "play" : "pause"} />
        </IconButton>
        <IconButton aria-label="Next song" onClick={() => command("next")} sx={buttonSx}>
          <Icon name="next" />
        </IconButton>
      </Stack>
    </Stack>
  );
};
