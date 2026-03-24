import type { Principal } from "@icp-sdk/core/principal";
import { Bell, Inbox, MapPin, Send, User } from "lucide-react";
import { motion } from "motion/react";
import { useCallerProfile, useInbox, useOutbox } from "../hooks/useQueries";

interface Props {
  principal: Principal | undefined;
}

export default function Dashboard({ principal }: Props) {
  const { data: profile, isLoading } = useCallerProfile();
  const { data: inbox } = useInbox(principal);
  const { data: outbox } = useOutbox(principal);

  if (isLoading) {
    return (
      <div
        className="flex justify-center py-20"
        data-ocid="dashboard.loading_state"
      >
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">&#128236;</div>
          <p className="font-lora italic text-muted-foreground">
            Checking the post box…
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center py-12"
        data-ocid="dashboard.setup_prompt"
      >
        <div className="text-6xl mb-4">&#128238;</div>
        <h2
          className="font-playfair text-3xl font-bold mb-3"
          style={{ color: "oklch(0.28 0.07 52)" }}
        >
          Welcome, New Postmaster!
        </h2>
        <p className="font-lora italic text-muted-foreground mb-6">
          Please set up your profile before you can send and receive letters.
        </p>
        <div
          className="p-6 vintage-border"
          style={{ background: "oklch(0.95 0.035 82)" }}
        >
          <p
            className="font-lora text-sm"
            style={{ color: "oklch(0.38 0.08 52)" }}
          >
            Head to the <strong>Profile</strong> tab above to add your name,
            city, and signature.
          </p>
        </div>
      </motion.div>
    );
  }

  const stats = [
    {
      icon: <Inbox className="w-6 h-6" />,
      label: "Letters Received",
      value: inbox?.length ?? 0,
      color: "oklch(0.28 0.15 264)",
    },
    {
      icon: <Send className="w-6 h-6" />,
      label: "Letters Sent",
      value: outbox?.length ?? 0,
      color: "oklch(0.36 0.14 22)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-ocid="dashboard.section"
    >
      <div
        className="p-6 vintage-border relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.95 0.04 84), oklch(0.91 0.05 78))",
        }}
      >
        <div
          className="absolute top-4 right-6 text-7xl opacity-8 pointer-events-none font-playfair select-none"
          style={{ opacity: 0.06 }}
        >
          &#9993;
        </div>
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "oklch(0.42 0.10 48)",
              color: "oklch(0.97 0.02 80)",
            }}
          >
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2
              className="font-playfair text-2xl font-bold"
              style={{ color: "oklch(0.25 0.07 50)" }}
            >
              Good day, {profile.name}!
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.52 0.08 56)" }}
              />
              <p
                className="font-lora text-sm"
                style={{ color: "oklch(0.42 0.08 54)" }}
              >
                Posting from {profile.city}
              </p>
            </div>
          </div>
        </div>
        {profile.signature && (
          <div
            className="mt-4 pt-4"
            style={{ borderTop: "1px dashed oklch(0.60 0.09 55 / 0.4)" }}
          >
            <p
              className="font-dancing text-xl"
              style={{ color: "oklch(0.32 0.08 52)" }}
            >
              {profile.signature}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className="p-5 vintage-border text-center"
            style={{ background: "oklch(0.95 0.035 82)" }}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: `${stat.color}20`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <p
              className="font-playfair text-4xl font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p
              className="font-lora text-xs mt-1"
              style={{ color: "oklch(0.52 0.07 56)" }}
            >
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {(inbox?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-4 p-4"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.90 0.08 75), oklch(0.86 0.09 70))",
            border: "1px solid oklch(0.65 0.10 58)",
          }}
          data-ocid="dashboard.inbox_notification"
        >
          <Bell
            className="w-8 h-8 flex-shrink-0 animate-bell"
            style={{ color: "oklch(0.42 0.10 48)" }}
          />
          <div>
            <p
              className="font-playfair font-bold"
              style={{ color: "oklch(0.25 0.07 50)" }}
            >
              You have {inbox?.length} letter
              {(inbox?.length ?? 0) > 1 ? "s" : ""} waiting!
            </p>
            <p
              className="font-lora text-sm"
              style={{ color: "oklch(0.38 0.08 52)" }}
            >
              Head to the Inbox tab to read your mail.
            </p>
          </div>
        </motion.div>
      )}

      <div
        className="text-center py-6 px-8"
        style={{ borderTop: "1px dashed oklch(0.60 0.09 55 / 0.3)" }}
      >
        <p
          className="font-lora italic text-sm"
          style={{ color: "oklch(0.50 0.07 55)" }}
        >
          &ldquo;A letter always feels to me like Immortality, for is it not the
          Mind alone without corporeal friend?&rdquo;
          <br />
          <span className="font-dancing text-base not-italic">
            &mdash; Emily Dickinson
          </span>
        </p>
      </div>
    </motion.div>
  );
}
