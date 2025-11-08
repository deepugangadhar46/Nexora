import React, { useState, useEffect } from "react";
import { Clock, FileText, Rocket, Lightbulb, Users, Presentation, Download, Eye, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Activity {
  id: string;
  type: 'idea-validation' | 'mvp-generation' | 'business-plan' | 'pitch-deck' | 'research' | 'team-invite';
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'in-progress' | 'failed';
  metadata?: {
    projectName?: string;
    duration?: string;
    fileSize?: string;
    teamMember?: string;
  };
}

const RecentActivity = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'mvp-generation',
      title: 'MVP Generated Successfully',
      description: 'E-commerce platform with React and Node.js',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      status: 'completed',
      metadata: {
        projectName: 'ShopEasy',
        duration: '15 min',
        fileSize: '2.3 MB'
      }
    },
    {
      id: '2',
      type: 'business-plan',
      title: 'Business Plan Created',
      description: 'Comprehensive plan with financial projections',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'completed',
      metadata: {
        projectName: 'ShopEasy',
        fileSize: '1.8 MB'
      }
    },
    {
      id: '3',
      type: 'idea-validation',
      title: 'Idea Validation Complete',
      description: 'Market analysis shows 85% viability score',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      status: 'completed',
      metadata: {
        projectName: 'ShopEasy'
      }
    },
    {
      id: '4',
      type: 'team-invite',
      title: 'Team Member Invited',
      description: 'Invitation sent to john@example.com',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      status: 'completed',
      metadata: {
        teamMember: 'John Smith'
      }
    },
    {
      id: '5',
      type: 'research',
      title: 'Market Research Generated',
      description: 'Competitor analysis and market trends',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'completed',
      metadata: {
        projectName: 'ShopEasy',
        fileSize: '3.1 MB'
      }
    }
  ]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'idea-validation':
        return <Lightbulb className="w-4 h-4" />;
      case 'mvp-generation':
        return <Rocket className="w-4 h-4" />;
      case 'business-plan':
        return <FileText className="w-4 h-4" />;
      case 'pitch-deck':
        return <Presentation className="w-4 h-4" />;
      case 'research':
        return <Eye className="w-4 h-4" />;
      case 'team-invite':
        return <Users className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'idea-validation':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'mvp-generation':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'business-plan':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'pitch-deck':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'research':
        return 'bg-pulse-100 text-pulse-600 border-pulse-200';
      case 'team-invite':
        return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleActivityClick = (activity: Activity) => {
    switch (activity.type) {
      case 'idea-validation':
        navigate('/idea-validation');
        break;
      case 'mvp-generation':
        navigate('/mvp-development');
        break;
      case 'business-plan':
        navigate('/business-plan');
        break;
      case 'pitch-deck':
        navigate('/pitch-deck');
        break;
      case 'research':
        navigate('/marketing-strategy');
        break;
      case 'team-invite':
        navigate('/team-collaboration');
        break;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
          <p className="text-gray-600 text-sm">Your latest actions and generations</p>
        </div>
        <button className="text-pulse-600 hover:text-pulse-700 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            onClick={() => handleActivityClick(activity)}
            className="flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            {/* Icon */}
            <div className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center",
              getActivityColor(activity.type)
            )}>
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900 truncate group-hover:text-pulse-600 transition-colors">
                  {activity.title}
                </h4>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
              
              {/* Metadata */}
              {activity.metadata && (
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {activity.metadata.projectName && (
                    <span className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {activity.metadata.projectName}
                    </span>
                  )}
                  {activity.metadata.duration && (
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.metadata.duration}
                    </span>
                  )}
                  {activity.metadata.fileSize && (
                    <span className="flex items-center">
                      <Download className="w-3 h-3 mr-1" />
                      {activity.metadata.fileSize}
                    </span>
                  )}
                  {activity.metadata.teamMember && (
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {activity.metadata.teamMember}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Status Indicator */}
            <div className="flex-shrink-0">
              {activity.status === 'completed' && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
              {activity.status === 'in-progress' && (
                <div className="w-2 h-2 bg-pulse-500 rounded-full animate-pulse" />
              )}
              {activity.status === 'failed' && (
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {activities.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h4>
          <p className="text-gray-600 mb-6">Start building your startup to see activity here</p>
          <button
            onClick={() => navigate('/idea-validation')}
            className="px-6 py-2 bg-pulse-600 text-white rounded-lg hover:bg-pulse-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/mvp-development')}
            className="flex items-center justify-center px-4 py-2 bg-pulse-50 text-pulse-600 rounded-lg hover:bg-pulse-100 transition-colors text-sm font-medium"
          >
            <Rocket className="w-4 h-4 mr-2" />
            New MVP
          </button>
          <button
            onClick={() => navigate('/idea-validation')}
            className="flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Validate Idea
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
