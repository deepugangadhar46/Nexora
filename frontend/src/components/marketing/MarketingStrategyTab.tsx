import React from "react";
import { motion } from "framer-motion";
import { NavigateFunction } from "react-router-dom";
import { 
  Users, Target, Zap, DollarSign, CheckCircle, TrendingUp, Megaphone,
  Mail, Globe, Instagram, Linkedin, Youtube
} from "lucide-react";

interface MarketingChannel {
  channel: string;
  strategy: string;
  estimated_cost: number;
  expected_roi: number;
  timeline: string;
}

interface MarketingStrategyData {
  channels: MarketingChannel[];
  total_budget: number;
  customer_acquisition_strategy: string;
  retention_strategy: string;
  growth_tactics: string[];
}

interface MarketingStrategyTabProps {
  data: MarketingStrategyData;
  budget: number;
  navigate: NavigateFunction;
  idea: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const getChannelIcon = (channel: string) => {
  const channelLower = channel.toLowerCase();
  if (channelLower.includes('social') || channelLower.includes('instagram')) return Instagram;
  if (channelLower.includes('linkedin')) return Linkedin;
  if (channelLower.includes('email')) return Mail;
  if (channelLower.includes('content') || channelLower.includes('blog')) return Globe;
  if (channelLower.includes('video') || channelLower.includes('youtube')) return Youtube;
  return Megaphone;
};

export const MarketingStrategyTab: React.FC<MarketingStrategyTabProps> = ({ data, budget, navigate, idea }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Strategy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white"
        >
          <Users className="w-8 h-8 mb-4" />
          <h3 className="text-xl font-bold mb-3">Customer Acquisition</h3>
          <p className="text-white/90 leading-relaxed">
            {data.customer_acquisition_strategy}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white"
        >
          <Target className="w-8 h-8 mb-4" />
          <h3 className="text-xl font-bold mb-3">Retention Strategy</h3>
          <p className="text-white/90 leading-relaxed">
            {data.retention_strategy}
          </p>
        </motion.div>
      </div>

      {/* Marketing Channels */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Marketing Channels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.channels.map((channel, index) => {
            const ChannelIcon = getChannelIcon(channel.channel);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ChannelIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-medium">
                    {channel.expected_roi}x ROI
                  </span>
                </div>
                
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">{channel.channel}</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {channel.strategy}
                </p>
                
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Estimated Cost</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(channel.estimated_cost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Timeline</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {channel.timeline}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Growth Tactics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Zap className="w-6 h-6 text-green-500" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Growth Tactics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.growth_tactics.map((tactic, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{tactic}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Budget Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <DollarSign className="w-6 h-6 text-green-500" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Allocation</h3>
        </div>
        
        {/* Budget Chart */}
        <div className="space-y-4">
          {data.channels.map((channel, index) => {
            const percentage = (channel.estimated_cost / data.total_budget) * 100;
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{channel.channel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(channel.estimated_cost)} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                    className="h-full bg-gradient-to-r from-green-500 to-teal-600 rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Budget</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.total_budget)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Expected ROI Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-xl p-8 text-white"
      >
        <h3 className="text-2xl font-bold mb-4">Expected Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              label: "Average ROI", 
              value: `${(data.channels.reduce((sum, ch) => sum + ch.expected_roi, 0) / data.channels.length).toFixed(1)}x`,
              icon: TrendingUp
            },
            { 
              label: "Marketing Channels", 
              value: data.channels.length.toString(),
              icon: Megaphone
            },
            { 
              label: "Growth Tactics", 
              value: data.growth_tactics.length.toString(),
              icon: Zap
            }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Next Steps CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-center space-y-4"
      >
        <p className="text-gray-600 dark:text-gray-400">Ready to bring your idea to life?</p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => navigate("/mvp-development", { state: { idea } })}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Build MVP →
          </button>
          <button
            onClick={() => navigate("/pitch-deck", { state: { idea } })}
            className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-green-500 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Create Pitch Deck →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
