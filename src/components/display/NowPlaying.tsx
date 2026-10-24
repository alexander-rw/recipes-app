import { useCallback, useEffect, useRef, useState } from "react";
import { alpha, Box, IconButton, Stack, SvgIcon, Typography } from "@mui/material";

// The kitchen Pi runs Spotify Soloist as a Connect speaker, with its WebSocket API on this port.
// Only the kitchen screen asks for it (?spotify in its URL), so other browsers never try.
const PLAYER_URL = "ws://127.0.0.1:3679";
const RECONNECT_MS = 5000;
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

// The parts of Soloist's entity (track, artist, album) that the card uses
interface Entity {
  decorations?: {
    identity?: { name?: string };
    visual_identity?: { cover?: { url: string; size: string }[] };
    creators?: { entity: Entity }[];
  };
}

type PlaybackStatus = "idle" | "playing" | "paused" | "buffering";

interface Track {
  name: string;
  artists: string[];
  coverUrl?: string;
}

interface PlayerStatus {
  status: PlaybackStatus;
  track: Track | null;
}

const toTrack = (item?: Entity | null): Track | null => {
  const name = item?.decorations?.identity?.name;
  if (!name) {
    return null;
  }
  const covers = item.decorations?.visual_identity?.cover ?? [];
  return {
    name,
    artists: (item.decorations?.creators ?? [])
      .map(creator => creator.entity.decorations?.identity?.name)
      .filter((artist): artist is string => !!artist),
    coverUrl: (covers.find(cover => cover.size === "large") ?? covers[0])?.url,
  };
};

export const spotifyEnabled = () => new URLSearchParams(window.location.search).has("spotify");

const usePlayerStatus = () => {
  const [player, setPlayer] = useState<PlayerStatus | null>(null);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closed = false;
    let retry: number | undefined;

    const connect = () => {
      const ws = new WebSocket(PLAYER_URL);
      socket.current = ws;
      ws.onmessage = event => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "auth_state":
            // Nobody has picked the speaker in the Spotify app yet
            if (!message.logged_in) {
              setPlayer(null);
            }
            break;
          case "playback_state":
            setPlayer({ status: message.status, track: toTrack(message.item) });
            break;
          case "track_changed":
            setPlayer(p => ({ status: p?.status ?? "playing", track: toTrack(message.item) }));
            break;
          case "playback_changed":
            setPlayer(p => p && { ...p, status: message.status });
            break;
        }
      };
      // Soloist restarts now and then (and isn't up yet at boot), so keep trying
      ws.onclose = () => {
        setPlayer(null);
        if (!closed) {
          retry = window.setTimeout(connect, RECONNECT_MS);
        }
      };
    };

    connect();
    return () => {
      closed = true;
      window.clearTimeout(retry);
      socket.current?.close();
    };
  }, []);

  const command = useCallback((action: "playpause" | "next" | "prev") => {
    const name = action === "next" ? "skip_next"
      : action === "prev" ? "skip_prev"
      : player?.status === "paused" ? "play" : "pause";
    if (action === "playpause") {
      setPlayer(p => p && { ...p, status: name === "play" ? "playing" : "paused" });
    }
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: "command", command: name }));
    }
  }, [player?.status]);

  return { player, command };
};

// What's playing on the kitchen speaker, in the corner of the slideshow
export const NowPlaying = () => {
  const { player, command } = usePlayerStatus();
  const pausedSince = useRef<number | null>(null);

  const track = player && player.status !== "idle" ? player.track : null;
  const paused = player?.status === "paused";
  if (!paused) {
    pausedSince.current = null;
  } else if (pausedSince.current === null) {
    pausedSince.current = Date.now();
  }
  const pausedTooLong = pausedSince.current !== null && Date.now() - pausedSince.current > HIDE_PAUSED_AFTER_MS;

  if (!track || pausedTooLong) {
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
      {track.coverUrl && (
        <Box
          component="img"
          src={track.coverUrl}
          alt=""
          sx={{ width: 72, height: 72, borderRadius: 1, flexShrink: 0, display: "block" }}
        />
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontWeight: "fontWeightBold", fontSize: "1.25rem", lineHeight: 1.3 }}>
          {track.name}
        </Typography>
        <Typography noWrap color="text.secondary" sx={{ fontSize: "1.05rem" }}>
          {track.artists.join(", ")}
        </Typography>
      </Box>
      <Stack direction="row" sx={{ flexShrink: 0 }}>
        <IconButton aria-label="Previous song" onClick={() => command("prev")} sx={buttonSx}>
          <Icon name="prev" />
        </IconButton>
        <IconButton aria-label={paused ? "Play" : "Pause"} onClick={() => command("playpause")} sx={buttonSx}>
          <Icon name={paused ? "play" : "pause"} />
        </IconButton>
        <IconButton aria-label="Next song" onClick={() => command("next")} sx={buttonSx}>
          <Icon name="next" />
        </IconButton>
      </Stack>
    </Stack>
  );
};
