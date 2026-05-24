/**
 * focus-blocker-bridge.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop this into your existing timer app. It communicates with the Focus
 * Blocker Chrome extension so that starting/stopping a timer in your app
 * automatically enables or disables website blocking in the browser.
 *
 * USAGE:
 *   import { FocusBlockerBridge } from './focus-blocker-bridge.js';
 *
 *   const blocker = new FocusBlockerBridge();
 *
 *   // When your timer starts:
 *   blocker.startSession(25, "Deep Work");
 *
 *   // When your timer pauses:
 *   blocker.pauseSession();
 *
 *   // When your timer resumes:
 *   blocker.resumeSession();
 *
 *   // When your timer stops or finishes:
 *   blocker.stopSession();
 *
 *   // Check if extension is installed:
 *   blocker.isAvailable().then(available => { ... });
 *
 *   // Listen for extension events (e.g. timer stopped via popup):
 *   blocker.on('SESSION_STOPPED', () => { ... });
 *   blocker.on('SESSION_ENDED',   () => { ... });  // timer ran out
 *   blocker.on('SESSION_PAUSED',  () => { ... });
 *   blocker.on('SESSION_RESUMED', () => { ... });
 * ─────────────────────────────────────────────────────────────────────────────
 */

// The extension injects this ID into the page when installed.
// Must match the extension's ID in your manifest (or use runtime messaging).
const EXTENSION_ID = "dojlplmnoidnhgodbalbpmbocncaliak"; // ← replace after loading unpacked

export class FocusBlockerBridge {
  constructor() {
    this._listeners = {};
    this._listenForExtensionEvents();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start a blocking session.
   * @param {number} durationMinutes
   * @param {string} [label]
   */
  async startSession(durationMinutes, label = "Focus") {
    return this._send({ type: "START_SESSION", duration: durationMinutes, label });
  }

  /** Stop the current session and unblock all sites. */
  async stopSession() {
    return this._send({ type: "STOP_SESSION" });
  }

  /** Pause blocking (sites become accessible temporarily). */
  async pauseSession() {
    return this._send({ type: "PAUSE_SESSION" });
  }

  /** Resume a paused session. */
  async resumeSession() {
    return this._send({ type: "RESUME_SESSION" });
  }

  /** Get current session state from the extension. */
  async getState() {
    return this._send({ type: "GET_STATE" });
  }

  /** Get current blocklist. */
  async getBlocklist() {
    const res = await this._send({ type: "GET_BLOCKLIST" });
    return res?.blockList ?? [];
  }

  /**
   * Override the blocklist.
   * @param {string[]} domains  e.g. ["youtube.com", "reddit.com"]
   */
  async setBlocklist(domains) {
    return this._send({ type: "UPDATE_BLOCKLIST", list: domains });
  }

  /**
   * Returns true if the extension is installed and reachable.
   */
  async isAvailable() {
    try {
      const res = await this._send({ type: "GET_STATE" });
      return !!res;
    } catch {
      return false;
    }
  }

  /**
   * Register a callback for an extension event.
   * Events: SESSION_STARTED, SESSION_STOPPED, SESSION_ENDED,
   *         SESSION_PAUSED, SESSION_RESUMED
   */
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  off(event, callback) {
    this._listeners[event] = (this._listeners[event] || []).filter(cb => cb !== callback);
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  _send(payload) {
    return new Promise((resolve, reject) => {
      if (!chrome?.runtime?.sendMessage) {
        // Extension API not available (not in Chrome, or extension not installed)
        resolve(null);
        return;
      }
      try {
        chrome.runtime.sendMessage(EXTENSION_ID, payload, (response) => {
          if (chrome.runtime.lastError) {
            // Extension not installed or not reachable — fail silently
            resolve(null);
          } else {
            resolve(response);
          }
        });
      } catch (e) {
        resolve(null);
      }
    });
  }

  _listenForExtensionEvents() {
    if (!window.chrome?.runtime?.onMessage) return;
    chrome.runtime.onMessage.addListener((msg) => {
      const callbacks = this._listeners[msg.type] || [];
      callbacks.forEach(cb => cb(msg));
    });
  }
}

/**
 * REACT HOOK — optional helper for React-based apps
 *
 * import { useFocusBlocker } from './focus-blocker-bridge.js';
 *
 * function Timer() {
 *   const { available, startSession, stopSession, state } = useFocusBlocker();
 *   ...
 * }
 */
export function useFocusBlocker() {
  // Lazy import React hooks to keep this file framework-agnostic
  const { useState, useEffect, useRef } = window.React || {};
  if (!useState) {
    console.warn("useFocusBlocker: React not found. Import from focus-blocker-bridge.js inside a React app.");
    return {};
  }

  const bridge = useRef(new FocusBlockerBridge());
  const [available, setAvailable] = useState(false);
  const [state, setState] = useState(null);

  useEffect(() => {
    bridge.current.isAvailable().then(setAvailable);

    const tick = setInterval(async () => {
      const s = await bridge.current.getState();
      setState(s);
    }, 1000);

    const onStop = () => setState(prev => ({ ...prev, active: false }));
    bridge.current.on("SESSION_STOPPED", onStop);
    bridge.current.on("SESSION_ENDED", onStop);

    return () => {
      clearInterval(tick);
      bridge.current.off("SESSION_STOPPED", onStop);
      bridge.current.off("SESSION_ENDED", onStop);
    };
  }, []);

  return {
    available,
    state,
    startSession: (min, label) => bridge.current.startSession(min, label),
    stopSession: () => bridge.current.stopSession(),
    pauseSession: () => bridge.current.pauseSession(),
    resumeSession: () => bridge.current.resumeSession(),
    setBlocklist: (list) => bridge.current.setBlocklist(list),
  };
}