import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { tokenManager } from "@/lib/auth/tokenManager";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { setHasCompletedOnboarding, setUser } = useStore();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user has valid token
      const token = await tokenManager.getValidToken();
      
      if (token) {
        // User is authenticated
        setIsAuthenticated(true);
        
        // Load user data from localStorage into store
        const userId = localStorage.getItem("userId");
        const userName = localStorage.getItem("userName");
        const userEmail = localStorage.getItem("userEmail");
        const userCredits = localStorage.getItem("userCredits");
        const userSubscription = localStorage.getItem("userSubscription");
        
        if (userId && userEmail) {
          setUser({
            id: userId,
            name: userName || "",
            email: userEmail,
            credits: parseInt(userCredits || "0"),
            subscription_tier: userSubscription || "free"
          });
        }
      } else if (isDemoMode) {
        // Demo mode: create demo user
        console.log("Demo mode enabled - creating demo user");
        localStorage.setItem("userId", "demo-user-123");
        localStorage.setItem("userName", "Demo User");
        localStorage.setItem("userEmail", "demo@nexora.com");
        localStorage.setItem("userCredits", "100");
        localStorage.setItem("userSubscription", "pro");
        tokenManager.setTokens("demo-token-123", "demo-refresh-123", 86400);
        
        setUser({
          id: "demo-user-123",
          name: "Demo User",
          email: "demo@nexora.com",
          credits: 100,
          subscription_tier: "pro"
        });
        
        setHasCompletedOnboarding(true);
        setIsAuthenticated(true);
      } else {
        // No valid token and not demo mode
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [setHasCompletedOnboarding, setUser, isDemoMode]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pulse-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
