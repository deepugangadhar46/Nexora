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
// BRANDING API
// ============================================================================

export interface LogoGenerationRequest {
  company_name: string;
  idea: string;
  style?: string;
  colors?: string;
}

export interface CustomLogoRequest {
  company_name: string;
  custom_prompt: string;
}

export interface LogoResponse {
  logo_id: string;
  company_name: string;
  prompt_used: string;
  image_base64: string;
  created_at: string;
  style: string;
  colors: string;
}

export interface StyleOption {
  value: string;
  label: string;
  description: string;
}

export interface ColorOption {
  value: string;
  label: string;
  description: string;
}

/**
 * Generate a logo based on company name and idea
 */
export async function generateLogo(request: LogoGenerationRequest): Promise<LogoResponse> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/branding/generate-logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error generating logo:', error);
    throw error;
  }
}

/**
 * Generate a logo with custom user prompt
 */
export async function generateCustomLogo(request: CustomLogoRequest): Promise<LogoResponse> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/branding/generate-custom-logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error generating custom logo:', error);
    throw error;
  }
}

/**
 * Get available logo style options
 */
export async function getStyleOptions(): Promise<StyleOption[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/branding/style-options`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting style options:', error);
    throw error;
  }
}

/**
 * Get available logo color options
 */
export async function getColorOptions(): Promise<ColorOption[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/branding/color-options`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting color options:', error);
    throw error;
  }
}

/**
 * Check Branding Agent health
 */
export async function checkBrandingHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/branding/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking branding health:', error);
    throw error;
  }
}

// ============================================================================
// DEPRECATED: Old individual market research functions
// These have been replaced by the comprehensive marketing strategy endpoint
// Keeping type definitions for backwards compatibility
// ============================================================================


