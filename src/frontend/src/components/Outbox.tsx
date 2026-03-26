import type { Principal } from "@icp-sdk/core/principal";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useGetLetterSignature, useOutbox } from "../hooks/useQueries";
import { getDelivery } from "../lib/deliveryStore";
import DeliveryTracker from "./DeliveryTracker";

interface Props {
  principal: Principal | undefined;
}

function LetterRow({ letterId, index }: { letterId: bigint; index: number }) {
  const delivery = getDelivery(String(letterId));
  const [expanded, setExpanded] = useState(true);
  const [receiptExpanded, setReceiptExpanded] = useState(false);
  const { data: signatureData } = useGetLetterSignature(letterId);
  const isSigned = !!signatureData;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      data-ocid={`outbox.item.${index + 1}`}
      className="envelope-card p-4 pr-6"
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl flex-shrink-0 opacity-60">&#128232;</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="font-playfair font-semibold text-base"
              style={{ color: "oklch(0.28 0.07 52)" }}
            >
              Letter #{String(letterId).padStart(4, "0")}
            </p>
            {isSigned && (
              <span
                className="inline-flex items-center gap-1 text-xs font-lora px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.90 0.12 142)",
                  color: "oklch(0.28 0.12 142)",
                }}
                data-ocid={`outbox.signed_badge.${index + 1}`}
              >
                ✓ Signed &amp; Delivered
              </span>
            )}
          </div>
          {delivery ? (
            <p
              className="font-lora italic text-xs mt-0.5"
              style={{ color: "oklch(0.50 0.07 55)" }}
            >
              {delivery.senderCity} → {delivery.recipientCity}
            </p>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span
                className="animate-compass inline-block text-sm"
                title="In Transit"
              >
                &#129517;
              </span>
              <p
                className="font-lora italic text-xs"
                style={{ color: "oklch(0.50 0.07 55)" }}
              >
                In Transit…
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSigned && (
            <button
              type="button"
              onClick={() => setReceiptExpanded((v) => !v)}
              className="p-1 rounded hover:bg-secondary transition-colors"
              style={{ color: "oklch(0.35 0.12 142)" }}
              data-ocid={`outbox.receipt.toggle.${index + 1}`}
              title={receiptExpanded ? "Hide receipt" : "View Receipt"}
            >
              {receiptExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
          <div
            className="flex-shrink-0 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center opacity-60"
            style={{ borderColor: "oklch(0.42 0.10 48)" }}
          >
            <span
              className="text-xs font-playfair"
              style={{ color: "oklch(0.42 0.10 48)" }}
            >
              SENT
            </span>
            <span
              className="text-xs font-playfair"
              style={{ color: "oklch(0.42 0.10 48)" }}
            >
              2026
            </span>
          </div>
          {delivery && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-1 rounded hover:bg-secondary transition-colors"
              style={{ color: "oklch(0.42 0.10 48)" }}
              data-ocid={`outbox.tracker.toggle.${index + 1}`}
              title={expanded ? "Hide tracker" : "Show tracker"}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {delivery && expanded && (
        <DeliveryTracker
          letterId={String(letterId)}
          senderCity={delivery.senderCity}
          recipientCity={delivery.recipientCity}
        />
      )}

      {isSigned && receiptExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 rounded-sm p-4 vintage-border"
          style={{ background: "oklch(0.94 0.04 83)" }}
          data-ocid={`outbox.receipt.card.${index + 1}`}
        >
          <p
            className="font-playfair text-sm font-semibold mb-2"
            style={{ color: "oklch(0.28 0.07 52)" }}
          >
            Recipient's Signature
          </p>
          <div
            className="border rounded-sm overflow-hidden"
            style={{ borderColor: "oklch(0.72 0.06 65)" }}
          >
            <img
              src={signatureData ?? ""}
              alt="Recipient signature"
              className="w-full max-h-32 object-contain"
              style={{ background: "#fffbf2" }}
            />
          </div>
          <p
            className="font-lora italic text-xs mt-2"
            style={{ color: "oklch(0.52 0.07 56)" }}
          >
            ✓ Signed and received by recipient
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Outbox({ principal }: Props) {
  const { data: outbox, isLoading } = useOutbox(principal);
  const letters = outbox ?? [];

  if (isLoading) {
    return (
      <div
        className="flex justify-center py-20"
        data-ocid="outbox.loading_state"
      >
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">&#128238;</div>
          <p className="font-lora italic text-muted-foreground">
            Checking the outbox…
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
      data-ocid="outbox.section"
    >
      <h2
        className="font-playfair text-3xl font-bold"
        style={{ color: "oklch(0.25 0.07 50)" }}
      >
        Sent Letters
      </h2>

      {letters.length === 0 ? (
        <div
          className="text-center py-16 vintage-border"
          style={{ background: "oklch(0.95 0.035 82)" }}
          data-ocid="outbox.empty_state"
        >
          <div className="text-6xl mb-4">&#128228;</div>
          <p
            className="font-playfair text-xl"
            style={{ color: "oklch(0.38 0.08 52)" }}
          >
            No letters sent yet
          </p>
          <p
            className="font-lora italic text-sm mt-2"
            style={{ color: "oklch(0.52 0.07 56)" }}
          >
            Compose your first letter and dispatch it into the world.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {letters.map((letterId, i) => (
            <LetterRow key={String(letterId)} letterId={letterId} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
