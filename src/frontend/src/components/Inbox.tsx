import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Principal } from "@icp-sdk/core/principal";
import { Bell } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInbox } from "../hooks/useQueries";

interface Props {
  principal: Principal | undefined;
}

const nostalgiaPhrases = [
  "A letter of great importance has arrived from afar.",
  "Words carried by the wind, now resting in your hands.",
  "The postman rang twice — this letter awaited your eyes alone.",
  "Penned with care, sealed with hope, delivered with love.",
  "Across mountains and rivers this missive has traveled to reach you.",
  "The ink is barely dry, yet the heart behind it beats eternally.",
];

export default function Inbox({ principal }: Props) {
  const { data: inbox, isLoading } = useInbox(principal);
  const [selectedLetter, setSelectedLetter] = useState<bigint | null>(null);
  const letters = inbox ?? [];

  if (isLoading) {
    return (
      <div
        className="flex justify-center py-20"
        data-ocid="inbox.loading_state"
      >
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">&#128236;</div>
          <p className="font-lora italic text-muted-foreground">
            Sorting through the mail…
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-ocid="inbox.section"
    >
      <div className="flex items-center justify-between">
        <h2
          className="font-playfair text-3xl font-bold"
          style={{ color: "oklch(0.25 0.07 50)" }}
        >
          Your Inbox
        </h2>
        <div className="flex items-center gap-2">
          <Bell
            className={`w-6 h-6 ${letters.length > 0 ? "animate-bell" : ""}`}
            style={{ color: "oklch(0.42 0.10 48)" }}
          />
          <span
            className="font-lora text-sm"
            style={{ color: "oklch(0.42 0.10 48)" }}
          >
            {letters.length} letter{letters.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {letters.length === 0 ? (
        <div
          className="text-center py-16 vintage-border"
          style={{ background: "oklch(0.95 0.035 82)" }}
          data-ocid="inbox.empty_state"
        >
          <div className="text-6xl mb-4">&#128237;</div>
          <p
            className="font-playfair text-xl"
            style={{ color: "oklch(0.38 0.08 52)" }}
          >
            No letters yet
          </p>
          <p
            className="font-lora italic text-sm mt-2"
            style={{ color: "oklch(0.52 0.07 56)" }}
          >
            The postman has not visited today.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {letters.map((letterId, i) => (
            <motion.button
              key={String(letterId)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setSelectedLetter(letterId)}
              data-ocid={`inbox.item.${i + 1}`}
              className="w-full text-left envelope-card p-4 pr-6 flex items-center gap-4 hover:brightness-95 transition-all"
            >
              <div className="text-4xl flex-shrink-0">&#9993;</div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-playfair font-semibold text-base"
                  style={{ color: "oklch(0.28 0.07 52)" }}
                >
                  Letter #{String(letterId).padStart(4, "0")}
                </p>
                <p
                  className="font-lora italic text-xs mt-0.5 truncate"
                  style={{ color: "oklch(0.50 0.07 55)" }}
                >
                  {nostalgiaPhrases[Number(letterId) % nostalgiaPhrases.length]}
                </p>
              </div>
              <div
                className="flex-shrink-0 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center opacity-60"
                style={{ borderColor: "oklch(0.42 0.10 48)" }}
              >
                <span
                  className="text-xs font-playfair"
                  style={{ color: "oklch(0.42 0.10 48)" }}
                >
                  POST
                </span>
                <span
                  className="text-xs font-playfair"
                  style={{ color: "oklch(0.42 0.10 48)" }}
                >
                  2026
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <Dialog
        open={selectedLetter !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLetter(null);
        }}
      >
        <DialogContent
          className="max-w-md rounded-none vintage-border font-lora"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.96 0.04 85), oklch(0.91 0.05 78))",
          }}
          data-ocid="inbox.dialog"
        >
          <DialogHeader>
            <DialogTitle
              className="font-playfair text-2xl"
              style={{ color: "oklch(0.25 0.07 50)" }}
            >
              Letter #
              {selectedLetter !== null
                ? String(selectedLetter).padStart(4, "0")
                : ""}
            </DialogTitle>
            <DialogDescription
              className="font-lora italic"
              style={{ color: "oklch(0.42 0.10 48)" }}
            >
              A letter received
            </DialogDescription>
          </DialogHeader>
          <div className="parchment-paper p-6 mt-2">
            <p
              className="font-dancing text-xl leading-relaxed"
              style={{ color: "oklch(0.22 0.06 50)" }}
            >
              {selectedLetter !== null
                ? nostalgiaPhrases[
                    Number(selectedLetter) % nostalgiaPhrases.length
                  ]
                : ""}
            </p>
            <p
              className="font-lora italic text-xs mt-6 text-right"
              style={{ color: "oklch(0.50 0.07 55)" }}
            >
              &mdash; Delivered with care by POSTMAN
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedLetter(null)}
            data-ocid="inbox.close_button"
            className="w-full py-2 mt-2 font-lora text-sm transition-opacity hover:opacity-80"
            style={{
              background: "oklch(0.42 0.10 48)",
              color: "oklch(0.97 0.02 80)",
            }}
          >
            Close Letter
          </button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
