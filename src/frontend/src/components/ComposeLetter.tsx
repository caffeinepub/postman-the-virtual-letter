import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import {
  AtSign,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StampType } from "../backend.d";
import {
  useCallerProfile,
  useFindUserByUsername,
  useSendLetter,
} from "../hooks/useQueries";
import { saveDelivery } from "../lib/deliveryStore";
import { createPrincipal } from "../lib/principalUtils";

const MAX_DURATION = 120; // seconds

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Stamp definitions — image-based stamps for India & Pakistan, CSS stamps for the rest
const STAMP_OPTIONS = [
  {
    group: "India",
    stamps: [
      {
        value: StampType.indian as string,
        label: "India Post",
        flag: "🇮🇳",
        image: "/assets/generated/stamp-india.dim_200x240.png",
        color: "oklch(0.38 0.18 28)",
        bg: "oklch(0.93 0.06 50)",
      },
    ],
  },
  {
    group: "Pakistan",
    stamps: [
      {
        value: StampType.pakistani as string,
        label: "Pakistan Post",
        flag: "🇵🇰",
        image: "/assets/generated/stamp-pakistan.dim_200x240.png",
        color: "oklch(0.35 0.18 145)",
        bg: "oklch(0.93 0.06 145)",
      },
    ],
  },
  {
    group: "Canada",
    stamps: [
      {
        value: "canada",
        label: "Canada Post",
        flag: "🇨🇦",
        image: null,
        color: "oklch(0.38 0.20 22)",
        bg: "oklch(0.96 0.05 22)",
      },
    ],
  },
  {
    group: "Iran",
    stamps: [
      {
        value: "iran",
        label: "Iran Post",
        flag: "🇮🇷",
        image: null,
        color: "oklch(0.35 0.18 145)",
        bg: "oklch(0.93 0.06 145)",
      },
    ],
  },
  {
    group: "Dubai",
    stamps: [
      {
        value: "dubai",
        label: "Dubai Post",
        flag: "🇦🇪",
        image: null,
        color: "oklch(0.42 0.12 52)",
        bg: "oklch(0.95 0.06 82)",
      },
    ],
  },
  {
    group: "London",
    stamps: [
      {
        value: "london",
        label: "Royal Mail",
        flag: "🇬🇧",
        image: null,
        color: "oklch(0.38 0.20 22)",
        bg: "oklch(0.96 0.05 22)",
      },
    ],
  },
  {
    group: "New Zealand",
    stamps: [
      {
        value: "new-zealand",
        label: "NZ Post",
        flag: "🇳🇿",
        image: null,
        color: "oklch(0.35 0.16 260)",
        bg: "oklch(0.94 0.05 260)",
      },
    ],
  },
  {
    group: "Australia",
    stamps: [
      {
        value: "australia",
        label: "Australia Post",
        flag: "🇦🇺",
        image: null,
        color: "oklch(0.40 0.16 235)",
        bg: "oklch(0.94 0.05 235)",
      },
    ],
  },
];

