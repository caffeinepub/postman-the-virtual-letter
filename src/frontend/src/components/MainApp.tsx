import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import { Bell, LogOut, Mail, PenLine, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useInbox } from "../hooks/useQueries";
import ComposeLetter from "./ComposeLetter";
import Dashboard from "./Dashboard";
import Inbox from "./Inbox";
import Outbox from "./Outbox";
import ProfilePage from "./ProfilePage";

function playPostalChime() {
  try {
    const ctx = new AudioContext();
    const notes = [329.63, 392.0, 493.88];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.28;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t);
      osc.stop(t + 1.2);
    });
  } catch {
    // audio not available
  }
}

export default function MainApp() {
  const { identity, clear } = useInternetIdentity();
  const principal = identity?.getPrincipal() as Principal | undefined;
  const { data: profile } = useCallerProfile();
  const { data: inbox } = useInbox(principal);
  const [bellAnimating, setBellAnimating] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const inboxCount = inbox?.length ?? 0;

  // Handle ?addUser= URL param
  const [defaultAddFriend] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("addUser") ?? undefined;
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("addUser") ? "profile" : "home";
  });

  const seenIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!inbox) return;

    const currentIds = (inbox as bigint[]).map((id) => id.toString());

    if (!hasInitializedRef.current) {
      for (const id of currentIds) {
        seenIdsRef.current.add(id);
      }
      hasInitializedRef.current = true;
      return;
    }

    for (const id of currentIds) {
      if (!seenIdsRef.current.has(id)) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("📬 Postman has a letter for you!", {
            body: "A new letter has arrived. Sign to receive it.",
            icon: "/favicon.ico",
          });
        }
        playPostalChime();
        break;
      }
    }

    for (const id of currentIds) {
      seenIdsRef.current.add(id);
    }
  }, [inbox]);

  useEffect(() => {
    if (inboxCount > 0) {
      setBellAnimating(true);
      const t = setTimeout(() => setBellAnimating(false), 1100);
      return () => clearTimeout(t);
    }
  }, [inboxCount]);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.28 0.07 50), oklch(0.20 0.06 48))",
          borderColor: "oklch(0.45 0.08 50)",
          boxShadow: "0 2px 12px oklch(0.20 0.06 48 / 0.5)",
        }}
      >
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">&#9993;</span>
            <div>
              <h1
                className="font-playfair font-bold text-xl tracking-widest leading-none"
                style={{ color: "oklch(0.95 0.03 82)" }}
              >
                POSTMAN
              </h1>
              <p
                className="font-dancing text-sm leading-none"
                style={{ color: "oklch(0.76 0.08 70)" }}
              >
                The Virtual Letter
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <span
                className="font-lora text-sm hidden sm:block"
                style={{ color: "oklch(0.82 0.05 80)" }}
              >
                {profile.name}, {profile.city}
              </span>
            )}
            <button
              type="button"
              onClick={() => setLogoutDialogOpen(true)}
              data-ocid="nav.logout_button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-lora rounded transition-opacity hover:opacity-80"
              style={{
                color: "oklch(0.82 0.05 80)",
                border: "1px solid oklch(0.55 0.07 55 / 0.5)",
              }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="w-full mb-6 p-1 h-auto rounded-none"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.88 0.05 80), oklch(0.84 0.06 75))",
              border: "2px double oklch(0.60 0.09 55)",
            }}
          >
            <TabsTrigger
              value="home"
              data-ocid="nav.home_tab"
              className="flex-1 gap-1.5 font-lora text-sm rounded-none data-[state=active]:bg-card"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
            <TabsTrigger
              value="compose"
              data-ocid="nav.compose_tab"
              className="flex-1 gap-1.5 font-lora text-sm rounded-none data-[state=active]:bg-card"
            >
              <PenLine className="w-4 h-4" />
              <span className="hidden sm:inline">Compose</span>
            </TabsTrigger>
            <TabsTrigger
              value="inbox"
              data-ocid="nav.inbox_tab"
              className="flex-1 gap-1.5 font-lora text-sm rounded-none data-[state=active]:bg-card"
            >
              <Bell
                className={`w-4 h-4 ${bellAnimating ? "animate-bell" : ""}`}
              />
              <span className="hidden sm:inline">Inbox</span>
              {inboxCount > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "oklch(0.36 0.14 22)", color: "white" }}
                >
                  {inboxCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="outbox"
              data-ocid="nav.outbox_tab"
              className="flex-1 gap-1.5 font-lora text-sm rounded-none data-[state=active]:bg-card"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Outbox</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              data-ocid="nav.profile_tab"
              className="flex-1 gap-1.5 font-lora text-sm rounded-none data-[state=active]:bg-card"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <Dashboard principal={principal} />
          </TabsContent>
          <TabsContent value="compose">
            <ComposeLetter />
          </TabsContent>
          <TabsContent value="inbox">
            <Inbox principal={principal} />
          </TabsContent>
          <TabsContent value="outbox">
            <Outbox principal={principal} />
          </TabsContent>
          <TabsContent value="profile">
            <ProfilePage defaultAddFriend={defaultAddFriend} />
          </TabsContent>
        </Tabs>
      </main>

      <footer
        className="py-4 text-center text-xs font-lora border-t"
        style={{
          color: "oklch(0.52 0.07 56)",
          borderColor: "oklch(0.74 0.07 60 / 0.4)",
          background: "oklch(0.88 0.04 80)",
        }}
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
      </footer>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent data-ocid="logout.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair">
              Log out of POSTMAN?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-lora">
              Your letters and account will be safe. You can log back in anytime
              with Internet Identity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="logout.cancel_button"
              className="font-lora"
            >
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="logout.confirm_button"
              className="font-lora"
              onClick={() => clear()}
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
