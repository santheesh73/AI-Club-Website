import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { ApiResponse, ApiErrorResponse, HealthCheckResponse } from '@/types/api';

/**
 * Standard API Client with automatic bearer token attachment and unified error handling
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        return data.session.access_token;
      }

      // Check for active demo session in localStorage
      const devSession = localStorage.getItem('ai_club_dev_user_session');
      if (devSession) {
        try {
          const parsed = JSON.parse(devSession);
          if (parsed.token) return parsed.token;
          if (parsed.role === 'admin') return 'admin-test-token';
          if (parsed.role === 'member') return 'member-test-token';
          return 'user-a-token';
        } catch {
          // ignore corrupted session JSON
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  public async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = await this.getAuthToken();

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        if (json && 'success' in json && json.success === false) {
          return json as ApiErrorResponse;
        }

        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText || 'Request failed',
            details: json,
          },
        };
      }

      return json as ApiResponse<T>;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message,
        },
      };
    }
  }

  public get<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public post<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public put<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public patch<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public delete<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  public checkHealth(): Promise<ApiResponse<HealthCheckResponse>> {
    return this.get<HealthCheckResponse>('/health');
  }
}

export const apiClient = new ApiClient(env.apiBaseUrl);
