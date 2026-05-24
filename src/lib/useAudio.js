import { useRef, useCallback } from "react";

const SOUND_FILES = {
  rain:   "/sounds/rain.mp3",
  cafe:   "/sounds/cafe.mp3",
  white:  "/sounds/white.mp3",
  lofi:   "/sounds/lofi.mp3",
  forest: "/sounds/forest.mp3",
  ocean:  "/sounds/ocean.mp3",
};

export function useAudio() {
  const nodes = useRef({});   // { [id]: HTMLAudioElement }
  const masterVol = useRef(1);

  const stopSound = useCallback((id) => {
    const el = nodes.current[id];
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    delete nodes.current[id];
  }, []);

  const startSound = useCallback((id, vol) => {
    stopSound(id);
    if (vol <= 0) return;

    const el = new Audio(SOUND_FILES[id]);
    el.loop = true;
    el.volume = Math.min(1, Math.max(0, vol / 100));
    el.play().catch(() => {});
    nodes.current[id] = el;
  }, [stopSound]);

  // Called when master slider changes — rescales all playing sounds
  const setMasterVolume = useCallback((master) => {
    masterVol.current = master / 100;
    Object.values(nodes.current).forEach(el => {
      el.volume = Math.min(1, Math.max(0, masterVol.current));
    });
  }, []);

  const playBell = useCallback((freq = 528) => {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g);
      g.connect(ac.destination);
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(0.4, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2);
      o.start();
      o.stop(ac.currentTime + 2);
    } catch (e) {}
  }, []);

  return { startSound, stopSound, setMasterVolume, playBell };
}