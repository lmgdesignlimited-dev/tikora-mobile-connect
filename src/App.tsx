import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Explore from "./pages/Explore";
import Create from "./pages/Create";
import Activity from "./pages/Activity";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import Wallet from "./pages/Wallet";
import Promote from "./pages/Promote";
import Services from "./pages/Services";
import NotFound from "./pages/NotFound";

// Command Center (Enterprise Admin)
import {
  CommandDashboard,
  CommandModeration,
  CommandPromotions,
  CommandServices,
  CommandCampaigns,
  CommandUsers,
  CommandFinance,
  CommandCrypto,
  CommandCoins,
  CommandRoles,
  CommandActivity,
  CommandAnalytics,
  CommandSettings,
} from "./pages/command";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/create" element={<Create />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/promote" element={<Promote />} />
            <Route path="/services" element={<Services />} />
            
            {/* Command Center - Enterprise Admin Panel */}
            <Route path="/command" element={<CommandDashboard />} />
            <Route path="/command/moderation" element={<CommandModeration />} />
            <Route path="/command/promotions" element={<CommandPromotions />} />
            <Route path="/command/services" element={<CommandServices />} />
            <Route path="/command/campaigns" element={<CommandCampaigns />} />
            <Route path="/command/users" element={<CommandUsers />} />
            <Route path="/command/finance" element={<CommandFinance />} />
            <Route path="/command/crypto" element={<CommandCrypto />} />
            <Route path="/command/coins" element={<CommandCoins />} />
            <Route path="/command/roles" element={<CommandRoles />} />
            <Route path="/command/activity" element={<CommandActivity />} />
            <Route path="/command/analytics" element={<CommandAnalytics />} />
            <Route path="/command/settings" element={<CommandSettings />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
