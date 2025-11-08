import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft, User, Mail, Building, MapPin, Calendar, Edit2, Save, Coins, Award, TrendingUp, Zap, Shield, Bell, Settings, CreditCard, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";

const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "User",
    email: "user@example.com",
    company: "My Startup",
    location: "Mumbai, India",
    bio: "Building the next big thing with AI",
    joinedDate: "January 2025"
  });
  const [editedProfile, setEditedProfile] = useState(profile);
  const [userStats, setUserStats] = useState({
    projectsCreated: 0,
    credits: 100,
    subscriptionTier: "free",
    daysActive: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data on mount
  React.useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/auth/user/${userId}`);
        const data = await response.json();

        if (response.ok) {
          setProfile({
            name: data.user.name,
            email: data.user.email,
            company: "My Startup",
            location: "Mumbai, India",
            bio: "Building the next big thing with AI",
            joinedDate: new Date(data.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          });
          setEditedProfile({
            name: data.user.name,
            email: data.user.email,
            company: "My Startup",
            location: "Mumbai, India",
            bio: "Building the next big thing with AI",
            joinedDate: new Date(data.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          });
          setUserStats({
            projectsCreated: data.stats.projects_created || 0,
            credits: data.user.credits || 100,
            subscriptionTier: data.user.subscription_tier || "free",
            daysActive: Math.floor((new Date().getTime() - new Date(data.user.created_at).getTime()) / (1000 * 60 * 60 * 24))
          });
          // Update localStorage
          localStorage.setItem("userName", data.user.name);
          localStorage.setItem("userCredits", data.user.credits);
          localStorage.setItem("userSubscription", data.user.subscription_tier);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSave = () => {
    setProfile(editedProfile);
    localStorage.setItem("userName", editedProfile.name);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const stats = [
    { label: "Projects Created", value: userStats.projectsCreated.toString(), icon: "🚀", color: "from-blue-500 to-blue-600" },
    { label: "Credits Remaining", value: userStats.credits.toString(), icon: "💎", color: "from-purple-500 to-purple-600" },
    { label: "Team Members", value: "5", icon: "👥", color: "from-green-500 to-green-600" },
    { label: "Days Active", value: userStats.daysActive.toString(), icon: "📅", color: "from-orange-500 to-orange-600" }
  ];

  const recentActivity = [
    { action: "Created new project", time: "2 hours ago", icon: "🎯" },
    { action: "Updated profile", time: "1 day ago", icon: "✏️" },
    { action: "Purchased credits", time: "3 days ago", icon: "💳" },
  ];

  const achievements = [
    { title: "Early Adopter", description: "Joined in the first month", icon: "🌟" },
    { title: "Creator", description: "Created 5+ projects", icon: "🎨" },
    { title: "Active User", description: "7 days streak", icon: "🔥" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navbar */}
      <Navbar />
      <Breadcrumbs />

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-pulse-500 via-pulse-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-4 md:mb-0">
                <div className="relative group">
                  <div className="w-28 h-28 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center text-5xl shadow-xl ring-4 ring-white/30 group-hover:scale-105 transition-transform">
                    👤
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-4xl font-bold mb-2">{profile.name}</h2>
                  <p className="text-white/90 flex items-center justify-center md:justify-start mb-2">
                    <Mail className="w-4 h-4 mr-2" />
                    {profile.email}
                  </p>
                  <div className="flex items-center justify-center md:justify-start space-x-4 text-sm">
                    <span className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                      <MapPin className="w-3 h-3 mr-1" />
                      {profile.location}
                    </span>
                    <span className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                      <Building className="w-3 h-3 mr-1" />
                      {profile.company}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="px-6 py-3 bg-white text-pulse-600 rounded-full font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white/20 backdrop-blur-md rounded-xl p-5 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-white/90 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={isEditing ? editedProfile.name : profile.name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                        isEditing ? "focus:ring-2 focus:ring-pulse-500 focus:border-transparent" : "bg-gray-50 dark:bg-gray-700/50"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={isEditing ? editedProfile.email : profile.email}
                      onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                        isEditing ? "focus:ring-2 focus:ring-pulse-500 focus:border-transparent" : "bg-gray-50 dark:bg-gray-700/50"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={isEditing ? editedProfile.company : profile.company}
                      onChange={(e) => setEditedProfile({ ...editedProfile, company: e.target.value })}
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                        isEditing ? "focus:ring-2 focus:ring-pulse-500 focus:border-transparent" : "bg-gray-50 dark:bg-gray-700/50"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={isEditing ? editedProfile.location : profile.location}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                        isEditing ? "focus:ring-2 focus:ring-pulse-500 focus:border-transparent" : "bg-gray-50 dark:bg-gray-700/50"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    disabled={!isEditing}
                    value={isEditing ? editedProfile.bio : profile.bio}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    rows={3}
                    className={cn(
                      "w-full px-4 py-3 border border-gray-300 rounded-lg",
                      isEditing ? "focus:ring-2 focus:ring-pulse-500 focus:border-transparent" : "bg-gray-50"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Account & Preferences */}
            <div className="space-y-8">
              {/* Account Info */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Member Since</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{profile.joinedDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Coins className="w-5 h-5 text-pulse-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Available Credits</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{userStats.credits} credits remaining</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/pricing")}
                      className="text-sm font-medium text-pulse-600 hover:text-pulse-700"
                    >
                      Buy More
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Account Status</p>
                        <p className="text-sm text-green-600 dark:text-green-400">Active - {userStats.subscriptionTier.charAt(0).toUpperCase() + userStats.subscriptionTier.slice(1)} Plan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-pulse-50 to-orange-50 rounded-2xl p-8 border border-pulse-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate("/pricing")}
                    className="w-full py-3 bg-white border-2 border-pulse-600 text-pulse-600 rounded-lg hover:bg-pulse-50 transition-colors font-medium"
                  >
                    Upgrade Plan
                  </button>
                  <button
                    onClick={() => alert("Password reset email sent!")}
                    className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to logout?")) {
                        localStorage.clear();
                        navigate("/login");
                      }
                    }}
                    className="w-full py-3 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* New Sections Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                <Activity className="w-6 h-6 text-pulse-600" />
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-elegant p-8 border border-purple-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Achievements</h3>
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="space-y-4">
                {achievements.map((achievement, idx) => (
                  <div key={idx} className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-gray-600 hover:shadow-md transition-all">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">{achievement.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
