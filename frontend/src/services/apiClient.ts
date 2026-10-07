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
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  }

  public async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Prevent double /api/v1 prefix if both baseUrl and endpoint include it
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (this.baseUrl.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1/')) {
      cleanEndpoint = cleanEndpoint.slice('/api/v1'.length);
    }
    const url = `${this.baseUrl}${cleanEndpoint}`;
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
