import type { Principal } from "@icp-sdk/core/principal";
import { motion } from "motion/react";
import { useOutbox } from "../hooks/useQueries";

interface Props {
  principal: Principal | undefined;
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
            <motion.div
              key={String(letterId)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              data-ocid={`outbox.item.${i + 1}`}
              className="envelope-card p-4 pr-6 flex items-center gap-4"
            >
              <div className="text-4xl flex-shrink-0 opacity-60">&#128232;</div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-playfair font-semibold text-base"
                  style={{ color: "oklch(0.28 0.07 52)" }}
                >
                  Letter #{String(letterId).padStart(4, "0")}
                </p>
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
              </div>
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
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
