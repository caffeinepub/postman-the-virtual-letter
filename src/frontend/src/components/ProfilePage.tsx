import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCallerProfile, useSaveProfile } from "../hooks/useQueries";

export default function ProfilePage() {
  const { data: profile, isLoading } = useCallerProfile();
  const saveProfile = useSaveProfile();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [signature, setSignature] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCity(profile.city);
      setSignature(profile.signature);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        city: city.trim(),
        signature: signature.trim(),
      });
      toast.success("Profile saved! &#9993;");
    } catch {
      toast.error("Failed to save profile.");
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex justify-center py-20"
        data-ocid="profile.loading_state"
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "oklch(0.42 0.10 48)" }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
      data-ocid="profile.section"
    >
      <div className="text-center">
        <h2
          className="font-playfair text-3xl font-bold"
          style={{ color: "oklch(0.25 0.07 50)" }}
        >
          Your Postal Profile
        </h2>
        <p
          className="font-lora italic text-sm mt-1"
          style={{ color: "oklch(0.50 0.07 55)" }}
        >
          How you appear to other postmasters
        </p>
      </div>

      <div
        className="p-8 vintage-border space-y-5"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.96 0.04 85), oklch(0.91 0.05 78))",
        }}
      >
        <div className="space-y-1.5">
          <Label
            htmlFor="profile-name"
            className="font-playfair font-semibold text-sm"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            Full Name
          </Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ranjit Singh"
            className="rounded-none font-lora bg-transparent"
            style={{
              borderColor: "oklch(0.65 0.08 58)",
              color: "oklch(0.28 0.07 52)",
            }}
            data-ocid="profile.name_input"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="profile-city"
            className="font-playfair font-semibold text-sm"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            City / Town
          </Label>
          <Input
            id="profile-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Lahore, Bombay, Calcutta…"
            className="rounded-none font-lora bg-transparent"
            style={{
              borderColor: "oklch(0.65 0.08 58)",
              color: "oklch(0.28 0.07 52)",
            }}
            data-ocid="profile.city_input"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="profile-sig"
            className="font-playfair font-semibold text-sm"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            Signature
          </Label>
          <Input
            id="profile-sig"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Your sign-off phrase…"
            className="rounded-none font-lora bg-transparent"
            style={{
              borderColor: "oklch(0.65 0.08 58)",
              color: "oklch(0.28 0.07 52)",
            }}
            data-ocid="profile.signature_input"
          />
          {signature && (
            <div
              className="mt-3 px-4 py-3"
              style={{
                borderTop: "1px dashed oklch(0.60 0.09 55 / 0.5)",
                background: "oklch(0.94 0.04 83)",
              }}
            >
              <p
                className="text-xs font-lora mb-1"
                style={{ color: "oklch(0.52 0.07 56)" }}
              >
                Preview:
              </p>
              <p
                className="font-dancing text-2xl"
                style={{ color: "oklch(0.28 0.07 52)" }}
              >
                {signature}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveProfile.isPending}
          data-ocid="profile.save_button"
          className="w-full inline-flex items-center justify-center gap-2 py-3 font-lora text-base transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
            color: "oklch(0.97 0.02 80)",
            border: "2px solid oklch(0.55 0.09 52)",
            boxShadow: "3px 3px 0 oklch(0.22 0.06 50)",
          }}
        >
          {saveProfile.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Profile
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
