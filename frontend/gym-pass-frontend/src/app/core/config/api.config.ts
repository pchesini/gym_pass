function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080/api';
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname || 'localhost';

  return `${protocol}//${hostname}:8080/api`;
}

export const apiBaseUrl = resolveApiBaseUrl();
