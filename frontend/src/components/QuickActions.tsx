import React, { useState } from "react";
import { Plus, Zap, Lightbulb, Palette, Rocket, Users, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      id: "idea-validation",
      label: "Validate Idea",
      icon: Lightbulb,
      color: "bg-yellow-500 hover:bg-yellow-600",
      path: "/idea-validation",
      description: "Get AI feedback on your startup idea"
    },
    {
      id: "mvp-development",
      label: "Build MVP",
      icon: Rocket,
      color: "bg-purple-500 hover:bg-purple-600",
      path: "/mvp-development",
      description: "Generate a complete MVP"
    },
    {
      id: "branding",
      label: "Branding",
      icon: Palette,
      color: "bg-purple-500 hover:bg-purple-600",
      path: "/branding",
      description: "Create professional logos with AI"
    },
    {
      id: "pitch-deck",
      label: "Pitch Deck",
      icon: Presentation,
      color: "bg-blue-500 hover:bg-blue-600",
      path: "/pitch-deck",
      description: "Generate investor-ready pitch deck"
    },
    {
      id: "research",
      label: "Marketing Strategy",
      icon: Zap,
      color: "bg-pulse-500 hover:bg-pulse-600",
      path: "/marketing-strategy",
      description: "Market research & marketing plans"
    },
    {
      id: "team",
      label: "Team Collaboration",
      icon: Users,
      color: "bg-indigo-500 hover:bg-indigo-600",
      path: "/team-collaboration",
      description: "Invite team members"
    }
  ];

  const handleActionClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {/* Action Items */}
      <div className={cn(
        "absolute bottom-16 left-0 space-y-3 transition-all duration-300 ease-out",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className={cn(
                "flex items-center group cursor-pointer transition-all duration-300",
                isOpen ? "translate-x-0" : "-translate-x-full"
              )}
              style={{ 
                transitionDelay: isOpen ? `${index * 50}ms` : `${(actions.length - index) * 50}ms`
              }}
              onClick={() => handleActionClick(action.path)}
            >
              {/* Tooltip */}
              <div className="mr-3 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="font-medium">{action.label}</div>
                <div className="text-xs text-gray-300">{action.description}</div>
                <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-transparent border-l-gray-900"></div>
              </div>

              {/* Action Button */}
              <button
                className={cn(
                  "w-12 h-12 rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl",
                  action.color
                )}
              >
                <Icon className="w-5 h-5 mx-auto" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 bg-gradient-to-r from-pulse-500 to-pulse-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-pulse-500/25 flex items-center justify-center group",
          isOpen && "rotate-45"
        )}
      >
        <Plus className="w-6 h-6 transition-transform duration-300" />
        
        {/* Pulse Animation */}
        <div className="absolute inset-0 rounded-full bg-pulse-400 animate-ping opacity-20 group-hover:opacity-30"></div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default QuickActions;
