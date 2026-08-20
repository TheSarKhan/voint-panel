import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { GlassButton } from "./GlassButton";
import { cx } from "./styles";

export interface AudioWaveformPlayerProps {
  audioUrl?: string;
  title?: string;
  durationSeconds?: number;
  className?: string;
}

export function AudioWaveformPlayer({
  audioUrl: _audioUrl,
  title = "Zəngin audio yazısı",
  durationSeconds = 134, // 2:14 default
  className,
}: AudioWaveformPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const [isMuted, setIsMuted] = useState(false);

  // 48 waveform bar heights
  const barHeights = [
    18, 25, 42, 65, 80, 45, 30, 55, 78, 92, 60, 40, 70, 85, 95, 60, 35, 20, 50,
    75, 90, 85, 45, 65, 80, 50, 30, 45, 70, 85, 95, 60, 40, 25, 55, 75, 88, 65,
    45, 30, 55, 70, 85, 50, 30, 20, 15, 10,
  ];

  // Simulated audio playback
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.25 * playbackSpeed;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, durationSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = Math.min(100, (currentTime / durationSeconds) * 100);

  const handleSeek = (idx: number) => {
    const targetSec = (idx / barHeights.length) * durationSeconds;
    setCurrentTime(targetSec);
  };

  const cycleSpeed = () => {
    const speeds: Array<1 | 1.25 | 1.5 | 2> = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  return (
    <GlassCard className={cx("p-5 sm:p-6 bg-white border-[#e5e5e5]", className)}>
      {/* Top details */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f5f5] text-[#0a0a0a]">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#0a0a0a]">{title}</h4>
            <p className="text-xs text-[#6b6b6b]">
              Voint Voice Engine (HD Səs)
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#f5f5f5] border border-[#e5e5e5] px-3 py-1 text-xs font-mono text-[#0a0a0a]">
          {formatTime(currentTime)} / {formatTime(durationSeconds)}
        </span>
      </div>

      {/* Waveform Visualization Bars */}
      <div className="relative py-4 px-3 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] mb-5">
        <div className="flex items-center justify-between gap-1 h-12 cursor-pointer select-none">
          {barHeights.map((h, i) => {
            const barProgress = (i / barHeights.length) * 100;
            const isPassed = barProgress <= progressPercent;

            return (
              <div
                key={i}
                onClick={() => handleSeek(i)}
                className="group relative flex-1 flex items-center justify-center h-full py-1"
              >
                <div
                  style={{ height: `${h}%` }}
                  className={cx(
                    "w-full max-w-[4px] rounded-full transition-all duration-150 group-hover:scale-y-125",
                    isPassed
                      ? "bg-[#0a0a0a]"
                      : "bg-[#d4d4d4] group-hover:bg-[#a3a3a3]"
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Progress Line */}
        <div
          style={{ left: `${progressPercent}%` }}
          className="absolute top-2 bottom-2 w-0.5 bg-[#0a0a0a] pointer-events-none transition-all duration-100"
        />
      </div>

      {/* Player Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTime((t) => Math.max(0, t - 5))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b6b6b] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            title="5 saniyə geri"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a0a0a] text-white hover:bg-[#0a0a0a]/85 transition-transform active:scale-95 shadow-sm cursor-pointer"
            title={isPlaying ? "Dayandır" : "Oynat"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-white stroke-white" />
            ) : (
              <Play className="h-4 w-4 fill-white stroke-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() => setCurrentTime((t) => Math.min(durationSeconds, t + 10))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b6b6b] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            title="10 saniyə irəli"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        {/* Speed, Mute & Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={cycleSpeed}
            className="rounded-full border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] px-3 py-1.5 text-xs font-semibold text-[#0a0a0a] transition-colors cursor-pointer"
            title="Sürəti dəyiş"
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b6b6b] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            title={isMuted ? "Səsi aç" : "Səssizə al"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-red-600" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <GlassButton
            size="sm"
            variant="secondary"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            className="hidden sm:inline-flex text-xs"
          >
            Yüklə (.wav)
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}
