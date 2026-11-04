import { ProjectTemplate, TemplateElement } from '../types';
import JSZip from 'jszip';

/**
 * Canvas Video Renderer
 * Renders high-fidelity video clips using HTML5 Canvas & MediaRecorder API
 */
export class CanvasVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private template: ProjectTemplate;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(template: ProjectTemplate) {
    this.template = template;
    this.canvas = document.createElement('canvas');
    this.canvas.width = template.dimensions.width;
    this.canvas.height = template.dimensions.height;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
  }

  /**
   * Preload images to avoid flickers during rendering
   */
  async preloadAssets(): Promise<void> {
    const urls: string[] = [];
    if (this.template.defaultBackgroundUrl) urls.push(this.template.defaultBackgroundUrl);
    this.template.elements.forEach(el => {
      if (el.src) urls.push(el.src);
    });

    const loadPromises = urls.map(url => {
      if (this.imageCache.has(url)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.imageCache.set(url, img);
          resolve();
        };
        img.onerror = () => {
          // If image fails, continue gracefully
          resolve();
        };
        img.src = url;
      });
    });

    await Promise.all(loadPromises);
  }

  /**
   * Renders a single frame at a given timecode (seconds)
   */
  renderFrame(currentTime: number): void {
    const { ctx, canvas } = this;
    const { width, height } = canvas;

    // 1. Clear background
    ctx.clearRect(0, 0, width, height);

    // 2. Draw Background
    const bgUrl = this.template.defaultBackgroundUrl;
    if (bgUrl && this.imageCache.has(bgUrl)) {
      const img = this.imageCache.get(bgUrl)!;
      // Draw cover
      const hRatio = width / img.width;
      const vRatio = height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (width - img.width * ratio) / 2;
      const centerShiftY = (height - img.height * ratio) / 2;
      ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
    } else {
      // Elegant dark gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = this.template.backgroundColor || grad;
      ctx.fillRect(0, 0, width, height);
    }

    // Add cinematic dark overlay for contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, width, height);

    // 3. Render Elements sorted by zIndex
    const sortedElements = [...this.template.elements]
      .filter(el => el.isVisible)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sortedElements) {
      // Check timeline boundary
      if (currentTime < el.startTime || currentTime > (el.startTime + el.duration)) {
        continue;
      }

      ctx.save();

      // Calculate time progress within element lifecycle
      const elementAge = currentTime - el.startTime;
      let animOpacity = el.opacity;
      let animScale = 1;
      let animOffsetY = 0;

      // Handle Entrance Animations
      if (el.textAnimation === 'fade-in') {
        animOpacity = Math.min(1, elementAge / 0.5) * el.opacity;
      } else if (el.textAnimation === 'slide-up') {
        const slideProgress = Math.min(1, elementAge / 0.6);
        animOffsetY = (1 - easeOutCubic(slideProgress)) * 50;
        animOpacity = slideProgress * el.opacity;
      } else if (el.textAnimation === 'pop' || el.textAnimation === 'bounce') {
        const popProgress = Math.min(1, elementAge / 0.5);
        animScale = easeOutBack(popProgress);
      }

      ctx.globalAlpha = animOpacity;

      // Transform positioning & rotation
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2 + animOffsetY;

      ctx.translate(centerX, centerY);
      if (el.rotation) {
        ctx.rotate((el.rotation * Math.PI) / 180);
      }
      ctx.scale(animScale, animScale);
      ctx.translate(-el.width / 2, -el.height / 2);

      // Render Shape
      if (el.type === 'shape' || el.type === 'badge') {
        this.renderShape(el);
      }

      // Render Image
      if (el.type === 'image' && el.src) {
        const img = this.imageCache.get(el.src);
        if (img) {
          ctx.drawImage(img, 0, 0, el.width, el.height);
        }
      }

      // Render Text
      if (el.type === 'text' || el.type === 'badge' || el.type === 'watermark') {
        this.renderText(el, elementAge);
      }

      ctx.restore();
    }

    // 4. Render Viral Quiz Tension Countdown Bar (between 4.0s and 7.5s)
    if (currentTime >= 4.0 && currentTime <= 7.5) {
      const timerProgress = Math.max(0, Math.min(1, 1 - (currentTime - 4.0) / 3.5));
      const remainingSecs = Math.max(1, Math.ceil(7.5 - currentTime));
      const barW = Math.min(720, width * 0.75);
      const barH = 24;
      const barX = (width - barW) / 2;
      const barY = height * 0.44;

      ctx.save();
      // Background bar pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Filled gradient bar (Amber to Red)
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#ef4444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(barX + 2, barY + 2, Math.max(0, (barW - 4) * timerProgress), barH - 4, 10);
      ctx.fill();

      // Countdown text with subtle pulse
      const pulseScale = 1 + Math.sin(currentTime * 12) * 0.05;
      ctx.translate(width / 2, barY - 18);
      ctx.scale(pulseScale, pulseScale);
      ctx.font = '800 32px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(`⏱️ TIME'S TICKING: ${remainingSecs}s`, 0, 0);
      ctx.restore();
    }

    // 5. Render Correct Answer Celebration Burst (between 7.5s and 12s)
    if (currentTime >= 7.5) {
      const celebrateAge = currentTime - 7.5;
      ctx.save();
      // Sparkle stars around answer area
      const starCount = 8;
      const burstRadius = Math.min(260, 90 + celebrateAge * 45);
      for (let i = 0; i < starCount; i++) {
        const angle = (i / starCount) * Math.PI * 2 + celebrateAge * 2;
        const sx = width / 2 + Math.cos(angle) * burstRadius;
        const sy = (height * 0.68) + Math.sin(angle) * 70;
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i % 2 === 0 ? '✨' : '⭐', sx, sy);
      }
      ctx.restore();
    }
  }

  private renderShape(el: TemplateElement): void {
    const { ctx } = this;
    ctx.beginPath();

    const r = el.borderRadius || 12;
    if (el.shapeType === 'circle') {
      ctx.arc(el.width / 2, el.height / 2, el.width / 2, 0, Math.PI * 2);
    } else {
      // Rounded rect
      ctx.roundRect(0, 0, el.width, el.height, r);
    }

    if (el.backgroundColor) {
      ctx.fillStyle = el.backgroundColor;
      ctx.fill();
    }

    if (el.borderWidth && el.borderColor) {
      ctx.lineWidth = el.borderWidth;
      ctx.strokeStyle = el.borderColor;
      ctx.stroke();
    }
  }

  private renderText(el: TemplateElement, elementAge: number): void {
    const { ctx } = this;
    let displayText = el.text || el.defaultValue || '';

    // Handle Typewriter Animation
    if (el.textAnimation === 'typewriter') {
      const charsPerSecond = 25;
      const visibleChars = Math.floor(elementAge * charsPerSecond);
      displayText = displayText.slice(0, visibleChars);
    }

    ctx.font = `${el.fontWeight || '600'} ${el.fontSize}px "${el.fontFamily || 'Plus Jakarta Sans'}", sans-serif`;
    ctx.textAlign = el.textAlign || 'center';
    ctx.textBaseline = 'middle';

    // Text Background Pill if configured
    if (el.backgroundColor && el.type === 'text') {
      ctx.fillStyle = el.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(0, 0, el.width, el.height, 12);
      ctx.fill();
    }

    let drawX = el.width / 2;
    if (el.textAlign === 'left') drawX = 20;
    if (el.textAlign === 'right') drawX = el.width - 20;
    const drawY = el.height / 2;

    // Word Wrap Multi-line Text
    const words = displayText.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = el.width - 40;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = el.fontSize * (el.lineHeight || 1.25);
    const totalBlockHeight = lines.length * lineHeight;
    let startY = drawY - totalBlockHeight / 2 + lineHeight / 2;

    for (const line of lines) {
      // Shadow
      if (el.shadowColor) {
        ctx.shadowColor = el.shadowColor;
        ctx.shadowBlur = el.shadowBlur || 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      // Stroke / Outline
      if (el.outlineWidth && el.outlineColor) {
        ctx.lineWidth = el.outlineWidth;
        ctx.strokeStyle = el.outlineColor;
        ctx.strokeText(line, drawX, startY);
      }

      // Fill text
      ctx.fillStyle = el.color || '#ffffff';
      ctx.fillText(line, drawX, startY);

      // Reset shadow for next lines
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      startY += lineHeight;
    }
  }

  /**
   * Generates a high quality thumbnail PNG as Data URL
   */
  generateThumbnail(atSeconds = 1): string {
    this.renderFrame(atSeconds);
    return this.canvas.toDataURL('image/png', 0.95);
  }

  /**
   * Renders the complete video and records to a WebM/MP4 Blob with progress callback
   */
  async renderVideoBlob(
    fps = 20,
    onProgress?: (progress: number) => void,
    durationSeconds?: number
  ): Promise<Blob> {
    await this.preloadAssets();

    const stream = this.canvas.captureStream(fps);
    const totalDuration = durationSeconds || (this.template.duration || 12);
    
    // Add synthesized Web Audio track with countdown ticks & answer chime
    const audioTrack = createAudioTrackForVideo(totalDuration);
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4');

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 3_500_000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: mimeType });
        resolve(videoBlob);
      };

      mediaRecorder.onerror = (err) => {
        reject(err);
      };

      mediaRecorder.start();

      const totalDuration = durationSeconds || (this.template.duration || 8);
      const totalFrames = Math.max(10, Math.floor(totalDuration * fps));
      let currentFrame = 0;

      const frameInterval = Math.max(25, 1000 / fps);
      const intervalId = setInterval(() => {
        if (currentFrame >= totalFrames) {
          clearInterval(intervalId);
          setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          }, 150);
          return;
        }

        const currentTime = (currentFrame / totalFrames) * totalDuration;
        this.renderFrame(currentTime);
        currentFrame++;

        if (onProgress) {
          onProgress(Math.min(100, Math.round((currentFrame / totalFrames) * 100)));
        }
      }, frameInterval);
    });
  }
}

export interface ExportBundleItem {
  index: number;
  title: string;
  blob: Blob;
  folderName?: string;
  ratio?: string;
  resolution?: string;
}

/**
 * Creates a ZIP file containing multiple generated videos and metadata,
 * organized into platform-specific subfolders (YouTube 16:9, Reels/TikTok 9:16, IG Square 1:1, FB Portrait 4:5).
 */
export async function bundleVideosToZip(
  items: ExportBundleItem[],
  onZipProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  // Determine if multi-folder organization is used
  const hasCustomFolders = items.some(item => !!item.folderName);

  if (hasCustomFolders) {
    // Multi-Platform Folder Organization
    const folderCache = new Map<string, JSZip>();

    for (const item of items) {
      const folderKey = item.folderName || 'General_Videos';
      if (!folderCache.has(folderKey)) {
        folderCache.set(folderKey, zip.folder(folderKey)!);
      }
      const targetFolder = folderCache.get(folderKey)!;
      const ratioTag = item.ratio ? `_${item.ratio.replace(':', 'x')}` : '';
      const filename = `video_${String(item.index).padStart(3, '0')}_${sanitizeFilename(item.title)}${ratioTag}.webm`;
      targetFolder.file(filename, item.blob);
    }

    // Add comprehensive Platform Readme
    const readmeContent = `=====================================================
OMNICUT STUDIO ELITE - MULTI-PLATFORM VIDEO EXPORT
=====================================================

This archive contains high-definition videos tailored for all major social networks:

📁 YouTube_16x9_Landscape/
   - Resolution: 1920x1080 (16:9 Widescreen)
   - Recommended Platforms: YouTube Main, Facebook Desktop, TV Displays, Websites

📁 Instagram_Reels_TikTok_9x16_Vertical/
   - Resolution: 1080x1920 (9:16 Smartphone Vertical)
   - Recommended Platforms: Instagram Reels, TikTok, YouTube Shorts, Snapchat Spotlight

📁 Instagram_Feed_1x1_Square/
   - Resolution: 1080x1080 (1:1 Balanced Square)
   - Recommended Platforms: Instagram Grid Posts, Facebook Carousel, LinkedIn, Twitter/X

📁 Facebook_Feed_4x5_Portrait/
   - Resolution: 1080x1350 (4:5 Mobile Portrait)
   - Recommended Platforms: Facebook Mobile Newsfeed, Instagram Portrait Feed

Engine Specifications:
- Auto-adjusted element positions, button widths, and font sizes
- Audio clock ticking tension & celebratory answer reveal chime
- Voiceover TTS synthesized audio tracks
=====================================================`;
    zip.file('README_MULTI_PLATFORMS.txt', readmeContent);

    // Add manifest
    const manifest = items.map(item => ({
      index: item.index,
      title: item.title,
      folder: item.folderName || 'General_Videos',
      ratio: item.ratio || 'unknown',
      resolution: item.resolution || 'custom',
      filename: `video_${String(item.index).padStart(3, '0')}_${sanitizeFilename(item.title)}${item.ratio ? `_${item.ratio.replace(':', 'x')}` : ''}.webm`,
      sizeKb: Math.round(item.blob.size / 1024),
    }));
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  } else {
    // Single Folder Organization
    const folder = zip.folder('generated_videos');
    const manifest = items.map(item => ({
      index: item.index,
      title: item.title,
      filename: `video_${String(item.index).padStart(3, '0')}_${sanitizeFilename(item.title)}.webm`,
      sizeKb: Math.round(item.blob.size / 1024),
    }));

    folder?.file('manifest.json', JSON.stringify(manifest, null, 2));

    for (const item of items) {
      const filename = `video_${String(item.index).padStart(3, '0')}_${sanitizeFilename(item.title)}.webm`;
      folder?.file(filename, item.blob);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onZipProgress) onZipProgress(Math.round(metadata.percent));
  });

  return zipBlob;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/**
 * Synthesizes synchronized sound effects (clock ticks and answer chime) for video export
 */
export function createAudioTrackForVideo(durationSeconds: number): MediaStreamTrack | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    const audioCtx = new AudioContextClass();
    const dest = audioCtx.createMediaStreamDestination();

    // 1. Clock Ticking Tension pulses at 4.5s, 5.5s, 6.5s, 7.0s
    [4.5, 5.5, 6.5, 7.0].forEach(timeOffset => {
      if (timeOffset < durationSeconds) {
        const tickOsc = audioCtx.createOscillator();
        const tickGain = audioCtx.createGain();
        tickOsc.type = 'triangle';
        tickOsc.frequency.setValueAtTime(800, audioCtx.currentTime + timeOffset);
        tickGain.gain.setValueAtTime(0.25, audioCtx.currentTime + timeOffset);
        tickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + timeOffset + 0.08);
        tickOsc.connect(tickGain);
        tickGain.connect(dest);
        tickOsc.start(audioCtx.currentTime + timeOffset);
        tickOsc.stop(audioCtx.currentTime + timeOffset + 0.1);
      }
    });

    // 2. Celebratory Success Ding Chime at 7.5s (Answer Reveal)
    if (7.5 < durationSeconds) {
      [523.25, 659.25, 783.99, 1046.50].forEach(freq => {
        const chimeOsc = audioCtx.createOscillator();
        const chimeGain = audioCtx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, audioCtx.currentTime + 7.5);
        chimeGain.gain.setValueAtTime(0.2, audioCtx.currentTime + 7.5);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 7.5 + 1.8);
        chimeOsc.connect(chimeGain);
        chimeGain.connect(dest);
        chimeOsc.start(audioCtx.currentTime + 7.5);
        chimeOsc.stop(audioCtx.currentTime + 7.5 + 2.0);
      });
    }

    return dest.stream.getAudioTracks()[0] || null;
  } catch (err) {
    console.warn('Web Audio synthesis not supported or blocked:', err);
    return null;
  }
}

/**
 * Text-to-Speech Voiceover using Web Speech Synthesis API
 */
export function speakQuizVoiceover(question: string, optA?: string, optB?: string, answer?: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const script = `${question}. Option A: ${optA || ''}. Option B: ${optB || ''}. The correct answer is: ${answer || ''}`;
  const utterance = new SpeechSynthesisUtterance(script);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

