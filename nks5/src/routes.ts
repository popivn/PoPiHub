export type RoutePath = '/' | '/guild' | '/social' | string;

export function navigateTo(path: RoutePath) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('popstate'));
}
