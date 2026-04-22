export type Page = 'landing' | 'auth' | 'home' | 'explore' | 'portfolio' | 'settings' | 'level' | 'admin';

export interface RouteState {
  page: Page;
  level?: number;
}

export function parseRoute(): RouteState {
  const params = new URLSearchParams(window.location.search);
  const page = (params.get('page') || 'landing') as Page;
  const levelParam = params.get('level');
  const level = levelParam ? parseInt(levelParam, 10) || undefined : undefined;
  return { page, level };
}

export function navigate(page: Page, extra?: Record<string, string | number>): void {
  const params = new URLSearchParams({ page });
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      params.set(k, String(v));
    }
  }
  window.history.pushState({}, '', '?' + params.toString());
  window.dispatchEvent(new PopStateEvent('popstate'));
}
