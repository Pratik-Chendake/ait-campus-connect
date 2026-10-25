import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

/**
 * Global Cinematic Background Video with Dark Effect & Single-Play Freeze
 * Plays once on page load and freezes seamlessly on the final frame (photo).
 * Uses obsidian black, electric blue, and neon rose aesthetic.
 */
export default function BackgroundVideo() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [userToggled, setUserToggled] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Strict single-play configuration: no looping
    video.loop = false;
    video.removeAttribute('loop');

    // Strict DOM properties required for autonomous browser autoplay
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    const startPlayback = () => {
      // If already ended, do not restart autonomously
      if (video.ended) {
        setHasEnded(true);
        setIsPlaying(false);
        return;
      }

      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Autoplay held by browser; waiting for first interaction:', err.message);
            // Unlock on any first user gesture
            const unlockPlayback = () => {
              if (video.paused && !video.ended) {
                video.play().then(() => setIsPlaying(true)).catch(() => {});
              }
              window.removeEventListener('click', unlockPlayback);
              window.removeEventListener('keydown', unlockPlayback);
              window.removeEventListener('touchstart', unlockPlayback);
              window.removeEventListener('scroll', unlockPlayback);
            };
            window.addEventListener('click', unlockPlayback, { passive: true, once: true });
            window.addEventListener('keydown', unlockPlayback, { passive: true, once: true });
            window.addEventListener('touchstart', unlockPlayback, { passive: true, once: true });
            window.addEventListener('scroll', unlockPlayback, { passive: true, once: true });
          });
      }
    };

    if (video.readyState >= 2) {
      startPlayback();
    } else {
      video.addEventListener('loadeddata', startPlayback);
      video.addEventListener('canplay', startPlayback);
    }

    const onPlay = () => {
      setIsPlaying(true);
      setHasEnded(false);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    // When playback finishes its single run, freeze precisely on the last frame
    const onEnded = () => {
      setIsPlaying(false);
      setHasEnded(true);
      if (video.duration && !isNaN(video.duration)) {
        try {
          // Freeze exactly at the final frame (duration - 0.04s) to avoid black screen resets
          video.currentTime = Math.max(0, video.duration - 0.04);
        } catch {
          // Ignore browser seek race conditions
        }
      }
      video.pause();
    };

    // High-precision time monitor to ensure it holds the last photo smoothly
    const onTimeUpdate = () => {
      if (video.duration && !isNaN(video.duration)) {
        if (video.currentTime >= video.duration - 0.04) {
          if (!video.paused && !video.loop) {
            video.pause();
            setIsPlaying(false);
            setHasEnded(true);
          }
        }
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('loadeddata', startPlayback);
      video.removeEventListener('canplay', startPlayback);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    setUserToggled(true);

    // If it reached the end, clicking allows replay from the beginning for another single run
    if (hasEnded || video.ended || (video.duration && video.currentTime >= video.duration - 0.08)) {
      video.currentTime = 0;
      setHasEnded(false);
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030712]">
      {/* Background Video Element - single play, freezes at final frame */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover opacity-75 filter brightness-85 contrast-110 saturate-120 scale-105 transition-opacity duration-700"
      >
        <source src="/intro.mp4" type="video/mp4" />
        <source src="/intro/intro.mp4" type="video/mp4" />
        <source src="/intod/intro.mp4" type="video/mp4" />
      </video>

      {/* Dark Effect Overlay, Cyber Vignette, and Ambient Liquid Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/50 via-transparent to-[#030712]/85 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-[#030712]/30 to-[#030712]/80 pointer-events-none" />

      {/* Electric Blue & Neon Rose Ambient Glow Sprites */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-blue-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-rose-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Discreet Interactive Video Status / Controller in bottom-left */}
      <div className="fixed bottom-4 left-4 z-40 pointer-events-auto">
        <button
          onClick={togglePlayback}
          className="liquid-glass px-3 py-1.5 rounded-full border border-white/15 flex items-center gap-2 text-[11px] font-bold text-slate-300 hover:text-white hover:border-rose-400/50 shadow-xl transition-all cursor-pointer backdrop-blur-xl group"
          title={hasEnded ? "Replay Background Video" : "Toggle Background Video Playback"}
        >
          <span className="relative flex h-2 w-2">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPlaying ? 'bg-rose-500' : hasEnded ? 'bg-amber-400' : 'bg-slate-500'
              }`}
            />
          </span>
          <span className="tracking-wide">
            {isPlaying ? 'Playing Intro' : hasEnded ? 'Replay Intro' : 'Play Background'}
          </span>
          {isPlaying ? (
            <Pause className="w-3 h-3 text-slate-400 group-hover:text-rose-400 transition" />
          ) : hasEnded ? (
            <RotateCcw className="w-3 h-3 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
          ) : (
            <Play className="w-3 h-3 text-slate-400 group-hover:text-rose-400 transition" />
          )}
        </button>
      </div>
    </div>
  );
}
