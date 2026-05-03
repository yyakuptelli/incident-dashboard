import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface AiAnalysisResult {
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  summary: string;
}

const SYSTEM_PROMPT = `You are an incident classification assistant for a software engineering team.

Given an incident title and optional description, you must respond with a JSON object (no markdown, no explanation) with exactly these fields:
- "severity": one of "low", "medium", "high", "critical"
- "service": a short service name (e.g. "Payment API", "Auth Service", "Database", "Notification Worker")
- "summary": a one or two sentence plain-language summary of the incident

Severity guidelines:
- critical: full outage, data loss, security breach, payment failure
- high: major feature broken, significant performance degradation
- medium: partial degradation, non-critical service affected
- low: minor bug, cosmetic issue, single user affected

Respond ONLY with valid JSON. No prose, no code fences.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI | null;

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    } else {
      this.logger.warn('GROQ_API_KEY not set — AI features disabled');
      this.client = null;
    }
  }

  async analyze(title: string, description?: string): Promise<AiAnalysisResult> {
    if (!this.client) {
      throw new ServiceUnavailableException('AI features are not configured. Set XAI_API_KEY in .env');
    }

    const userContent = description?.trim()
      ? `Title: ${title}\n\nDescription: ${description}`
      : `Title: ${title}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 512,
        temperature: 0,
      });

      const text = response.choices[0]?.message?.content;
      if (!text) {
        throw new ServiceUnavailableException('No response from AI');
      }

      try {
        const parsed = JSON.parse(text) as AiAnalysisResult;
        if (!['low', 'medium', 'high', 'critical'].includes(parsed.severity)) {
          parsed.severity = 'medium';
        }
        return parsed;
      } catch {
        this.logger.error('Failed to parse AI response', text);
        throw new ServiceUnavailableException('AI returned invalid response');
      }
    } catch (err) {
      if (err instanceof OpenAI.APIError) {
        this.logger.error(`xAI API error ${err.status}: ${err.message}`);
        throw new BadRequestException(`Groq API error: ${err.message}`);
      }
      throw err;
    }
  }
}
