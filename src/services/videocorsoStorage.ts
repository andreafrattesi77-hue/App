import { VIDEOCORSO } from '../../content/videocorso';
import { ModuloVideo } from '../../content/types';

const STORAGE_KEY = 'ec_videocorso_custom_urls';

export interface VideoEmbedInfo {
  type: 'html5' | 'youtube' | 'vimeo' | 'drive' | 'iframe' | 'placeholder';
  src: string;
  isExternalLink?: boolean;
}

/**
 * Converte qualsiasi URL video (YouTube, Vimeo, Google Drive, MP4 diretto)
 * nel formato ottimizzato per la riproduzione fluida direttamente all'interno dell'app.
 */
export function parseVideoEmbed(rawUrl?: string): VideoEmbedInfo {
  if (!rawUrl || !rawUrl.trim()) {
    return { type: 'placeholder', src: '' };
  }

  const url = rawUrl.trim();

  // 1. File MP4 / WebM / Percorsi locali
  if (
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.mov') ||
    url.startsWith('/assets/') ||
    url.startsWith('/videos/') ||
    url.startsWith('./') ||
    url.includes('.mp4?')
  ) {
    return { type: 'html5', src: url };
  }

  // 2. YouTube (standard, short, embed, live)
  // Supporta: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
    };
  }

  // 3. Vimeo
  // Supporta: vimeo.com/123456789 o player.vimeo.com/video/123456789
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      src: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`,
    };
  }

  // 4. Google Drive
  // Supporta: drive.google.com/file/d/ID/view o /preview
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      type: 'drive',
      src: `https://drive.google.com/file/d/${fileId}/preview`,
    };
  }

  // 5. Se è un URL generico di login o area riservata esterna
  if (url.includes('login') || url.includes('checkout')) {
    return { type: 'placeholder', src: url, isExternalLink: true };
  }

  // 6. Altri iframe sicuri
  return { type: 'iframe', src: url };
}

/**
 * Recupera i moduli del videocorso arricchiti con eventuali URL personalizzati
 * salvati dall'insegnante/amministratore.
 */
export function getVideoCourseModules(): ModuloVideo[] {
  let customMap: Record<number, string> = {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      customMap = JSON.parse(saved);
    }
  } catch {}

  return VIDEOCORSO.map((m) => {
    const custom = customMap[m.numero];
    if (custom && custom.trim()) {
      return { ...m, videoUrl: custom.trim() };
    }
    return m;
  });
}

/**
 * Salva l'URL di un modulo specifico
 */
export function saveModuleVideoUrl(moduleNumber: number, url: string): void {
  try {
    let customMap: Record<number, string> = {};
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      customMap = JSON.parse(saved);
    }
    customMap[moduleNumber] = url.trim();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap));
  } catch {}
}
