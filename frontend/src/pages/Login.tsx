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
    <div className="min-h-screen bg-gradient-to-br from-pulse-50 via-white to-orange-50 flex items-center justify-center px-4">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-1/2 h-[70%] bg-pulse-gradient opacity-10 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-[10%] -left-[5%] w-1/2 h-[70%] bg-pulse-gradient opacity-10 blur-3xl rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-3xl font-bold bg-gradient-to-r from-pulse-500 to-pulse-600 bg-clip-text text-transparent inline-block mb-2"
          >
            NEXORA
          </button>
          <p className="text-gray-600">Welcome back! Sign in to continue</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-elegant p-8 border border-gray-200">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-pulse-500 to-pulse-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Sign In
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-pulse-600 border-gray-300 rounded focus:ring-pulse-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-pulse-600 hover:text-pulse-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-3 rounded-full font-medium text-white transition-all duration-300",
                "bg-gradient-to-r from-pulse-500 to-pulse-600 hover:shadow-lg",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center space-x-2"
              )}
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                analytics.trackOAuthStart('google');
                loginWithOAuth('google');
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => {
                analytics.trackOAuthStart('github');
                loginWithOAuth('github');
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Github className="w-5 h-5 text-gray-700" />
              <span className="text-gray-700 font-medium">Continue with GitHub</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-pulse-600 hover:text-pulse-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <a href="#" className="text-pulse-600 hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-pulse-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
