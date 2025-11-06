// Rate limiting utility for Riot Games API
// Personal API Key: 100 requests per 2 minutes
// Production API Key: 20,000 requests per 10 minutes

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

export class RateLimiter {
  private personalLimit: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 2 * 60 * 1000, // 2 minutes
  };

  private productionLimit: RateLimitConfig = {
    maxRequests: 20000,
    windowMs: 10 * 60 * 1000, // 10 minutes
  };

  private requests: RequestRecord[] = [];
  private isProduction: boolean;

  constructor(isProduction = false) {
    this.isProduction = isProduction;
  }

  private getCurrentLimit(): RateLimitConfig {
    return this.isProduction ? this.productionLimit : this.personalLimit;
  }

  private cleanupOldRequests(): void {
    const now = Date.now();
    const limit = this.getCurrentLimit();
    
    this.requests = this.requests.filter(
      record => now - record.timestamp < limit.windowMs
    );
  }

  canMakeRequest(): boolean {
    this.cleanupOldRequests();
    const limit = this.getCurrentLimit();
    
    const totalRequests = this.requests.reduce((sum, record) => sum + record.count, 0);
    return totalRequests < limit.maxRequests;
  }

  recordRequest(): void {
    const now = Date.now();
    this.requests.push({
      timestamp: now,
      count: 1,
    });
  }

  getRemainingRequests(): number {
    this.cleanupOldRequests();
    const limit = this.getCurrentLimit();
    const totalRequests = this.requests.reduce((sum, record) => sum + record.count, 0);
    return Math.max(0, limit.maxRequests - totalRequests);
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const limit = this.getCurrentLimit();
    const oldestRequest = this.requests[0];
    const resetTime = oldestRequest.timestamp + limit.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }

  async waitForAvailability(): Promise<void> {
    if (this.canMakeRequest()) return;
    
    const waitTime = this.getTimeUntilReset();
    console.warn(`Rate limit reached. Waiting ${waitTime}ms before next request.`);
    
    return new Promise(resolve => {
      setTimeout(resolve, waitTime + 100); // Add small buffer
    });
  }

  getStatus() {
    return {
      isProduction: this.isProduction,
      remainingRequests: this.getRemainingRequests(),
      timeUntilReset: this.getTimeUntilReset(),
      currentLimit: this.getCurrentLimit(),
    };
  }
}

// Export singleton instance
let rateLimiter: RateLimiter | null = null;

export const initializeRateLimiter = (isProduction = false): RateLimiter => {
  rateLimiter = new RateLimiter(isProduction);
  return rateLimiter;
};

export const getRateLimiter = (): RateLimiter => {
  if (!rateLimiter) {
    rateLimiter = new RateLimiter(false); // Default to personal limits
  }
  return rateLimiter;
};