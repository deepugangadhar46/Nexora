import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "@/lib/api";
import { apiPost, APIError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { RegisterCredentials } from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterCredentials & { confirmPassword: string }>({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Use enhanced API client with retry logic
      const response = await apiPost(
        "/auth/register",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password
        },
        { maxRetries: 2, retryDelay: 1000 }
      );

      if (response.access_token && response.user) {
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
        
        navigate("/dashboard");
      }
    } catch (err: any) {
      let errorMessage = "Registration failed. Please try again.";
      
      if (err instanceof APIError) {
        if (err.status === 409) {
          errorMessage = "Email already exists. Please use a different email or login.";
        } else if (err.status === 429) {
          errorMessage = "Too many registration attempts. Please wait a moment and try again.";
        } else if (err.isRetryable) {
          errorMessage = "Server is temporarily unavailable. Please try again.";
        } else {
          errorMessage = err.message;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pulse-50 via-white to-orange-50 flex items-center justify-center px-4 py-12">
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
          <p className="text-gray-600">Create your account and start building</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-elegant p-8 border border-gray-200">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-pulse-500 to-pulse-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Create Account
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-pulse-600 border-gray-300 rounded focus:ring-pulse-500 mt-1"
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{" "}
                <a href="#" className="text-pulse-600 hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-pulse-600 hover:underline">Privacy Policy</a>
              </label>
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
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-pulse-600 hover:text-pulse-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🎉 Get 100 free credits when you sign up!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
