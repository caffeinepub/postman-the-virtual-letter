import { Toaster } from "@/components/ui/sonner";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import LandingPage from "./components/LandingPage";
import MainApp from "./components/MainApp";
import UsernameSetup from "./components/UsernameSetup";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useMyUsername } from "./hooks/useQueries";

const queryClient = new QueryClient();

function AppInner() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { isFetching: actorLoading } = useActor();
  const qc = useQueryClient();

  const {
    data: username,
    isLoading: usernameLoading,
    isError,
    refetch,
  } = useMyUsername();

  if (isInitializing || (isAuthenticated && actorLoading)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.96 0.04 85), oklch(0.90 0.06 75))",
        }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">&#9993;</div>
          <p
            className="font-playfair text-2xl"
            style={{ color: "oklch(0.42 0.10 48)" }}
          >
            Opening post office…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (usernameLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.96 0.04 85), oklch(0.90 0.06 75))",
        }}
      >
        <div className="text-center">
          <Loader2
            className="w-10 h-10 animate-spin mx-auto mb-4"
            style={{ color: "oklch(0.42 0.10 48)" }}
          />
          <p
            className="font-lora italic"
            style={{ color: "oklch(0.48 0.08 54)" }}
          >
            Loading your account…
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.96 0.04 85), oklch(0.90 0.06 75))",
        }}
      >
        <div className="text-center px-6">
          <div className="text-6xl mb-4">&#9993;</div>
          <p
            className="font-playfair text-xl mb-2"
            style={{ color: "oklch(0.36 0.12 30)" }}
          >
            Could not connect to post office
          </p>
          <p
            className="font-lora italic text-sm mb-6"
            style={{ color: "oklch(0.48 0.08 54)" }}
          >
            Please check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded font-lora text-sm transition-opacity hover:opacity-80"
            style={{
              background: "oklch(0.42 0.10 48)",
              color: "oklch(0.97 0.02 85)",
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (username === null || username === undefined) {
    return (
      <UsernameSetup
        onSuccess={() => qc.invalidateQueries({ queryKey: ["myUsername"] })}
      />
    );
  }

  return <MainApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <Toaster
        toastOptions={{
          className: "font-lora border-border bg-card text-card-foreground",
        }}
      />
    </QueryClientProvider>
  );
}
