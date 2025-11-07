// Token Manager for JWT refresh flow

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

class TokenManager {
  private refreshPromise: Promise<string> | null = null;

  // Get access token from localStorage
  getAccessToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get refresh token from localStorage
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Set tokens
  setTokens(accessToken: string, refreshToken: string, expiresIn: number = 3600) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    // Calculate expiry time (current time + expires_in - 5 minutes buffer)
    const expiresAt = Date.now() + (expiresIn - 300) * 1000;
    localStorage.setItem('token_expires_at', expiresAt.toString());
  }

  // Check if token is expired or about to expire
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    return Date.now() >= parseInt(expiresAt);
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.access_token) {
        this.setTokens(
          data.access_token,
          data.refresh_token || refreshToken,
          data.expires_in || 3600
        );
        return data.access_token;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearTokens();
      throw error;
    }
  }

  // Clear all tokens (logout)
  clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userCredits');
    localStorage.removeItem('userSubscription');
  }

  // Get valid token (refresh if needed)
  async getValidToken(): Promise<string | null> {
    const token = this.getAccessToken();
    
    if (!token) {
      return null;
    }

    // If token is expired, refresh it
    if (this.isTokenExpired()) {
      try {
        return await this.refreshAccessToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      }
    }

    return token;
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
