import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage from "./components/LandingPage";
import MainApp from "./components/MainApp";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

const queryClient = new QueryClient();

function AppInner() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4">✉</div>
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

  return isAuthenticated ? <MainApp /> : <LandingPage />;
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
