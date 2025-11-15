import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import AIWidget from "@/components/AIWidget";
import StickyCtaBar from "@/components/StickyCtaBar";
import { NotificationProvider } from "@/components/NotificationSystem";
import LoadingFallback from "@/components/LoadingFallback";
import { initPlausible, analytics } from "@/lib/analytics/plausible";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MVPBuilder = lazy(() => import("./pages/MVPBuilder"));
const IdeaValidation = lazy(() => import("./pages/IdeaValidation"));
const MarketingStrategy = lazy(() => import("./pages/MarketingStrategy"));
const TeamCollaboration = lazy(() => import("./pages/TeamCollaboration"));
const PitchDeck = lazy(() => import("./pages/PitchDeck"));
const Branding = lazy(() => import("./pages/Branding"));
const Profile = lazy(() => import("./pages/Profile"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Help = lazy(() => import("./pages/Help"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Settings = lazy(() => import("./pages/Settings"));
const APIDocs = lazy(() => import("./pages/APIDocs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Error500 = lazy(() => import("./pages/Error500"));
const Error403 = lazy(() => import("./pages/Error403"));
const Error503 = lazy(() => import("./pages/Error503"));
const GoogleCallback = lazy(() => import("./pages/auth/GoogleCallback"));
const GithubCallback = lazy(() => import("./pages/auth/GithubCallback"));
import ProtectedRoute from "./components/ProtectedRoute";

// Error fallback component for react-error-boundary (if available)
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-pulse-600 text-white rounded-lg hover:bg-pulse-700 transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
);

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pulse-600 mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Configure React Query with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('404')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Analytics tracker component
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView();
  }, [location]);

  return null;
};

// Demo Mode Banner
const DemoModeBanner = () => {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  
  if (!isDemoMode) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 text-center text-sm font-medium shadow-lg">
      <span className="inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        🎯 Demo Mode Active - All features unlocked with 100 credits
      </span>
    </div>
  );
};

const App = () => {
  // Initialize analytics on app mount
  useEffect(() => {
    initPlausible();
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <NotificationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <DemoModeBanner />
                <AnalyticsTracker />
                <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/api-docs" element={<APIDocs />} />
              
              {/* OAuth Callback Routes */}
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/auth/github/callback" element={<GithubCallback />} />
              
              {/* Protected Routes - Require Authentication */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/idea-validation" 
                element={
                  <ProtectedRoute>
                    <IdeaValidation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mvp-development" 
                element={
                  <ProtectedRoute>
                    <MVPBuilder />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/marketing-strategy" 
                element={
                  <ProtectedRoute>
                    <MarketingStrategy />
                  </ProtectedRoute>
                } 
              />
              {/* Legacy routes redirect to new unified page */}
              <Route 
                path="/research" 
                element={
                  <ProtectedRoute>
                    <MarketingStrategy />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/marketing" 
                element={
                  <ProtectedRoute>
                    <MarketingStrategy />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/team-collaboration" 
                element={
                  <ProtectedRoute>
                    <TeamCollaboration />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pitch-deck" 
                element={
                  <ProtectedRoute>
                    <PitchDeck />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/branding" 
                element={
                  <ProtectedRoute>
                    <Branding />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Error Pages */}
              <Route path="/error/500" element={<Error500 />} />
              <Route path="/error/403" element={<Error403 />} />
              <Route path="/error/503" element={<Error503 />} />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          
                {/* Global Components */}
                <StickyCtaBar />
              </BrowserRouter>
              </NotificationProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
