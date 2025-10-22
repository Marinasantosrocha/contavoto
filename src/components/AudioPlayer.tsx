import React, { useEffect, useMemo, useRef, useState } from 'react';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

const formatTime = (seconds?: number) => {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [current, setCurrent] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const id = useMemo(() => `audio-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = 'metadata';
    audioRef.current = audio;
    (audio as any).dataset = { customPlayer: 'true' };
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrent(audio.currentTime || 0);
    const onEnd = () => setPlaying(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const pauseOthers = (e: CustomEvent) => {
      const mine = e.detail === id;
      if (!mine && audioRef.current) audioRef.current.pause();
    };
    window.addEventListener('audio-play', pauseOthers as EventListener);
    return () => window.removeEventListener('audio-play', pauseOthers as EventListener);
  }, [id]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      // pausa outros players
      window.dispatchEvent(new CustomEvent('audio-play', { detail: id }));
      audio.play();
      setPlaying(true);
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrent(newTime);
  };

  const remaining = Math.max(0, duration - current);

  return (
    <div className={`audio-player ${className || ''}`.trim()}>
      <button type="button" className={`ap-btn ${playing ? 'pause' : 'play'}`} onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Reproduzir'}>
        {playing ? '❚❚' : '►'}
      </button>
      <div className="ap-track">
        <div className="ap-time">{formatTime(remaining)}</div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(current, duration || 0)}
          onChange={onSeek}
          className="ap-range"
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
