import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.90 0.05 82) 0%, oklch(0.85 0.07 75) 50%, oklch(0.80 0.06 68) 100%)",
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.42 0.10 48 / 0.12) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Corner ornaments */}
      {(
        [
          { pos: "top-6 left-6", bt: true, bb: false, bl: true, br: false },
          { pos: "top-6 right-6", bt: true, bb: false, bl: false, br: true },
          { pos: "bottom-6 left-6", bt: false, bb: true, bl: true, br: false },
          { pos: "bottom-6 right-6", bt: false, bb: true, bl: false, br: true },
        ] as const
      ).map(({ pos, bt, bb, bl, br }) => (
        <div
          key={pos}
          className={`absolute ${pos} w-14 h-14 opacity-40`}
          style={{
            borderTop: bt ? "3px solid oklch(0.42 0.10 48)" : undefined,
            borderBottom: bb ? "3px solid oklch(0.42 0.10 48)" : undefined,
            borderLeft: bl ? "3px solid oklch(0.42 0.10 48)" : undefined,
            borderRight: br ? "3px solid oklch(0.42 0.10 48)" : undefined,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center px-8 max-w-2xl relative z-10"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
          className="mb-8"
        >
          <div
            className="inline-flex items-center justify-center w-40 h-40 rounded-2xl mx-auto overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at 35% 35%, oklch(0.50 0.10 50), oklch(0.30 0.08 48))",
              boxShadow: "0 8px 32px oklch(0.30 0.08 48 / 0.4)",
            }}
          >
            <img
              src="/assets/uploads/1774446462824-019d2747-ebb7-7688-8af6-5c7a0b08f63d-1.png"
              alt="POSTMAN logo"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-playfair text-7xl font-bold mb-2 tracking-tight"
          style={{ color: "oklch(0.22 0.06 50)" }}
        >
          POSTMAN
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="font-dancing text-2xl mb-3"
          style={{ color: "oklch(0.36 0.14 22)" }}
        >
          The Virtual Letter
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="mx-auto mb-6 h-px w-48"
          style={{ background: "oklch(0.42 0.10 48 / 0.45)" }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="font-lora italic text-lg mb-12"
          style={{ color: "oklch(0.38 0.08 52)" }}
        >
          &ldquo;Send letters across time, not just distance&rdquo;
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.85, type: "spring" }}
        >
          <button
            type="button"
            onClick={() => login()}
            disabled={isLoggingIn}
            data-ocid="landing.login_button"
            className="inline-flex items-center gap-3 px-10 py-4 font-lora font-semibold text-lg transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
              color: "oklch(0.97 0.02 80)",
              border: "2px solid oklch(0.55 0.09 52)",
              boxShadow: "4px 4px 0 oklch(0.22 0.06 50)",
            }}
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="text-xl">&#128253;</span>
            )}
            {isLoggingIn
              ? "Opening the post office\u2026"
              : "Enter the Post Office"}
          </button>
        </motion.div>
      </motion.div>

      <div
        className="absolute bottom-4 text-xs font-lora"
        style={{ color: "oklch(0.50 0.07 52 / 0.7)" }}
      >
        &copy; {new Date().getFullYear()}. Built with &#9829; using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
