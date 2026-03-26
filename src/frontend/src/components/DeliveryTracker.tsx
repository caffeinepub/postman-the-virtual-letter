import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getDelivery, markDelivered } from "../lib/deliveryStore";

// Known city coordinates on a 800x400 SVG viewBox (mercator-ish approximation)
const CITIES: Record<string, { x: number; y: number; label: string }> = {
  london: { x: 370, y: 105, label: "London" },
  paris: { x: 378, y: 118, label: "Paris" },
  "new york": { x: 205, y: 128, label: "New York" },
  newyork: { x: 205, y: 128, label: "New York" },
  mumbai: { x: 568, y: 195, label: "Mumbai" },
  karachi: { x: 545, y: 185, label: "Karachi" },
  dubai: { x: 536, y: 170, label: "Dubai" },
  tokyo: { x: 688, y: 140, label: "Tokyo" },
  sydney: { x: 700, y: 295, label: "Sydney" },
  lahore: { x: 558, y: 155, label: "Lahore" },
  delhi: { x: 570, y: 158, label: "Delhi" },
  islamabad: { x: 557, y: 148, label: "Islamabad" },
  beijing: { x: 660, y: 140, label: "Beijing" },
  moscow: { x: 467, y: 88, label: "Moscow" },
  cairo: { x: 455, y: 165, label: "Cairo" },
  toronto: { x: 210, y: 118, label: "Toronto" },
  chicago: { x: 200, y: 125, label: "Chicago" },
  berlin: { x: 405, y: 102, label: "Berlin" },
  rome: { x: 408, y: 130, label: "Rome" },
};

function resolveCity(name: string): { x: number; y: number; label: string } {
  const lower = name.toLowerCase().trim();
  // exact match
  if (CITIES[lower]) return CITIES[lower];
  // partial match
  for (const key of Object.keys(CITIES)) {
    if (lower.includes(key) || key.includes(lower)) return CITIES[key];
  }
  return CITIES.mumbai; // default
}

function playBell() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
    // Second ding
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1000;
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
    osc2.start(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 1.8);
  } catch {
    // audio not available
  }
}

function fireNotification(recipientCity: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("📮 Letter delivered!", {
      body: `Your letter to ${recipientCity} has been delivered and awaits a signature.`,
      icon: "/favicon.ico",
    });
  }
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Props {
  letterId: string;
  senderCity: string;
  recipientCity: string;
}

