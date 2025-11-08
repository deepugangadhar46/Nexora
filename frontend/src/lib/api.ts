/**
 * API utility functions for making requests to the backend
 */
import { API_BASE_URL } from './config';
import { tokenManager } from './auth/tokenManager';

const API_TIMEOUT = 30000; // 30 seconds

// Helper function for API error handling
class APIError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Get user-friendly error message based on status code
 */
function getUserFriendlyError(status: number, defaultMessage: string): string {
  switch (status) {
    case 401:
      return 'Invalid email or password.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many attempts. Please try again in a moment.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please retry.';
    default:
      return defaultMessage;
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  subscription_tier: string;
  created_at?: string;
}

export interface UserStats {
  total_projects: number;
  completed_projects: number;
  total_credits_used: number;
  last_activity?: string;
}

export interface UserInfoResponse {
  status: string;
  user: User;
  stats: UserStats;
}

export interface AuthResponse {
  status: string;
  message?: string;
  user?: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        // Use user-friendly error
        errorMessage = getUserFriendlyError(response.status, errorMessage);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

/**
 * Register new user
 */
export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
}

/**
 * Get user information by user ID
 */
export async function getUserInfo(userId: string): Promise<UserInfoResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

/**
 * Update user credits
 */
export async function updateUserCredits(userId: string, credits: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user/${userId}/credits`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credits }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
}

/**
 * Get user projects
 */
export async function getUserProjects(userId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user projects:', error);
    throw error;
  }
}

/**
 * Scrape URL using Firecrawl
 */
export async function scrapeUrl(url: string, options?: {
  formats?: string[];
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scrape-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw error;
  }
}

/**
 * Search web using Firecrawl
 */
export async function searchWeb(query: string, maxResults: number = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search-web`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        maxResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching web:', error);
    throw error;
  }
}

/**
 * Create E2B sandbox
 */
export async function createE2BSandbox(template: string = 'nodejs') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/e2b/create-sandbox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating E2B sandbox:', error);
    throw error;
  }
}

/**
 * Execute code in E2B sandbox
 */
export async function executeCode(sandboxId: string, code: string, language: string = 'javascript') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/e2b/execute-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sandboxId,
        code,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error executing code:', error);
    throw error;
  }
}

/**
 * Build MVP using MVP_Agent
 */
export async function buildMVP(request: {
  productName: string;
  productIdea: string;
  coreFeatures?: string[];
  targetPlatform?: string;
  techStack?: string[];
  projectType?: string;
  generateMultipleFiles?: boolean;
  includeComponents?: boolean;
  defaultLanguage?: string;
  userId?: string;
  scrapeUrls?: string[];
  userSubscription?: string;
}) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/mvpDevelopment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        productName: request.productName,
        productIdea: request.productIdea,
        coreFeatures: request.coreFeatures || [],
        targetPlatform: request.targetPlatform || 'web',
        techStack: request.techStack || ['React', 'TypeScript', 'Tailwind CSS'],
        projectType: request.projectType || 'web-app',
        generateMultipleFiles: request.generateMultipleFiles ?? true,
        includeComponents: request.includeComponents ?? true,
        defaultLanguage: request.defaultLanguage || 'react',
        userId: request.userId,
        scrapeUrls: request.scrapeUrls,
        userSubscription: request.userSubscription || 'free',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error building MVP:', error);
    throw error;
  }
}

/**
 * Refine existing MVP based on feedback
 */
export async function refineMVP(request: {
  currentHtml: string;
  feedback: string;
  userId?: string;
  userSubscription?: string;
}) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/mvp/refine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        currentHtml: request.currentHtml,
        feedback: request.feedback,
        userId: request.userId,
        userSubscription: request.userSubscription || 'free',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error refining MVP:', error);
    throw error;
  }
}

/**
 * Chat with AI assistant
 */
export async function chatWithAI(request: {
  message: string;
  context?: string;
  userId?: string;
}) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        message: request.message,
        context: request.context,
        userId: request.userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error chatting with AI:', error);
    throw error;
  }
}

// ============================================================================
// IDEA VALIDATION API
// ============================================================================

export interface FeasibilityScore {
  feasibility: number;
  novelty: number;
  scalability: number;
  overall: number;
  reasoning: string;
}

export interface Competitor {
  name: string;
  description: string;
  overlap_score: number;
  url?: string;
  strengths: string[];
  weaknesses: string[];
}

export interface AudienceSegment {
  name: string;
  demographics: string;
  psychographics: string;
  pain_points: string[];
  adoption_likelihood: number;
}

export interface TargetAudience {
  segments: AudienceSegment[];
  fit_score: number;
  total_addressable_market: string;
}

