import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from 'react'

interface WidgetMediaPlayerProps {
  readonly kind: 'audio' | 'video'
  readonly label?: string
  readonly source?: string
  readonly showControls?: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const seconds = Math.floor(value % 60).toString().padStart(2, '0')
  return `${Math.floor(value / 60)}:${seconds}`
}

export function WidgetMediaPlayer({ kind, label = '', source, showControls = true }: WidgetMediaPlayerProps) {
  const mediaRef = useRef<HTMLMediaElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const percentage = safeDuration > 0 ? clamp((currentTime / safeDuration) * 100, 0, 100) : 0

  function sync(media: HTMLMediaElement): void {
    setDuration(Number.isFinite(media.duration) ? media.duration : 0)
    setCurrentTime(Number.isFinite(media.currentTime) ? media.currentTime : 0)
    setMuted(media.muted)
    setPlaying(!media.paused && !media.ended)
  }

  function togglePlayback(): void {
    const media = mediaRef.current
    if (!media) return
    if (media.paused || media.ended) {
      void media.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      media.pause()
      setPlaying(false)
    }
  }

  function toggleMuted(): void {
    const media = mediaRef.current
    if (!media) return
    media.muted = !media.muted
    setMuted(media.muted)
  }

  function seek(next: number): void {
    const media = mediaRef.current
    if (!media || safeDuration <= 0) return
    const target = clamp(next, 0, safeDuration)
    media.currentTime = target
    setCurrentTime(target)
  }

  function seekFromPointer(event: ReactPointerEvent<HTMLButtonElement>): void {
    if (safeDuration <= 0) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (bounds.width <= 0) return
    const ratio = clamp((event.clientX - bounds.left) / bounds.width, 0, 1)
    seek(ratio * safeDuration)
  }

  function handleSeekKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (safeDuration <= 0) return
    const smallStep = Math.max(1, safeDuration / 100)
    const largeStep = Math.max(5, safeDuration / 10)
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); seek(currentTime - smallStep) }
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); seek(currentTime + smallStep) }
    else if (event.key === 'PageDown') { event.preventDefault(); seek(currentTime - largeStep) }
    else if (event.key === 'PageUp') { event.preventDefault(); seek(currentTime + largeStep) }
    else if (event.key === 'Home') { event.preventDefault(); seek(0) }
    else if (event.key === 'End') { event.preventDefault(); seek(safeDuration) }
  }

  const mediaEvents = {
    onDurationChange: (event: SyntheticEvent<HTMLMediaElement>) => sync(event.currentTarget),
    onEnded: (event: SyntheticEvent<HTMLMediaElement>) => sync(event.currentTarget),
    onLoadedMetadata: (event: SyntheticEvent<HTMLMediaElement>) => sync(event.currentTarget),
    onPause: (event: SyntheticEvent<HTMLMediaElement>) => sync(event.currentTarget),
    onPlay: (event: SyntheticEvent<HTMLMediaElement>) => sync(event.currentTarget),
    onTimeUpdate: (event: SyntheticEvent<HTMLMediaElement>) => sync(event.currentTarget),
    onVolumeChange: (event: SyntheticEvent<HTMLMediaElement>) => sync(event.currentTarget),
  }

  return (
    <div aria-label={`Reproductor: ${label || (kind === 'video' ? 'video' : 'audio')}`} className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm" data-electrocms-widget-control="media-player" role="group">
      {kind === 'video' ? (
        <video
          {...mediaEvents}
          aria-label={label || undefined}
          className="block aspect-video w-full bg-black object-contain"
          controls={false}
          preload="metadata"
          ref={(node) => { mediaRef.current = node }}
          src={source}
        />
      ) : (
        <audio
          {...mediaEvents}
          aria-label={label || undefined}
          className="hidden"
          controls={false}
          preload="metadata"
          ref={(node) => { mediaRef.current = node }}
          src={source}
        />
      )}
      {kind === 'audio' ? <div className="flex min-h-16 items-center gap-2 bg-muted/25 px-3"><svg aria-hidden="true" className="size-6 text-primary" fill="none" viewBox="0 0 24 24"><path d="M9 18V5l10-2v13M9 18c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2Zm10-2c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg><span className="truncate text-sm font-semibold text-foreground">{label || 'Audio'}</span></div> : null}
      {showControls ? (
        <div className="flex min-h-12 items-center gap-2 border-t border-border bg-surface px-2 py-1.5" role="toolbar" aria-label={`Controles de ${label || (kind === 'video' ? 'video' : 'audio')}`}>
          <button aria-label={playing ? 'Pausar' : 'Reproducir'} aria-pressed={playing} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={togglePlayback} type="button">
            {playing ? <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 16 16"><path d="M4 3h3v10H4V3Zm5 0h3v10H9V3Z" /></svg> : <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 16 16"><path d="m4 2 9 6-9 6V2Z" /></svg>}
          </button>
          <button aria-label="Posición de reproducción" aria-valuemax={safeDuration || 0} aria-valuemin={0} aria-valuenow={currentTime} className="relative h-11 min-w-20 flex-1 cursor-pointer touch-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onKeyDown={handleSeekKeyDown} onPointerDown={seekFromPointer} role="slider" type="button">
            <span aria-hidden="true" className="absolute left-2 right-2 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary transition-[width] duration-100" style={{ width: `${percentage}%` }} /></span>
            <span aria-hidden="true" className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-surface shadow-sm" style={{ left: `calc(0.5rem + ${percentage}% * 0.84)` }} />
          </button>
          <output className="min-w-[4.5rem] text-center text-[0.625rem] font-semibold tabular-nums text-muted-foreground">{formatTime(currentTime)} / {formatTime(safeDuration)}</output>
          <button aria-label={muted ? 'Activar sonido' : 'Silenciar'} aria-pressed={muted} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={toggleMuted} type="button">
            {muted ? <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16"><path d="M2.5 6h2L8 3.5v9L4.5 10h-2V6Zm8.5.5 3 3m0-3-3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg> : <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16"><path d="M2.5 6h2L8 3.5v9L4.5 10h-2V6Zm8-1.5a5 5 0 0 1 0 7m-1.5-5a2.5 2.5 0 0 1 0 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>}
          </button>
        </div>
      ) : null}
    </div>
  )
}
