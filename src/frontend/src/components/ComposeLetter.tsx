import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { StampType } from "../backend.d";
import { useSearchProfiles, useSendLetter } from "../hooks/useQueries";
import { createPrincipal } from "../lib/principalUtils";

export default function ComposeLetter() {
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<{
    name: string;
    principalText?: string;
  } | null>(null);
  const [letterBody, setLetterBody] = useState("");
  const [selectedStamp, setSelectedStamp] = useState<StampType>(
    StampType.indian,
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [envelopeFlying, setEnvelopeFlying] = useState(false);

  const { data: searchResults } = useSearchProfiles(recipientSearch);
  const sendLetter = useSendLetter();

  const handleSend = async () => {
    if (!selectedRecipient) {
      toast.error("Please select a recipient.");
      return;
    }
    if (!letterBody.trim()) {
      toast.error("Please write your letter.");
      return;
    }
    if (!selectedRecipient.principalText) {
      toast.error("Could not resolve recipient.");
      return;
    }

    try {
      const toPrincipal = createPrincipal(selectedRecipient.principalText);
      await sendLetter.mutateAsync({
        to: toPrincipal,
        body: letterBody,
        stamp: selectedStamp,
      });
      setEnvelopeFlying(true);
      toast.success("Your letter has been sealed and dispatched! &#128236;");
      setTimeout(() => {
        setEnvelopeFlying(false);
        setLetterBody("");
        setSelectedRecipient(null);
        setRecipientSearch("");
      }, 1000);
    } catch {
      toast.error("Failed to send letter. Please try again.");
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
        <div className="mb-6 relative">
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
              <span
                className="font-lora"
                style={{ color: "oklch(0.28 0.07 52)" }}
              >
                {selectedRecipient.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedRecipient(null);
                  setRecipientSearch("");
                }}
                className="text-xs font-lora"
                style={{ color: "oklch(0.36 0.14 22)" }}
              >
                &#10005; Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "oklch(0.52 0.07 56)" }}
              />
              <Input
                value={recipientSearch}
                onChange={(e) => {
                  setRecipientSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search recipient by name…"
                className="pl-9 rounded-none font-lora bg-transparent"
                style={{
                  borderColor: "oklch(0.65 0.08 58)",
                  color: "oklch(0.28 0.07 52)",
                }}
                data-ocid="compose.search_input"
              />
              <AnimatePresence>
                {showDropdown && searchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute z-50 top-full left-0 right-0 border shadow-parchment"
                    style={{
                      background: "oklch(0.96 0.035 82)",
                      borderColor: "oklch(0.65 0.08 58)",
                    }}
                    data-ocid="compose.dropdown_menu"
                  >
                    {searchResults.map((p) => (
                      <button
                        type="button"
                        key={p.name}
                        onClick={() => {
                          setSelectedRecipient({ name: p.name });
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 font-lora text-sm hover:bg-secondary transition-colors"
                        style={{ color: "oklch(0.28 0.07 52)" }}
                      >
                        <span className="font-semibold">{p.name}</span>
                        {p.city && (
                          <span
                            className="ml-2 text-xs"
                            style={{ color: "oklch(0.52 0.07 56)" }}
                          >
                            &mdash; {p.city}
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Letter body */}
        <div className="mb-4">
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
        </div>

        {/* Stamp picker */}
        <div className="mb-6">
          <Label
            className="font-playfair text-sm font-semibold block mb-3"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            Choose Your Stamp:
          </Label>
          <div className="flex gap-8">
            {[
              {
                type: StampType.indian,
                src: "/assets/generated/stamp-india.dim_200x240.png",
                label: "India Post",
              },
              {
                type: StampType.pakistani,
                src: "/assets/generated/stamp-pakistan.dim_200x240.png",
                label: "Pakistan Post",
              },
            ].map(({ type, src, label }) => (
              <button
                type="button"
                key={type}
                onClick={() => setSelectedStamp(type)}
                data-ocid={`compose.stamp_${type}_toggle`}
                className="relative transition-all duration-200"
                style={{
                  transform:
                    selectedStamp === type
                      ? "rotate(-3deg) scale(1.08)"
                      : "rotate(2deg)",
                  filter:
                    selectedStamp === type
                      ? "drop-shadow(0 4px 12px oklch(0.22 0.06 55 / 0.4))"
                      : "none",
                }}
              >
                <img
                  src={src}
                  alt={label}
                  className="w-24 h-auto"
                  style={{
                    outline:
                      selectedStamp === type
                        ? "3px solid oklch(0.36 0.14 22)"
                        : "1px solid oklch(0.65 0.08 58)",
                    outlineOffset: "3px",
                  }}
                />
                {selectedStamp === type && (
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: "oklch(0.36 0.14 22)",
                      color: "white",
                    }}
                  >
                    &#10003;
                  </span>
                )}
                <p
                  className="text-center mt-1.5 font-lora text-xs"
                  style={{ color: "oklch(0.42 0.10 48)" }}
                >
                  {label}
                </p>
              </button>
            ))}
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
              &#9993;
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
            ) : (
              <>
                <span>&#128253;</span> Seal &amp; Send
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