export interface ProblemSolutionFit {
  trend_score: number;
  trend_summary: string;
  search_volume_trend: string;
  market_demand: string;
  validation_sources: string[];
}

export interface Risk {
  risk: string;
  severity: string;
  mitigation: string;
  confidence: number;
}

export interface IdeaValidationResponse {
  idea_title: string;
  summary: string;
  ai_feasibility_score: FeasibilityScore;
  competitors: Competitor[];
  target_audience: TargetAudience;
  problem_solution_fit: ProblemSolutionFit;
  risks: Risk[];
  pdf_report_url?: string;
  community_poll_link?: string;
  summary_recommendation: string;
  validation_id: string;
  created_at: string;
}

/**
 * Validate startup idea - Full validation
 */
export async function validateIdea(request: {
  idea: string;
  industry?: string;
  generate_pdf?: boolean;
}): Promise<IdeaValidationResponse> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/idea-validation/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
        industry: request.industry || '',
        generate_pdf: request.generate_pdf ?? true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating idea:', error);
    throw error;
  }
}

/**
 * Quick idea validation - Feasibility score only
 */
export async function validateIdeaQuick(request: {
  idea: string;
}): Promise<FeasibilityScore> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/idea-validation/validate-quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in quick validation:', error);
    throw error;
  }
}

/**
 * Find competitors for an idea
 */
export async function findCompetitors(request: {
  idea: string;
  industry?: string;
}): Promise<Competitor[]> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/idea-validation/competitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
        industry: request.industry || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error finding competitors:', error);
    throw error;
  }
}

/**
 * Analyze target audience for an idea
 */
export async function analyzeAudience(request: {
  idea: string;
}): Promise<TargetAudience> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/idea-validation/audience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing audience:', error);
    throw error;
  }
}

/**
 * Detect risks for an idea
 */
export async function detectRisks(request: {
  idea: string;
  industry?: string;
}): Promise<Risk[]> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/idea-validation/risks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
        industry: request.industry || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error detecting risks:', error);
    throw error;
  }
}

/**
 * Download PDF validation report
 */
export async function downloadValidationReport(validationId: string): Promise<Blob> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/idea-validation/report/${validationId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error downloading validation report:', error);
    throw error;
  }
}

/**
 * Check Idea Validation Agent health
 */
export async function checkIdeaValidationHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/idea-validation/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking idea validation health:', error);
    throw error;
  }
}

// ============================================================================
// MARKET RESEARCH API
// ============================================================================

export interface MarketCompetitor {
  name: string;
  description: string;
  url?: string;
  funding?: string;
  team_size?: string;
  founded?: string;
  strengths: string[];
  weaknesses: string[];
  pricing_model?: string;
  market_position?: string;
}

export interface MarketSize {
  tam: number;
  sam: number;
  som: number;
  tam_description: string;
  sam_description: string;
  som_description: string;
  currency: string;
  reasoning: string;
}

export interface TrendData {
  keyword: string;
  trend_score: number;
  category: string;
  growth_rate?: string;
  search_volume?: string;
  relevance: string;
}

export interface SentimentData {
  source: string;
  sentiment_score: number;
  pain_points: string[];
  positive_feedback: string[];
  common_complaints: string[];
  sample_size: number;
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
}

export interface PricingModel {
  competitor: string;
  pricing_type: string;
  tiers: PricingTier[];
  average_price?: number;
  value_proposition: string;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  chart_url?: string;
}

export interface MarketGap {
  gap_name: string;
  description: string;
  opportunity_score: number;
  target_audience: string;
  why_unsolved: string;
  potential_solution: string;
}

export interface MarketResearchReport {
  id: string;
  timestamp: string;
  industry: string;
  target_segment: string;
  status: string;
  processing_time: number;
  
  competitors: MarketCompetitor[];
  market_size?: MarketSize;
  trends: TrendData[];
  sentiment: SentimentData[];
  pricing_intelligence: PricingModel[];
  swot?: SWOTAnalysis;
  market_gaps: MarketGap[];
  
  executive_summary: string;
  key_insights: string[];
  recommendations: string[];
}

// ============================================================================
// DEPRECATED: Old individual market research functions
// These have been replaced by the comprehensive marketing strategy endpoint
// Keeping type definitions for backwards compatibility
// ============================================================================

// ============================================================================
// BUSINESS PLANNING API
// ============================================================================

export interface LeanCanvasBlock {
  title: string;
  content: string[];
  description: string;
}

export interface LeanCanvas {
  problem: LeanCanvasBlock;
  solution: LeanCanvasBlock;
  unique_value_proposition: LeanCanvasBlock;
  unfair_advantage: LeanCanvasBlock;
  customer_segments: LeanCanvasBlock;
  key_metrics: LeanCanvasBlock;
  channels: LeanCanvasBlock;
  cost_structure: LeanCanvasBlock;
  revenue_streams: LeanCanvasBlock;
}

