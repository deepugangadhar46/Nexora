import { API_BASE_URL, OAUTH_CONFIG as CONFIG } from '../config';

// OAuth Configuration
export const OAUTH_CONFIG = {
  google: {
    clientId: CONFIG.google.clientId,
    redirectUri: `${window.location.origin}/auth/google/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid profile email',
  },
  github: {
    clientId: CONFIG.github.clientId,
    redirectUri: `${window.location.origin}/auth/github/callback`,
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'read:user user:email',
  },
};

// Generate OAuth URL
export const generateOAuthUrl = (provider: 'google' | 'github'): string => {
  const config = OAUTH_CONFIG[provider];
  const state = generateRandomState();
  
  // Store state in sessionStorage for verification
  sessionStorage.setItem(`oauth_state_${provider}`, state);
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  return `${config.authUrl}?${params.toString()}`;
};

// Generate random state for CSRF protection
const generateRandomState = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// Verify OAuth state
export const verifyOAuthState = (provider: 'google' | 'github', state: string): boolean => {
  const storedState = sessionStorage.getItem(`oauth_state_${provider}`);
  sessionStorage.removeItem(`oauth_state_${provider}`);
  return storedState === state;
};

// Handle OAuth callback
export const handleOAuthCallback = async (
  provider: 'google' | 'github',
  code: string,
  state: string
): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    // Verify state
    if (!verifyOAuthState(provider, state)) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Exchange code for token via backend (GET request with query params to match backend)
    const params = new URLSearchParams({ code });
    if (state) {
      params.append('state', state);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/${provider}/callback?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'OAuth authentication failed';
      try {
        const error = await response.json();
        errorMessage = error.message || error.detail || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Store tokens and user info
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    }

    if (data.user) {
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userCredits', data.user.credits?.toString() || '0');
      if (data.user.subscription_tier) {
        localStorage.setItem('userSubscription', data.user.subscription_tier);
      }
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return { success: false, error: error.message || 'Authentication failed' };
  }
};

// Initiate OAuth login
export const loginWithOAuth = (provider: 'google' | 'github') => {
  const url = generateOAuthUrl(provider);
  window.location.href = url;
};