function CssStamp({
  flag,
  label,
  color,
  bg,
  selected,
}: {
  flag: string;
  label: string;
  color: string;
  bg: string;
  selected: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center w-20 h-24 relative"
      style={{
        background: bg,
        border: `3px solid ${color}`,
        boxShadow: selected
          ? `0 0 0 3px ${color}, 3px 3px 0 oklch(0.22 0.06 50)`
          : "1px 1px 4px oklch(0.22 0.06 50 / 0.18)",
        // Perforated stamp edges via repeating gradient
        outline: `2px dashed ${color}`,
        outlineOffset: "-5px",
        transform: selected ? "rotate(-3deg) scale(1.08)" : "rotate(2deg)",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
    >
      <span className="text-3xl leading-none mb-1">{flag}</span>
      <span
        className="font-playfair text-center leading-tight"
        style={{
          color,
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          maxWidth: 68,
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label.toUpperCase()}
      </span>
      {selected && (
        <span
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
          style={{ background: color, color: "white" }}
        >
          ✓
        </span>
      )}
    </div>
  );
}

function VoiceRecorder({
  onRecorded,
}: {
  onRecorded: (blob: Blob) => void;
}) {
  const [recState, setRecState] = useState<"idle" | "recording" | "recorded">(
    "idle",
  );
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "";
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecorded(blob);
        setRecState("recorded");
        for (const track of stream.getTracks()) track.stop();
      };
      mr.start(200);
      mediaRecorderRef.current = mr;
      setElapsed(0);
      setRecState("recording");

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }

  function reRecord() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setElapsed(0);
    setRecState("idle");
  }

  const progress = (elapsed / MAX_DURATION) * 100;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {recState === "idle" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <p
            className="font-lora italic text-sm"
            style={{ color: "oklch(0.52 0.07 56)" }}
          >
            Tap the microphone to begin recording your voice note
          </p>
          <motion.button
            type="button"
            onClick={startRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-ocid="compose.voice_record_button"
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
              border: "3px solid oklch(0.55 0.09 52)",
              boxShadow: "0 4px 20px oklch(0.32 0.08 52 / 0.35)",
            }}
          >
            <Mic
              className="w-10 h-10"
              style={{ color: "oklch(0.97 0.02 80)" }}
            />
          </motion.button>
          <p
            className="font-lora text-xs"
            style={{ color: "oklch(0.60 0.06 58)" }}
          >
            Max duration: 2:00
          </p>
        </motion.div>
      )}

      {recState === "recording" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 w-full"
        >
          {/* Pulsing mic */}
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
              className="absolute inset-0 rounded-full"
              style={{ background: "oklch(0.50 0.18 22 / 0.4)" }}
            />
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.8, 0.2, 0.8] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.5,
                delay: 0.25,
              }}
              className="absolute inset-0 rounded-full"
              style={{ background: "oklch(0.50 0.18 22 / 0.3)" }}
            />
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.45 0.18 22), oklch(0.32 0.14 20))",
                border: "3px solid oklch(0.55 0.14 22)",
              }}
            >
              <Mic
                className="w-8 h-8"
                style={{ color: "oklch(0.97 0.02 80)" }}
              />
            </div>
          </div>

          {/* Timer */}
          <div
            className="font-playfair text-3xl font-bold"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            {formatTime(elapsed)}
          </div>

          {/* Progress bar */}
          <div
            className="w-full max-w-xs h-2 rounded-full overflow-hidden"
            style={{ background: "oklch(0.88 0.04 78)" }}
          >
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.45 0.18 22), oklch(0.36 0.14 22))",
              }}
            />
          </div>

          <p
            className="font-lora text-xs italic"
            style={{ color: "oklch(0.50 0.18 22)" }}
          >
            Recording… speak clearly
          </p>

          <motion.button
            type="button"
            onClick={stopRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-ocid="compose.voice_stop_button"
            className="flex items-center gap-2 px-6 py-2.5 font-lora text-sm transition-all"
            style={{
              background: "oklch(0.45 0.18 22)",
              color: "oklch(0.97 0.02 80)",
              border: "2px solid oklch(0.55 0.14 22)",
            }}
          >
            <Square className="w-4 h-4" />
            Stop Recording
          </motion.button>
        </motion.div>
      )}

      {recState === "recorded" && audioUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 w-full"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
              border: "3px solid oklch(0.55 0.09 52)",
            }}
          >
            <Play
              className="w-7 h-7"
              style={{ color: "oklch(0.97 0.02 80)" }}
            />
          </div>

          <p
            className="font-playfair text-sm font-semibold"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            Voice note recorded — {formatTime(elapsed)}
          </p>

          {/* Native audio player for preview - a11y: user interaction provides the accessible interface */}
          {/* biome-ignore lint/a11y/useMediaCaption: voice note preview; no transcript available at record time */}
          <audio
            controls
            src={audioUrl}
            className="w-full max-w-xs"
            data-ocid="compose.voice_preview"
          />

          <button
            type="button"
            onClick={reRecord}
            data-ocid="compose.voice_rerecord_button"
            className="flex items-center gap-2 px-4 py-2 font-lora text-sm transition-all hover:brightness-110"
            style={{
              background: "oklch(0.88 0.04 78)",
              color: "oklch(0.32 0.08 52)",
              border: "1px solid oklch(0.65 0.08 58)",
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Re-record
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default function ComposeLetter() {
  const [composeMode, setComposeMode] = useState<"letter" | "voice">("letter");
  const [usernameSearch, setUsernameSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<{
    name: string;
    city?: string;
    principalText?: string;
    principal?: Principal;
  } | null>(null);
  const [letterBody, setLetterBody] = useState("");
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [selectedStamp, setSelectedStamp] = useState<string>(
    StampType.indian as string,
  );
  const [envelopeFlying, setEnvelopeFlying] = useState(false);

  const { data: callerProfile } = useCallerProfile();

  const findByUsername = useFindUserByUsername();
  const sendLetter = useSendLetter();

  const handleFindByUsername = async () => {
    if (!usernameSearch.trim()) {
      toast.error("Please enter a username.");
      return;
    }
    try {
      const result = await findByUsername.mutateAsync(usernameSearch.trim());
      if (result) {
        setSelectedRecipient({
          name: result.name,
          city: result.city,
          principal: result.principal,
        });
      } else {
        toast.error("No user found with that username.");
      }
    } catch {
      toast.error("Failed to search. Please try again.");
    }
  };

  const handleSend = async () => {
    if (!selectedRecipient) {
      toast.error("Please select a recipient.");
      return;
    }

    let body: string;

    if (composeMode === "voice") {
      if (!voiceBlob) {
        toast.error("Please record a voice note before sending.");
        return;
      }
      // Convert blob to base64 dataURL
      body = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(voiceBlob);
      });
      body = `VOICE_NOTE:${body}`;
    } else {
      if (!letterBody.trim()) {
        toast.error("Please write your letter.");
        return;
      }
      body = letterBody;
    }

    let toPrincipal: Principal;
    if (selectedRecipient.principal) {
      toPrincipal = selectedRecipient.principal;
    } else if (selectedRecipient.principalText) {
      toPrincipal = createPrincipal(selectedRecipient.principalText);
    } else {
      toast.error("Could not resolve recipient address.");
      return;
    }

    // Map custom stamp values to the nearest backend StampType
    const stampForBackend = (
      selectedStamp === StampType.pakistani
        ? StampType.pakistani
        : StampType.indian
    ) as StampType;

    try {
      const letterId = await sendLetter.mutateAsync({
        to: toPrincipal,
        body,
        stamp: stampForBackend,
      });

      saveDelivery({
        letterId: String(letterId),
        senderCity: callerProfile?.city ?? "Unknown",
        recipientCity: selectedRecipient.city ?? "Unknown",
        startTime: Date.now(),
        durationMs: (Math.floor(Math.random() * 120) + 1) * 1000,
      });

      setEnvelopeFlying(true);
      toast.success(
        composeMode === "voice"
          ? "Your voice note has been sealed and dispatched! \uD83C\uDF99\uFE0F\uD83D\uDCEC"
          : "Your letter has been sealed and dispatched! \uD83D\uDCEC",
      );
      setTimeout(() => {
        setEnvelopeFlying(false);
        setLetterBody("");
        setVoiceBlob(null);
        setSelectedRecipient(null);
        setUsernameSearch("");
        setComposeMode("letter");
      }, 1000);
    } catch {
      toast.error("Failed to send. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
      data-ocid="compose.section"
    >
      <div className="text-center">
        <h2
          className="font-playfair text-3xl font-bold"
          style={{ color: "oklch(0.25 0.07 50)" }}
        >
          Compose a Letter
        </h2>
        <p
          className="font-lora italic text-sm mt-1"
          style={{ color: "oklch(0.50 0.07 55)" }}
        >
          Put pen to parchment and dispatch your words across the miles
        </p>
      </div>

      <div className="p-8 parchment-paper vintage-border relative">
        {/* Recipient */}
        <div className="mb-6">
          <Label
            className="font-playfair text-sm font-semibold block mb-2"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            To:
          </Label>
          {selectedRecipient ? (
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{
                background: "oklch(0.92 0.04 80)",
                border: "1px solid oklch(0.65 0.08 58)",
              }}
            >
              <div>
                <span
                  className="font-lora font-semibold"
                  style={{ color: "oklch(0.28 0.07 52)" }}
                >
                  {selectedRecipient.name}
                </span>
                {selectedRecipient.city && (
                  <span
                    className="ml-2 font-lora text-xs"
                    style={{ color: "oklch(0.52 0.07 56)" }}
                  >
                    \u2014 {selectedRecipient.city}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRecipient(null);
                  setUsernameSearch("");
                  findByUsername.reset();
                }}
                className="text-xs font-lora"
                style={{ color: "oklch(0.36 0.14 22)" }}
              >
                \u2715 Change
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <AtSign
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "oklch(0.52 0.07 56)" }}
                  />
                  <Input
                    value={usernameSearch}
                    onChange={(e) => setUsernameSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFindByUsername();
                    }}
                    placeholder="e.g. ranjit_42"
                    className="pl-9 rounded-none font-lora bg-transparent"
                    style={{
                      borderColor: "oklch(0.65 0.08 58)",
                      color: "oklch(0.28 0.07 52)",
                    }}
                    data-ocid="compose.username_input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFindByUsername}
                  disabled={findByUsername.isPending || !usernameSearch.trim()}
                  data-ocid="compose.find_username_button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-lora text-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
                    color: "oklch(0.97 0.02 80)",
                    border: "1px solid oklch(0.55 0.09 52)",
                  }}
                >
                  {findByUsername.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Find"
                  )}
                </button>
              </div>
              {findByUsername.isSuccess && !findByUsername.data && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs font-lora"
                  style={{ color: "oklch(0.40 0.15 22)" }}
                  data-ocid="compose.username_not_found_error_state"
                >
                  No user found with that username.
                </motion.p>
              )}
              <p
                className="mt-2 text-xs font-lora italic"
                style={{ color: "oklch(0.55 0.07 58)" }}
              >
                Ask your friend for their username from their Profile page.
              </p>
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div className="mb-5">
          <div
            className="inline-flex rounded-sm overflow-hidden"
            style={{ border: "1px solid oklch(0.65 0.08 58)" }}
            data-ocid="compose.mode_toggle"
          >
            <button
              type="button"
              onClick={() => setComposeMode("letter")}
              data-ocid="compose.letter_mode_tab"
              className="flex items-center gap-2 px-5 py-2 font-lora text-sm transition-all"
              style={{
                background:
                  composeMode === "letter"
                    ? "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))"
                    : "oklch(0.92 0.04 80)",
                color:
                  composeMode === "letter"
                    ? "oklch(0.97 0.02 80)"
                    : "oklch(0.42 0.08 52)",
              }}
            >
              ✍️ Write Letter
            </button>
            <button
              type="button"
              onClick={() => setComposeMode("voice")}
              data-ocid="compose.voice_mode_tab"
              className="flex items-center gap-2 px-5 py-2 font-lora text-sm transition-all"
              style={{
                background:
                  composeMode === "voice"
                    ? "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))"
                    : "oklch(0.92 0.04 80)",
                color:
                  composeMode === "voice"
                    ? "oklch(0.97 0.02 80)"
                    : "oklch(0.42 0.08 52)",
                borderLeft: "1px solid oklch(0.65 0.08 58)",
              }}
            >
              {composeMode === "voice" ? (
                <Mic className="w-3.5 h-3.5" />
              ) : (
                <MicOff className="w-3.5 h-3.5" />
              )}
              Voice Note
            </button>
          </div>
        </div>

        {/* Letter body or Voice recorder */}
        <AnimatePresence mode="wait">
          {composeMode === "letter" ? (
            <motion.div
              key="letter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4"
            >
              <Label
                className="font-playfair text-sm font-semibold block mb-2"
                style={{ color: "oklch(0.32 0.08 52)" }}
              >
                Your Letter:
              </Label>
              <Textarea
                value={letterBody}
                onChange={(e) => setLetterBody(e.target.value)}
                placeholder="Dear friend,…"
                className="parchment-paper rounded-none font-lora resize-none border-0 focus-visible:ring-1 min-h-[220px] text-base leading-7"
                style={{
                  color: "oklch(0.22 0.06 50)",
                  caretColor: "oklch(0.28 0.15 264)",
                }}
                data-ocid="compose.textarea"
              />
            </motion.div>
          ) : (
            <motion.div
              key="voice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4"
            >
              <Label
                className="font-playfair text-sm font-semibold block mb-1"
                style={{ color: "oklch(0.32 0.08 52)" }}
              >
                Voice Note:
              </Label>
              <div
                className="parchment-paper border"
                style={{ borderColor: "oklch(0.65 0.08 58)" }}
              >
                <VoiceRecorder onRecorded={setVoiceBlob} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stamp picker */}
        <div className="mb-6">
          <Label
            className="font-playfair text-sm font-semibold block mb-3"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            Choose Your Stamp:
          </Label>
          <div
            className="flex gap-4 overflow-x-auto pb-3"
            style={{ scrollbarWidth: "thin" }}
            data-ocid="compose.stamp_picker"
          >
            {STAMP_OPTIONS.map(({ group, stamps }) =>
              stamps.map((stamp) => (
                <button
                  type="button"
                  key={stamp.value}
                  onClick={() => setSelectedStamp(stamp.value)}
                  data-ocid={`compose.stamp_${stamp.value}_toggle`}
                  className="flex flex-col items-center gap-1 flex-shrink-0 transition-all duration-200"
                  title={`${group} — ${stamp.label}`}
                >
                  {stamp.image ? (
                    <div
                      className="relative"
                      style={{
                        transform:
                          selectedStamp === stamp.value
                            ? "rotate(-3deg) scale(1.08)"
                            : "rotate(2deg)",
                        transition: "transform 0.15s",
                        filter:
                          selectedStamp === stamp.value
                            ? "drop-shadow(0 4px 12px oklch(0.22 0.06 55 / 0.4))"
                            : "none",
                      }}
                    >
                      <img
                        src={stamp.image}
                        alt={stamp.label}
                        className="w-20 h-auto"
                        style={{
                          outline:
                            selectedStamp === stamp.value
                              ? "3px solid oklch(0.36 0.14 22)"
                              : "1px solid oklch(0.65 0.08 58)",
                          outlineOffset: "3px",
                        }}
                      />
                      {selectedStamp === stamp.value && (
                        <span
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{
                            background: "oklch(0.36 0.14 22)",
                            color: "white",
                          }}
                        >
                          \u2713
                        </span>
                      )}
                    </div>
                  ) : (
                    <CssStamp
                      flag={stamp.flag}
                      label={stamp.label}
                      color={stamp.color}
                      bg={stamp.bg}
                      selected={selectedStamp === stamp.value}
                    />
                  )}
                  <p
                    className="text-center font-lora"
                    style={{
                      color: "oklch(0.42 0.10 48)",
                      fontSize: "10px",
                      fontWeight: selectedStamp === stamp.value ? 700 : 400,
                    }}
                  >
                    {group}
                  </p>
                </button>
              )),
            )}
          </div>
        </div>

        {/* Flying envelope */}
        <AnimatePresence>
          {envelopeFlying && (
            <motion.div
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: 280, y: -180, opacity: 0, rotate: 15 }}
              transition={{ duration: 0.85, ease: "easeIn" }}
              className="absolute top-1/2 left-1/2 text-6xl pointer-events-none z-50"
            >
              {composeMode === "voice" ? "\uD83C\uDF99\uFE0F" : "\u2709"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSend}
            disabled={sendLetter.isPending || envelopeFlying}
            data-ocid="compose.submit_button"
            className="inline-flex items-center gap-3 px-8 py-3 font-lora text-base transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
              color: "oklch(0.97 0.02 80)",
              border: "2px solid oklch(0.55 0.09 52)",
              boxShadow: "3px 3px 0 oklch(0.22 0.06 50)",
            }}
          >
            {sendLetter.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Dispatching…
              </>
            ) : composeMode === "voice" ? (
              <>
                <Mic className="w-4 h-4" /> Seal &amp; Send Voice Note
              </>
            ) : (
              <>
                <span>\uD83D\uDCEE</span> Seal &amp; Send
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