export interface FinancialProjection {
  year: number;
  revenue: number;
  costs: number;
  profit: number;
  burn_rate: number;
  runway_months: number;
}

export interface FinancialEstimate {
  projections: FinancialProjection[];
  cac: number;
  ltv: number;
  ltv_cac_ratio: number;
  break_even_month: number;
  total_funding_needed: number;
  assumptions: string[];
}

export interface TeamRole {
  role: string;
  responsibilities: string[];
  skills_required: string[];
  priority: string;
  hiring_timeline: string;
}

export interface TeamComposition {
  roles: TeamRole[];
  total_team_size: number;
  estimated_payroll_monthly: number;
}

export interface MarketingChannel {
  channel: string;
  strategy: string;
  estimated_cost: number;
  expected_roi: number;
  timeline: string;
}

export interface MarketingStrategy {
  channels: MarketingChannel[];
  total_budget: number;
  customer_acquisition_strategy: string;
  retention_strategy: string;
  growth_tactics: string[];
}

export interface InvestorSummary {
  elevator_pitch: string;
  problem_statement: string;
  solution_overview: string;
  market_opportunity: string;
  business_model: string;
  traction: string;
  competitive_advantage: string;
  team_highlights: string;
  financial_ask: string;
  use_of_funds: string[];
  key_milestones: string[];
}

export interface ComplianceRequirement {
  category: string;
  requirement: string;
  jurisdiction: string;
  priority: string;
  estimated_cost: number;
  timeline: string;
  resources: string[];
}

export interface RegulatoryCompliance {
  requirements: ComplianceRequirement[];
  total_compliance_cost: number;
  critical_deadlines: string[];
  recommended_actions: string[];
}

export interface CoFounderFeedback {
  feedback_type: string;
  message: string;
  reasoning: string;
  action_items: string[];
}

export interface BusinessPlanResponse {
  plan_id: string;
  business_name: string;
  tagline: string;
  executive_summary: string;
  lean_canvas: LeanCanvas;
  financial_estimate: FinancialEstimate;
  team_composition: TeamComposition;
  marketing_strategy: MarketingStrategy;
  investor_summary: InvestorSummary;
  regulatory_compliance: RegulatoryCompliance;
  co_founder_feedback: CoFounderFeedback[];
  pdf_url?: string;
  docx_url?: string;
  notion_url?: string;
  created_at: string;
}

/**
 * Create a complete business plan
 */
export async function createBusinessPlan(request: {
  idea: string;
  industry?: string;
  target_market?: string;
  business_model?: string;
  region?: string;
  budget?: number;
  export_formats?: string[];
  userId?: string;
}): Promise<BusinessPlanResponse> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/business-plan/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
        industry: request.industry || '',
        target_market: request.target_market || '',
        business_model: request.business_model || '',
        region: request.region || 'United States',
        budget: request.budget || 10000,
        export_formats: request.export_formats || ['pdf', 'docx'],
        userId: request.userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating business plan:', error);
    throw error;
  }
}

/**
 * Generate Lean Canvas only
 */
export async function generateLeanCanvas(request: {
  idea: string;
  target_market?: string;
  business_model?: string;
}): Promise<LeanCanvas> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/business-plan/lean-canvas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
        target_market: request.target_market || '',
        business_model: request.business_model || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error generating lean canvas:', error);
    throw error;
  }
}

/**
 * Estimate financial projections
 */
export async function estimateFinancials(request: {
  idea: string;
  business_model?: string;
  target_market_size?: string;
}): Promise<FinancialEstimate> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/business-plan/financials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
        business_model: request.business_model || '',
        target_market_size: request.target_market_size || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error estimating financials:', error);
    throw error;
  }
}

/**
 * Map team roles and composition
 */
export async function mapTeamRoles(request: {
  idea: string;
  business_model?: string;
  stage?: string;
}): Promise<TeamComposition> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/business-plan/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
        business_model: request.business_model || '',
        stage: request.stage || 'pre-seed',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error mapping team roles:', error);
    throw error;
  }
}

// DEPRECATED: buildMarketingStrategy - Use comprehensive marketing strategy endpoint instead

/**
 * Check regulatory compliance
 */
export async function checkRegulatoryCompliance(request: {
  idea: string;
  industry?: string;
  region?: string;
}): Promise<RegulatoryCompliance> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/business-plan/compliance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        idea: request.idea,
        industry: request.industry || '',
        region: request.region || 'United States',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error checking compliance:', error);
    throw error;
  }
}

/**
 * Check Business Planning Agent health
 */
export async function checkBusinessPlanningHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/business-plan/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking business planning health:', error);
    throw error;
  }
}
