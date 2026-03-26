import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCheckUsername, useSetUsername } from "../hooks/useQueries";

function validateUsername(username: string): string[] {
  const errors: string[] = [];
  if (username.length < 3 || username.length > 30) {
    errors.push("3–30 characters");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Letters, digits, underscores only");
  }
  const digitCount = (username.match(/\d/g) ?? []).length;
  if (digitCount < 2) {
    errors.push("At least 2 digits required");
  }
  return errors;
}

interface RuleRowProps {
  valid: boolean;
  label: string;
  touched: boolean;
}

function RuleRow({ valid, label, touched }: RuleRowProps) {
  if (!touched) {
    return (
      <span
        className="flex items-center gap-1.5 font-lora text-xs"
        style={{ color: "oklch(0.58 0.07 56)" }}
      >
        <span
          className="w-3.5 h-3.5 rounded-full border-2 inline-block"
          style={{ borderColor: "oklch(0.65 0.08 58)" }}
        />
        {label}
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1.5 font-lora text-xs transition-colors"
      style={{ color: valid ? "oklch(0.42 0.14 145)" : "oklch(0.45 0.18 22)" }}
    >
      {valid ? (
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      {label}
    </span>
  );
}

interface UsernameSetupProps {
  onSuccess: () => void;
}

export default function UsernameSetup({ onSuccess }: UsernameSetupProps) {
  const [username, setUsername] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [touched, setTouched] = useState(false);

  const errors = validateUsername(username);
  const isValid = errors.length === 0;

  // Debounce availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isValid) setDebouncedUsername(username);
      else setDebouncedUsername("");
    }, 400);
    return () => clearTimeout(timer);
  }, [username, isValid]);

  const { data: isAvailable, isFetching: checkingAvailability } =
    useCheckUsername(debouncedUsername);

  const setUsername_ = useSetUsername();

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      const result = await setUsername_.mutateAsync(username);
      if (result.__kind__ === "ok") {
        toast.success("Username set! Welcome to POSTMAN. ✉");
        onSuccess();
      } else if (result.__kind__ === "error") {
        if (result.value === "taken") {
          toast.error("Username already taken. Try another.");
        } else if (result.value === "invalid") {
          toast.error("Username doesn't meet requirements.");
        } else {
          toast.error("Could not set username. Please try again.");
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const showAvailability =
    isValid && debouncedUsername === username && !checkingAvailability;
  const canSubmit = isValid && isAvailable === true && !setUsername_.isPending;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.96 0.04 85) 0%, oklch(0.90 0.06 75) 60%, oklch(0.85 0.07 68) 100%)",
      }}
      data-ocid="username_setup.section"
    >
      {/* Decorative postmark rings */}
      <div
        className="absolute top-16 right-16 w-32 h-32 rounded-full opacity-10 pointer-events-none"
        style={{ border: "3px solid oklch(0.42 0.10 48)" }}
      />
      <div
        className="absolute top-20 right-20 w-20 h-20 rounded-full opacity-10 pointer-events-none"
        style={{ border: "2px solid oklch(0.42 0.10 48)" }}
      />
      <div
        className="absolute bottom-24 left-12 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{ border: "3px solid oklch(0.42 0.10 48)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-7xl mb-4"
          >
            📮
          </motion.div>
          <h1
            className="font-playfair text-4xl font-bold mb-2"
            style={{ color: "oklch(0.25 0.07 50)" }}
          >
            Choose Your Handle
          </h1>
          <p
            className="font-lora italic text-sm"
            style={{ color: "oklch(0.48 0.08 54)" }}
          >
            Your unique postal identity — how others will find and write to you
          </p>
        </div>

        {/* Card */}
        <div
          className="p-8 vintage-border space-y-6"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.97 0.03 85), oklch(0.93 0.045 78))",
            boxShadow:
              "6px 6px 0 oklch(0.65 0.08 58 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.6)",
          }}
        >
          {/* Input */}
          <div className="space-y-2">
            <label
              htmlFor="username-input"
              className="font-playfair font-semibold text-sm block"
              style={{ color: "oklch(0.32 0.08 52)" }}
            >
              Username
            </label>
            <div className="relative">
              <Input
                id="username-input"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setTouched(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="e.g. ranjit_42"
                className="rounded-none font-lora bg-transparent pr-10"
                style={{
                  borderColor: !touched
                    ? "oklch(0.65 0.08 58)"
                    : !isValid
                      ? "oklch(0.55 0.18 22)"
                      : checkingAvailability
                        ? "oklch(0.65 0.08 58)"
                        : isAvailable === false
                          ? "oklch(0.55 0.18 22)"
                          : isAvailable === true
                            ? "oklch(0.50 0.14 145)"
                            : "oklch(0.65 0.08 58)",
                  color: "oklch(0.25 0.07 50)",
                }}
                data-ocid="username_setup.input"
                autoComplete="off"
                autoFocus
              />
              {/* Availability indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {touched && isValid && checkingAvailability && (
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    style={{ color: "oklch(0.52 0.07 56)" }}
                  />
                )}
                {showAvailability && isAvailable === true && (
                  <CheckCircle2
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.14 145)" }}
                  />
                )}
                {showAvailability && isAvailable === false && (
                  <XCircle
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.18 22)" }}
                  />
                )}
              </div>
            </div>

            {/* Availability message */}
            {touched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-lora"
              >
                {showAvailability && isAvailable === false && (
                  <span
                    style={{ color: "oklch(0.45 0.18 22)" }}
                    data-ocid="username_setup.error_state"
                  >
                    ✗ Username already taken
                  </span>
                )}
                {showAvailability && isAvailable === true && (
                  <span
                    style={{ color: "oklch(0.42 0.14 145)" }}
                    data-ocid="username_setup.success_state"
                  >
                    ✓ Username is available!
                  </span>
                )}
              </motion.div>
            )}
          </div>

          {/* Validation rules */}
          <div
            className="space-y-2 p-4"
            style={{
              background: "oklch(0.93 0.04 82)",
              border: "1px dashed oklch(0.65 0.08 58 / 0.6)",
            }}
          >
            <p
              className="font-playfair text-xs font-semibold mb-2"
              style={{ color: "oklch(0.38 0.08 52)" }}
            >
              Requirements:
            </p>
            <RuleRow
              touched={touched}
              valid={username.length >= 3 && username.length <= 30}
              label="3–30 characters"
            />
            <RuleRow
              touched={touched}
              valid={/^[a-zA-Z0-9_]+$/.test(username)}
              label="Letters, digits, and underscores only — no spaces"
            />
            <RuleRow
              touched={touched}
              valid={(username.match(/\d/g) ?? []).length >= 2}
              label="At least 2 digits"
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-ocid="username_setup.submit_button"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 font-lora text-base transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
              color: "oklch(0.97 0.02 80)",
              border: "2px solid oklch(0.55 0.09 52)",
              boxShadow: canSubmit ? "3px 3px 0 oklch(0.22 0.06 50)" : "none",
            }}
          >
            {setUsername_.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering your handle…
              </>
            ) : (
              <>📬 Claim This Username</>
            )}
          </button>

          <p
            className="text-center font-lora italic text-xs"
            style={{ color: "oklch(0.55 0.07 56)" }}
          >
            You can change this after 14 days (up to 5 times per year)
          </p>
        </div>
      </motion.div>
    </div>
  );
}
