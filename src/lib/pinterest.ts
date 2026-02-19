/* Pinterest conversion tracking helpers */

declare global {
  interface Window {
    pintrk?: (...args: unknown[]) => void;
  }
}

export function pinterestTrack(
  event: string,
  params: Record<string, unknown> = {}
) {
  if (typeof window !== 'undefined' && typeof window.pintrk === 'function') {
    window.pintrk('track', event, params);
  }
}
