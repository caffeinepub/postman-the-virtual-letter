import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { LetterDetail } from "../backend.d";
import { StampType } from "../backend.d";

interface Props {
  letter: LetterDetail;
  senderName?: string;
  onClose: () => void;
}

const VOICE_PREFIX = "VOICE_NOTE:";
const STAMP_PREFIX = "STAMP:";

// All stamp display data keyed by stamp value
const STAMP_DISPLAY: Record<
  string,
  { flag: string; label: string; color: string; bg: string; image?: string }
> = {
  indian: {
    flag: "\u{1F1EE}\u{1F1F3}",
    label: "India Post",
    color: "oklch(0.38 0.18 28)",
    bg: "oklch(0.93 0.06 50)",
    image: "/assets/generated/stamp-india.dim_200x240.png",
  },
  pakistani: {
    flag: "\u{1F1F5}\u{1F1F0}",
    label: "Pakistan Post",
    color: "oklch(0.35 0.18 145)",
    bg: "oklch(0.93 0.06 145)",
    image: "/assets/generated/stamp-pakistan.dim_200x240.png",
  },
  canada: {
    flag: "\u{1F1E8}\u{1F1E6}",
    label: "Canada Post",
    color: "oklch(0.38 0.20 22)",
    bg: "oklch(0.96 0.05 22)",
  },
  iran: {
    flag: "\u{1F1EE}\u{1F1F7}",
    label: "Iran Post",
    color: "oklch(0.35 0.18 145)",
    bg: "oklch(0.93 0.06 145)",
  },
  dubai: {
    flag: "\u{1F1E6}\u{1F1EA}",
    label: "Dubai Post",
    color: "oklch(0.42 0.12 52)",
    bg: "oklch(0.95 0.06 82)",
  },
  london: {
    flag: "\u{1F1EC}\u{1F1E7}",
    label: "Royal Mail",
    color: "oklch(0.38 0.20 22)",
    bg: "oklch(0.96 0.05 22)",
  },
  "new-zealand": {
    flag: "\u{1F1F3}\u{1F1FF}",
    label: "NZ Post",
    color: "oklch(0.35 0.16 260)",
    bg: "oklch(0.94 0.05 260)",
  },
  australia: {
    flag: "\u{1F1E6}\u{1F1FA}",
    label: "Australia Post",
    color: "oklch(0.40 0.16 235)",
    bg: "oklch(0.94 0.05 235)",
  },
};

function parseLetterBody(rawBody: string) {
  let stampValue: string = StampType.indian as string;
  let body = rawBody;

  if (body.startsWith(STAMP_PREFIX)) {
    const rest = body.slice(STAMP_PREFIX.length);
    const colonIdx = rest.indexOf(":");
    if (colonIdx !== -1) {
      stampValue = rest.slice(0, colonIdx);
      body = rest.slice(colonIdx + 1);
    }
  }

  const isVoice = body.startsWith(VOICE_PREFIX);
  const audioSrc = isVoice ? body.slice(VOICE_PREFIX.length) : null;

  return { stampValue, isVoice, audioSrc, textBody: body };
}

