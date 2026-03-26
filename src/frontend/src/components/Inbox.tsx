import type { Principal } from "@icp-sdk/core/principal";
import { Bell, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { LetterDetail } from "../backend.d";
import { useGetLetter, useInbox, useSignLetter } from "../hooks/useQueries";
import EnvelopeReveal from "./EnvelopeReveal";
import SignatureCapture from "./SignatureCapture";

interface Props {
  principal: Principal | undefined;
}

type FlowState = "idle" | "loading" | "signing" | "revealing";

function LetterOpener({
  letterId,
  onClose,
}: {
  letterId: bigint;
  onClose: () => void;
}) {
  const { data: letterDetail, isLoading } = useGetLetter(letterId);
  const signLetter = useSignLetter();
  const [flow, setFlow] = useState<FlowState>("loading");
  const [resolvedLetter, setResolvedLetter] = useState<LetterDetail | null>(
    null,
  );

  // Once letter loads, decide initial flow state
  if (isLoading || flow === "loading") {
    if (!isLoading && letterDetail !== undefined && flow === "loading") {
      // Transition out of loading
      if (letterDetail === null) {
        // Letter not found
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(15, 8, 3, 0.88)" }}
          >
            <div className="text-center">
              <p
                className="font-playfair text-xl"
                style={{ color: "oklch(0.92 0.04 85)" }}
              >
                Letter not found.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 py-2 font-lora text-sm rounded-sm"
                style={{
                  background: "oklch(0.42 0.10 48)",
                  color: "oklch(0.97 0.02 80)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        );
      }
      // Set flow based on signed state
      if (letterDetail.signed) {
        setResolvedLetter(letterDetail);
        setFlow("revealing");
      } else {
        setResolvedLetter(letterDetail);
        setFlow("signing");
      }
    }

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(15, 8, 3, 0.88)" }}
        data-ocid="inbox.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "oklch(0.88 0.04 82)" }}
          />
          <p
            className="font-lora italic"
            style={{ color: "oklch(0.88 0.04 82)" }}
          >
            Retrieving your letter…
          </p>
        </div>
      </div>
    );
  }

  if (flow === "signing") {
    return (
      <SignatureCapture
        onSign={async (signatureDataUrl) => {
          const ok = await signLetter.mutateAsync({
            letterId,
            signatureData: signatureDataUrl,
          });
          if (ok && resolvedLetter) {
            setFlow("revealing");
          }
        }}
        onCancel={onClose}
      />
    );
  }

  if (flow === "revealing" && resolvedLetter) {
    return <EnvelopeReveal letter={resolvedLetter} onClose={onClose} />;
  }

  return null;
}

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
    <>
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
                    Tap to open — signature required
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
      </motion.div>

      {selectedLetter !== null && (
        <LetterOpener
          letterId={selectedLetter}
          onClose={() => setSelectedLetter(null)}
        />
      )}
    </>
  );
}
