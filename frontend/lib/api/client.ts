/**
 * Vexa.ai API Client
 * Axios-based HTTP client with authentication and error handling
 */

import axios, {  type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_VEXA_API_URL || 'https://voice.axiomic.com.cy';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add API key from localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get Vexa API token from localStorage
    const vexaToken = localStorage.getItem('vexa_api_token');

    if (vexaToken && config.headers) {
      config.headers['X-API-Key'] = vexaToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to sign-in
          localStorage.removeItem('vexa_api_token');
          window.location.href = '/sign-in?error=unauthorized';
          break;

        case 403:
          // Forbidden
          console.error('Access forbidden:', data?.message || 'Insufficient permissions');
          break;

        case 404:
          // Not found
          console.error('Resource not found:', error.config?.url);
          break;

        case 429:
          // Rate limited
          console.error('Rate limit exceeded. Please try again later.');
          break;

        case 500:
        case 502:
        case 503:
          // Server error
          console.error('Server error:', data?.message || 'Internal server error');
          break;

        default:
          console.error(`API error (${status}):`, data?.message || error.message);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error: No response from server');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to set API token
export const setVexaApiToken = (token: string) => {
  localStorage.setItem('vexa_api_token', token);
};

// Helper function to get API token
export const getVexaApiToken = (): string | null => {
  return localStorage.getItem('vexa_api_token');
};

// Helper function to remove API token
export const removeVexaApiToken = () => {
  localStorage.removeItem('vexa_api_token');
};

// Helper function to check if user has API token
export const hasVexaApiToken = (): boolean => {
  return !!getVexaApiToken();
};

export default apiClient;