function StampBadge({ stampValue }: { stampValue: string }) {
  const info = STAMP_DISPLAY[stampValue] ?? STAMP_DISPLAY.indian;

  if (info.image) {
    return (
      <div className="flex flex-col items-center gap-1 my-3">
        <div
          style={{
            transform: "rotate(-2deg)",
            filter: "drop-shadow(0 4px 12px oklch(0.22 0.06 55 / 0.35))",
          }}
        >
          <img
            src={info.image}
            alt={info.label}
            className="w-16 h-auto"
            style={{
              outline: `2px solid ${info.color}`,
              outlineOffset: "2px",
            }}
          />
        </div>
        <span
          className="font-lora text-xs"
          style={{ color: info.color, fontWeight: 600 }}
        >
          {info.flag} {info.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 my-3">
      <div
        className="flex flex-col items-center justify-center w-16 h-20"
        style={{
          background: info.bg,
          border: `3px solid ${info.color}`,
          outline: `2px dashed ${info.color}`,
          outlineOffset: "-4px",
          transform: "rotate(-2deg)",
          boxShadow: "2px 2px 0 oklch(0.22 0.06 50)",
        }}
      >
        <span className="text-2xl leading-none mb-0.5">{info.flag}</span>
        <span
          className="font-playfair text-center"
          style={{
            color: info.color,
            fontSize: "7px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            maxWidth: 56,
            textAlign: "center",
          }}
        >
          {info.label.toUpperCase()}
        </span>
      </div>
      <span
        className="font-lora text-xs"
        style={{ color: info.color, fontWeight: 600 }}
      >
        {info.flag} {info.label}
      </span>
    </div>
  );
}

function VoicePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play();
    }
    setPlaying(!playing);
  }

  function handleTimeUpdate() {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    setProgress((a.currentTime / a.duration) * 100);
  }

  function handleLoadedMetadata() {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }

  function handleEnded() {
    setPlaying(false);
    setProgress(0);
  }

  function formatTime(s: number) {
    if (!s || Number.isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec}`;
  }

  function handleScrub(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = pct * a.duration;
  }

  function handleScrubKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    if (e.key === "ArrowRight")
      a.currentTime = Math.min(a.duration, a.currentTime + 5);
    if (e.key === "ArrowLeft") a.currentTime = Math.max(0, a.currentTime - 5);
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {/* biome-ignore lint/a11y/useMediaCaption: user-generated voice note; no transcript available */}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />

      <motion.div
        animate={{ scale: playing ? [1, 1.08, 1] : 1 }}
        transition={{
          repeat: playing ? Number.POSITIVE_INFINITY : 0,
          duration: 1.2,
        }}
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
        style={{
          background: playing
            ? "linear-gradient(135deg, oklch(0.45 0.18 22), oklch(0.32 0.14 20))"
            : "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
          border: "3px solid oklch(0.55 0.09 52)",
          boxShadow: playing ? "0 0 24px oklch(0.45 0.18 22 / 0.4)" : "none",
          transition: "all 0.3s",
        }}
      >
        &#127897;&#65039;
      </motion.div>

      <p
        className="font-playfair text-sm font-semibold text-center"
        style={{ color: "oklch(0.32 0.08 52)" }}
      >
        Voice Note &#8212; tap play to listen
      </p>

      <div
        className="w-full cursor-pointer"
        role="slider"
        aria-label="Audio progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onClick={handleScrub}
        onKeyDown={handleScrubKey}
        data-ocid="envelope.voice_progress"
        style={{ padding: "4px 0" }}
      >
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "oklch(0.82 0.05 72)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span
            className="font-lora text-xs"
            style={{ color: "oklch(0.52 0.07 56)" }}
          >
            {audioRef.current
              ? formatTime(audioRef.current.currentTime)
              : "0:00"}
          </span>
          <span
            className="font-lora text-xs"
            style={{ color: "oklch(0.52 0.07 56)" }}
          >
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={togglePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-ocid="envelope.voice_play_button"
        className="flex items-center gap-2.5 px-8 py-3 font-lora text-sm transition-all"
        style={{
          background: playing
            ? "oklch(0.45 0.18 22)"
            : "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
          color: "oklch(0.97 0.02 80)",
          border: "2px solid oklch(0.55 0.09 52)",
          boxShadow: "2px 2px 0 oklch(0.22 0.06 50)",
        }}
      >
        <span className="text-base">{playing ? "\u23F8" : "\u25B6"}</span>
        {playing ? "Pause" : "Play Voice Note"}
      </motion.button>
    </div>
  );
}

export default function EnvelopeReveal({ letter, senderName, onClose }: Props) {
  const [phase, setPhase] = useState<"envelope" | "flap" | "letter">(
    "envelope",
  );

  const { stampValue, isVoice, audioSrc, textBody } = parseLetterBody(
    letter.body,
  );

  function startOpen() {
    setPhase("flap");
    setTimeout(() => setPhase("letter"), 1000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 8, 3, 0.88)" }}
      data-ocid="envelope.modal"
    >
      <AnimatePresence mode="wait">
        {phase === "envelope" && (
          <motion.div
            key="envelope"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.5 }}
              className="text-9xl select-none"
            >
              {isVoice ? "\uD83C\uDF99\uFE0F" : "\u2709\uFE0F"}
            </motion.div>
            <p
              className="font-playfair text-xl text-center"
              style={{ color: "oklch(0.92 0.04 85)" }}
            >
              {isVoice
                ? "A voice note awaits you\u2026"
                : "A letter awaits you\u2026"}
            </p>
            {senderName && (
              <p
                className="font-lora italic text-sm"
                style={{ color: "oklch(0.75 0.06 75)" }}
              >
                From: @{senderName}
              </p>
            )}
            <button
              type="button"
              onClick={startOpen}
              data-ocid="envelope.primary_button"
              className="font-lora px-8 py-3 rounded-sm transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "oklch(0.42 0.10 48)",
                color: "oklch(0.97 0.02 80)",
              }}
            >
              {isVoice ? "Open Voice Note" : "Open Letter"}
            </button>
          </motion.div>
        )}

        {phase === "flap" && (
          <motion.div
            key="flap"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative" style={{ width: 200, height: 200 }}>
              <motion.div
                className="absolute inset-0 rounded-sm flex items-end justify-center overflow-hidden"
                style={{
                  background:
                    "linear-gradient(160deg, oklch(0.88 0.05 78), oklch(0.78 0.07 68))",
                  border: "2px solid oklch(0.65 0.07 60)",
                }}
              >
                <motion.div
                  initial={{ y: 80 }}
                  animate={{ y: -10 }}
                  transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
                  className="w-3/4 h-20 rounded-sm mx-auto mb-2"
                  style={{
                    background: "oklch(0.96 0.04 85)",
                    border: "1px solid oklch(0.80 0.05 70)",
                  }}
                />
              </motion.div>
              <motion.div
                initial={{ rotateX: 0, transformOrigin: "top" }}
                animate={{ rotateX: -160 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute top-0 left-0 right-0 h-1/2 rounded-t-sm"
                style={{
                  background:
                    "linear-gradient(160deg, oklch(0.82 0.06 75), oklch(0.72 0.07 65))",
                  border: "2px solid oklch(0.65 0.07 60)",
                  transformStyle: "preserve-3d",
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                }}
              />
            </div>
            <p
              className="font-lora italic"
              style={{ color: "oklch(0.88 0.04 82)" }}
            >
              Opening&#8230;
            </p>
          </motion.div>
        )}

        {phase === "letter" && (
          <motion.div
            key="letter"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-lg rounded-sm vintage-border"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.96 0.04 85), oklch(0.91 0.05 78))",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            {/* Letter header */}
            <div className="text-center pt-6 pb-2 px-8">
              <div className="text-2xl mb-2">
                {isVoice ? "\uD83C\uDF99\uFE0F" : "\uD83D\uDCDC"}
              </div>
              <h2
                className="font-playfair text-xl font-bold"
                style={{ color: "oklch(0.25 0.07 50)" }}
              >
                {isVoice
                  ? "Voice Note"
                  : `Letter #${String(letter.id).padStart(4, "0")}`}
              </h2>
              {senderName && (
                <p
                  className="font-lora italic text-sm mt-1"
                  style={{ color: "oklch(0.50 0.07 55)" }}
                >
                  From: @{senderName}
                </p>
              )}

              {/* Stamp display */}
              <StampBadge stampValue={stampValue} />

              <div
                className="mt-2 mx-auto w-24 h-px"
                style={{ background: "oklch(0.65 0.07 60)" }}
              />
            </div>

            {/* Letter body */}
            <div className="parchment-paper mx-6 my-4 p-6">
              {isVoice && audioSrc ? (
                <VoicePlayer src={audioSrc} />
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="font-dancing text-lg leading-relaxed whitespace-pre-wrap"
                  style={{ color: "oklch(0.22 0.06 50)" }}
                >
                  {textBody}
                </motion.p>
              )}
              <p
                className="font-lora italic text-xs mt-6 text-right"
                style={{ color: "oklch(0.50 0.07 55)" }}
              >
                {senderName
                  ? `\u2014 Sent by @${senderName} via POSTMAN`
                  : "\u2014 Delivered with care by POSTMAN"}
              </p>
            </div>

            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={onClose}
                data-ocid="envelope.close_button"
                className="w-full py-2.5 font-lora text-sm rounded-sm transition-all hover:brightness-110"
                style={{
                  background: "oklch(0.42 0.10 48)",
                  color: "oklch(0.97 0.02 80)",
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
