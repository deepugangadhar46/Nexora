// Plausible Analytics Integration (Privacy-focused, free tier available)

interface PlausibleEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
}

class PlausibleAnalytics {
  private enabled: boolean;

  constructor() {
    this.enabled = !!import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  }

  // Track page view
  trackPageView(url?: string) {
    if (!this.enabled || typeof window === 'undefined') return;

    const plausible = (window as any).plausible;
    if (plausible) {
      plausible('pageview', { u: url || window.location.href });
    }
  }

  // Track custom event
  trackEvent(eventName: string, props?: Record<string, string | number | boolean>) {
    if (!this.enabled || typeof window === 'undefined') return;

    const plausible = (window as any).plausible;
    if (plausible) {
      plausible(eventName, { props });
    }
  }

  // Predefined events for common actions
  trackSignup(method: 'email' | 'google' | 'github') {
    this.trackEvent('Signup', { method });
  }

  trackLogin(method: 'email' | 'google' | 'github') {
    this.trackEvent('Login', { method });
  }

  trackTemplateSelected(templateId: string, templateName: string) {
    this.trackEvent('Template Selected', { 
      template_id: templateId,
      template_name: templateName 
    });
  }

  trackCodeGeneration(success: boolean, templateUsed: boolean) {
    this.trackEvent('Code Generated', { 
      success: success.toString(),
      template_used: templateUsed.toString()
    });
  }

  trackPayment(amount: number, credits: number) {
    this.trackEvent('Payment', { 
      amount,
      credits 
    });
  }

  trackReferral(action: 'link_copied' | 'link_shared' | 'referral_completed') {
    this.trackEvent('Referral', { action });
  }

  trackDownload(fileType: 'zip' | 'individual') {
    this.trackEvent('Download', { file_type: fileType });
  }

  trackDeploy(success: boolean) {
    this.trackEvent('Deploy', { success: success.toString() });
  }

  trackOAuthStart(provider: 'google' | 'github') {
    this.trackEvent('OAuth Started', { provider });
  }

  trackError(errorType: string, errorMessage: string) {
    this.trackEvent('Error', { 
      error_type: errorType,
      error_message: errorMessage.substring(0, 100) // Limit length
    });
  }

  // Hackathon Demo Events
  trackGenerateMVP(productName: string, techStack: string[]) {
    this.trackEvent('Generate MVP', {
      product_name: productName.substring(0, 50),
      tech_stack: techStack.join(',').substring(0, 100)
    });
  }

  trackViewPreview(previewType: 'sandbox' | 'mock') {
    this.trackEvent('View Preview', { preview_type: previewType });
  }

  trackGenerateDeck(slideCount: number) {
    this.trackEvent('Generate Deck', { slide_count: slideCount });
  }

  trackMarketResearch(competitorCount: number) {
    this.trackEvent('Market Research', { competitor_count: competitorCount });
  }

  trackExportProject(format: 'zip' | 'github') {
    this.trackEvent('Export Project', { format });
  }
}

// Export singleton instance
export const analytics = new PlausibleAnalytics();

// Initialize Plausible script
export const initPlausible = () => {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  if (!domain || typeof window === 'undefined') return;

  // Check if script already exists
  if (document.querySelector('script[data-domain]')) return;

  const script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', domain);
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
};