export default function DeliveryTracker({
  letterId,
  senderCity,
  recipientCity,
}: Props) {
  const delivery = getDelivery(letterId);
  const startTime = delivery?.startTime ?? Date.now();
  const durationMs = delivery?.durationMs ?? 60000;

  const sender = resolveCity(senderCity);
  const recipient = resolveCity(recipientCity);

  const [elapsed, setElapsed] = useState(() => Date.now() - startTime);
  const [delivered, setDelivered] = useState(
    () => delivery?.delivered ?? elapsed >= durationMs,
  );
  const notifiedRef = useRef(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (delivered) return;
    const id = setInterval(() => {
      const e = Date.now() - startTime;
      setElapsed(e);
      if (e >= durationMs && !notifiedRef.current) {
        notifiedRef.current = true;
        setDelivered(true);
        markDelivered(letterId);
        playBell();
        fireNotification(recipientCity);
      }
    }, 500);
    return () => clearInterval(id);
  }, [delivered, startTime, durationMs, letterId, recipientCity]);

  const remaining = Math.max(0, durationMs - elapsed);
  const progress = Math.min(100, (elapsed / durationMs) * 100);

  // SVG path: quadratic bezier arc between sender and recipient
  const cx = (sender.x + recipient.x) / 2;
  const cy = Math.min(sender.y, recipient.y) - 60;
  const pathD = `M ${sender.x} ${sender.y} Q ${cx} ${cy} ${recipient.x} ${recipient.y}`;

  return (
    <div
      className="mt-3 rounded overflow-hidden vintage-border"
      style={{ background: "oklch(0.95 0.035 82)" }}
      data-ocid="outbox.tracker.panel"
    >
      {/* Header */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{
          background: "oklch(0.88 0.05 78)",
          borderBottom: "1px solid oklch(0.74 0.07 60 / 0.5)",
        }}
      >
        <span
          className="font-playfair text-sm font-semibold"
          style={{ color: "oklch(0.28 0.07 52)" }}
        >
          📍 Tracking Letter #{letterId.padStart(4, "0")}
        </span>
        <AnimatePresence mode="wait">
          {delivered ? (
            <motion.span
              key="delivered"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-playfair text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: "oklch(0.42 0.10 140)", color: "white" }}
              data-ocid="outbox.tracker.success_state"
            >
              ✓ DELIVERED
            </motion.span>
          ) : (
            <motion.span
              key="timer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-lora text-xs tabular-nums"
              style={{ color: "oklch(0.42 0.10 48)" }}
              data-ocid="outbox.tracker.loading_state"
            >
              ETA: {formatTime(remaining)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Map SVG */}
      <div
        className="relative"
        style={{ background: "oklch(0.92 0.04 200 / 0.2)" }}
      >
        <svg
          viewBox="0 0 800 400"
          className="w-full"
          style={{ maxHeight: 220 }}
          role="img"
          aria-labelledby="map-title"
        >
          <title id="map-title">Delivery map</title>
          {/* Ocean background */}
          <rect width="800" height="400" fill="oklch(0.78 0.08 220 / 0.3)" />

          {/* Simplified continent outlines */}
          {/* North America */}
          <path
            d="M 80 60 L 240 55 L 260 80 L 280 100 L 270 140 L 240 170 L 200 175 L 160 160 L 120 140 L 90 120 L 70 90 Z"
            fill="oklch(0.82 0.06 95 / 0.8)"
            stroke="oklch(0.65 0.07 75 / 0.6)"
            strokeWidth="1"
          />
          {/* South America */}
          <path
            d="M 200 190 L 240 185 L 255 200 L 260 230 L 250 270 L 230 300 L 210 310 L 195 290 L 185 260 L 185 220 Z"
            fill="oklch(0.82 0.06 95 / 0.8)"
            stroke="oklch(0.65 0.07 75 / 0.6)"
            strokeWidth="1"
          />
          {/* Europe */}
          <path
            d="M 340 70 L 430 65 L 445 80 L 440 110 L 420 125 L 390 130 L 365 115 L 345 95 Z"
            fill="oklch(0.82 0.06 95 / 0.8)"
            stroke="oklch(0.65 0.07 75 / 0.6)"
            strokeWidth="1"
          />
          {/* Africa */}
          <path
            d="M 370 135 L 460 130 L 475 155 L 480 200 L 460 250 L 440 280 L 415 285 L 395 270 L 375 240 L 365 200 L 360 165 Z"
            fill="oklch(0.82 0.06 95 / 0.8)"
            stroke="oklch(0.65 0.07 75 / 0.6)"
            strokeWidth="1"
          />
          {/* Asia */}
          <path
            d="M 450 60 L 700 55 L 720 80 L 715 130 L 690 155 L 640 160 L 590 165 L 545 175 L 510 165 L 470 145 L 445 120 L 440 85 Z"
            fill="oklch(0.82 0.06 95 / 0.8)"
            stroke="oklch(0.65 0.07 75 / 0.6)"
            strokeWidth="1"
          />
          {/* Australia */}
          <path
            d="M 650 255 L 740 250 L 755 270 L 750 300 L 720 315 L 680 310 L 655 290 L 645 270 Z"
            fill="oklch(0.82 0.06 95 / 0.8)"
            stroke="oklch(0.65 0.07 75 / 0.6)"
            strokeWidth="1"
          />

          {/* Map grid lines (vintage look) */}
          {[80, 160, 240, 320].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="800"
              y2={y}
              stroke="oklch(0.74 0.07 60 / 0.15)"
              strokeWidth="0.5"
              strokeDasharray="4 8"
            />
          ))}
          {[100, 200, 300, 400, 500, 600, 700].map((x) => (
            <line
              key={x}
              x1={x}
              y1="0"
              x2={x}
              y2="400"
              stroke="oklch(0.74 0.07 60 / 0.15)"
              strokeWidth="0.5"
              strokeDasharray="4 8"
            />
          ))}

          {/* Delivery path (dashed vintage arc) */}
          <path
            d={pathD}
            fill="none"
            stroke="oklch(0.42 0.10 48 / 0.4)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          {/* Animated path highlight */}
          {!delivered && (
            <motion.path
              d={pathD}
              fill="none"
              stroke="oklch(0.42 0.10 48)"
              strokeWidth="2"
              strokeDasharray="6 4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.8 }}
              animate={{ pathLength: progress / 100, opacity: 1 }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          )}
          {delivered && (
            <path
              d={pathD}
              fill="none"
              stroke="oklch(0.42 0.10 140)"
              strokeWidth="2"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          )}

          {/* City dots */}
          <circle
            cx={sender.x}
            cy={sender.y}
            r="5"
            fill="oklch(0.42 0.10 48)"
            stroke="white"
            strokeWidth="1.5"
          />
          <text
            x={sender.x}
            y={sender.y - 9}
            textAnchor="middle"
            fill="oklch(0.22 0.06 50)"
            fontSize="9"
            fontFamily="serif"
            fontStyle="italic"
          >
            {sender.label}
          </text>

          <circle
            cx={recipient.x}
            cy={recipient.y}
            r="5"
            fill="oklch(0.36 0.14 22)"
            stroke="white"
            strokeWidth="1.5"
          />
          <text
            x={recipient.x}
            y={recipient.y - 9}
            textAnchor="middle"
            fill="oklch(0.22 0.06 50)"
            fontSize="9"
            fontFamily="serif"
            fontStyle="italic"
          >
            {recipient.label}
          </text>

          {/* Postman figure moving along path */}
          {!delivered && (
            <motion.g
              style={{
                offsetPath: `path('${pathD}')`,
                offsetRotate: "auto",
              }}
              animate={{
                offsetDistance: [
                  `${Math.min(progress, 99)}%`,
                  `${Math.min(progress + 2, 99)}%`,
                ],
              }}
              transition={{ duration: 0.5, ease: "linear" }}
            >
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
              >
                📮
              </text>
            </motion.g>
          )}
          {delivered && (
            <g
              transform={`translate(${recipient.x - 10}, ${recipient.y - 22})`}
            >
              <text
                fontSize="18"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
              >
                🎉
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Progress + info */}
      <div className="px-4 py-3 space-y-2">
        <div
          className="flex items-center justify-between text-xs font-lora"
          style={{ color: "oklch(0.42 0.10 48)" }}
        >
          <span>
            From: <strong>{senderCity || sender.label}</strong>
          </span>
          <span>✉ →</span>
          <span>
            To: <strong>{recipientCity || recipient.label}</strong>
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2"
          style={{ background: "oklch(0.82 0.05 78)" }}
        />
        <div
          className="flex items-center justify-between text-xs font-lora italic"
          style={{ color: "oklch(0.52 0.07 56)" }}
        >
          {delivered ? (
            <span>📬 Delivered successfully</span>
          ) : (
            <>
              <span>📮 Postman is on the way…</span>
              <span>{Math.round(progress)}% complete</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
