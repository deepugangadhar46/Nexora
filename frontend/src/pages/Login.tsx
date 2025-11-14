import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, Github } from "lucide-react";
import { apiPost, APIError } from "@/lib/api-client";
import { LoginCredentials } from "@/lib/api";
import { loginWithOAuth } from "@/lib/auth/oauth";
import { analytics } from "@/lib/analytics/plausible";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use enhanced API client with retry logic
      const response = await apiPost(
        "/auth/login",
        {
          email: formData.email,
          password: formData.password
        },
        { maxRetries: 2, retryDelay: 1000 }
      );

      console.log("Login response:", response);
      
      if (response.access_token && response.user) {
        console.log("✅ Login successful, storing tokens and redirecting...");
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
        localStorage.setItem("userId", response.user.id);
        localStorage.setItem("userName", response.user.name);
        localStorage.setItem("userEmail", response.user.email);
        localStorage.setItem("userCredits", response.user.credits.toString());
        localStorage.setItem("userSubscription", response.user.subscription_tier);
        
        // Calculate and store token expiry
        const expiresIn = response.expires_in || 86400; // Default 24 hours
        const expiresAt = Date.now() + (expiresIn - 300) * 1000; // 5 min buffer
        localStorage.setItem("token_expires_at", expiresAt.toString());
        
        // Track login
        analytics.trackLogin('email');
        
        console.log("Navigating to dashboard...");
        navigate("/dashboard");
      } else {
        console.error("❌ Missing access_token or user in response:", response);
        setError("Login response incomplete. Please try again.");
      }
    } catch (err: any) {
      console.error("❌ Login error:", err);
      let errorMessage = "Login failed. Please check your credentials.";
      
      if (err instanceof APIError) {
        if (err.status === 401) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (err.status === 429) {
          errorMessage = "Too many login attempts. Please wait a moment and try again.";
        } else if (err.isRetryable) {
          errorMessage = "Server is temporarily unavailable. Please try again.";
        } else {
          errorMessage = err.message;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      console.error("Error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex transition-colors duration-300">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/")}
              className="text-3xl font-bold bg-gradient-to-r from-pulse-500 to-pulse-600 bg-clip-text text-transparent inline-block mb-2"
            >
              NEXORA
            </button>
          </div>

          {/* Login Form */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Don't have an account? <button onClick={() => navigate("/register")} className="text-pulse-600 hover:underline font-medium">Sign up →</button>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 text-pulse-600 border-gray-300 rounded focus:ring-pulse-500 mt-1"
                />
                <label className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  By signing up you agree to the{" "}
                  <a href="#" className="text-pulse-600 hover:underline">terms and services</a>
                  {" "}and the{" "}
                  <a href="#" className="text-pulse-600 hover:underline">privacy policy</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3 rounded-lg font-medium text-white transition-all duration-300",
                  "bg-gradient-to-r from-pulse-500 to-pulse-600 hover:shadow-lg",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? "Signing in..." : "Continue"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  analytics.trackOAuthStart('google');
                  loginWithOAuth('google');
                }}
                className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  analytics.trackOAuthStart('github');
                  loginWithOAuth('github');
                }}
                className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Github className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      
      {/* Right Side - Testimonial/Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pulse-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-lg">
          {/* Code Snippet */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 shadow-2xl">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <pre className="text-sm text-gray-300 font-mono">
              <code>
{`import { validateIdea } from '@nexora/ai';

const result = await validateIdea({
  idea: "AI-powered fitness app",
  target: "Health enthusiasts"
});

console.log(result);
// {
//   score: 8.5,
//   marketSize: "$2.3B",
//   competition: "Medium",
//   recommendation: "Strong potential"
// }`}
              </code>
            </pre>
          </div>
          
          {/* Testimonial */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              "Every single one of these engineers has to spend literally just one day making projects with Nexora and it will be like they strapped on rocket boosters."
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-pulse-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                D
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Deepu, CEO & President</p>
                <div className="flex items-center space-x-1">
                  <span className="text-orange-500 font-bold">Y</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Combinator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
