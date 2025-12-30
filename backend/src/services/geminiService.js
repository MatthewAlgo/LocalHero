/**
 * Gemini Service
 * Generates local SEO content using Google's Gemini Flash model
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  /**
   * Helper to generate content with system context
   */
  async generateText(systemPrompt, userPrompt) {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await this.model.generateContent(fullPrompt);
    const response = await result.response;
    return {
      text: response.text(),
      tokens: response.usageMetadata ? response.usageMetadata.totalTokenCount : 0
    };
  }

  /**
   * Generate a Google Business Profile post with local landmarks
   */
  async generateGBPPost({ businessName, serviceType, city, state, landmarks, keywords = [], tone = 'professional' }) {
    const landmarkMentions = this.formatLandmarkMentions(landmarks);
    
    const systemPrompt = 'You are an expert local SEO copywriter who creates authentic, location-specific content.';
    const userPrompt = `You are a local SEO expert writing a Google Business Profile post for a ${serviceType} business.

Business: ${businessName}
Location: ${city}, ${state}
Keywords to naturally include: ${keywords.join(', ') || serviceType}
Tone: ${tone}

Local landmarks and points of interest to mention naturally:
${landmarkMentions}

Write a compelling 150-200 word Google Business Profile post that:
1. Highlights the business's service
2. Naturally mentions 2-3 of the local landmarks to establish local relevance
3. Includes a call-to-action
4. Feels authentic and local, not generic

The post should feel like it was written by someone who actually knows the area. Do NOT use phrases like "in your area" or "local community" - be specific with the landmarks.`;

    try {
      const result = await this.generateText(systemPrompt, userPrompt);
      return {
        content: result.text,
        landmarksUsed: landmarks.slice(0, 3).map(l => l.name),
        tokensUsed: result.tokens
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate GBP post');
    }
  }

  /**
   * Generate a location page for SEO
   */
  async generateLocationPage({ businessName, serviceType, city, state, zipCode, landmarks, keywords = [] }) {
    const landmarkMentions = this.formatLandmarkMentions(landmarks);
    
    const systemPrompt = 'You are an expert local SEO copywriter who creates authentic, location-specific content that ranks well in Google Map Pack.';
    const userPrompt = `You are a local SEO expert writing a location-specific service page.

Business: ${businessName}
Service: ${serviceType}
Location: ${city}, ${state} ${zipCode}
Target Keywords: ${keywords.join(', ') || serviceType + ' ' + city}

Local landmarks to reference naturally:
${landmarkMentions}

Write an SEO-optimized location page (400-500 words) that includes:
1. H1: "${serviceType} in ${city}, ${state}"
2. Introduction establishing local presence
3. Services section with local context
4. "Areas We Serve" section mentioning specific neighborhoods/landmarks
5. Why choose us section
6. Call-to-action

Make the content hyper-local by referencing specific landmarks, schools, and neighborhoods. This should NOT read like generic content with the city name inserted.`;

    try {
      const result = await this.generateText(systemPrompt, userPrompt);
      return {
        content: result.text,
        landmarksUsed: landmarks.map(l => l.name),
        tokensUsed: result.tokens
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate location page');
    }
  }

  /**
   * Generate a review response
   */
  async generateReviewResponse({ businessName, serviceType, reviewerName, rating, reviewText, tone = 'professional' }) {
    const sentiment = rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative';
    
    const systemPrompt = 'You are a business owner who personally responds to every review with authenticity and care.';
    const userPrompt = `You are responding to a customer review for ${businessName}, a ${serviceType} business.

Reviewer: ${reviewerName || 'Customer'}
Rating: ${rating}/5 stars
Review: "${reviewText}"
Sentiment: ${sentiment}
Desired Tone: ${tone}

Write a personalized response (50-100 words) that:
1. Thanks them by name if provided
2. ${sentiment === 'positive' ? 'Expresses genuine gratitude and mentions a specific point from their review' : ''}
3. ${sentiment === 'neutral' ? 'Acknowledges their feedback and offers to improve' : ''}
4. ${sentiment === 'negative' ? 'Apologizes sincerely, takes responsibility, and offers to make it right' : ''}
5. Mentions the specific service if relevant (e.g., "Glad we could fix your ${serviceType.toLowerCase()}...")
6. Invites them back or to contact you directly

Do NOT use generic phrases like "valued customer" - make it personal and authentic.`;

    try {
      const result = await this.generateText(systemPrompt, userPrompt);
      return {
        response: result.text,
        tokensUsed: result.tokens
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate review response');
    }
  }

  /**
   * Generate social media post variations
   */
  async generateSocialPosts({ businessName, serviceType, city, landmarks, count = 3 }) {
    const landmarkMentions = this.formatLandmarkMentions(landmarks);
    
    const systemPrompt = 'You are a social media expert for local businesses.';
    const userPrompt = `Create ${count} unique social media posts for ${businessName}, a ${serviceType} in ${city}.

Local landmarks to reference:
${landmarkMentions}

For each post:
- Keep it under 280 characters
- Include a local reference
- Include a call-to-action
- Make each post distinct in approach (tip, promotion, community mention, etc.)

Format as a numbered list.`;

    try {
      const result = await this.generateText(systemPrompt, userPrompt);
      return {
        posts: result.text,
        tokensUsed: result.tokens
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate social posts');
    }
  }

  /**
   * Format landmarks for prompt injection
   */
  formatLandmarkMentions(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return 'No specific landmarks available.';
    }

    return landmarks.map(l => {
      let desc = `- ${l.name} (${l.type})`;
      if (l.address) desc += ` - near ${l.address}`;
      return desc;
    }).join('\n');
  }
}

// Factory function
function createGeminiService() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set. Gemini service will not work.');
  }
  return new GeminiService(apiKey);
}

module.exports = { GeminiService, createGeminiService };
