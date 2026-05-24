// extensionBridge.js - Add this to your React/web app

const EXTENSION_ID ="aklicpolgbjeiiopochgaodbjpbikbhn" // Replace with actual ID

/**
 * Send a message to the Focus Blocker extension
 */
function sendToExtension(message) {
  return new Promise((resolve, reject) => {
    if (!chrome?.runtime?.sendMessage) {
      reject(new Error("Chrome extension API not available"));
      return;
    }

    chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// ─── Extension API ───────────────────────────────────────────────────────────

export const extensionAPI = {
  /**
   * Start a focus session
   * @param {number} duration - Duration in minutes
   * @param {string} label - Session label
   */
  async startSession(duration, label = "Focus Session") {
    return sendToExtension({
      type: "START_SESSION",
      duration,
      label
    });
  },

  /**
   * Stop the current session
   */
  async stopSession() {
    return sendToExtension({ type: "STOP_SESSION" });
  },

  /**
   * Pause the current session
   */
  async pauseSession() {
    return sendToExtension({ type: "PAUSE_SESSION" });
  },

  /**
   * Resume the paused session
   */
  async resumeSession() {
    return sendToExtension({ type: "RESUME_SESSION" });
  },

  /**
   * Get current session state
   */
  async getState() {
    return sendToExtension({ type: "GET_STATE" });
  },

  /**
   * Update the blocklist
   * @param {string[]} list - Array of domain strings
   */
  async updateBlocklist(list) {
    return sendToExtension({
      type: "UPDATE_BLOCKLIST",
      list
    });
  },

  /**
   * Get current blocklist
   */
  async getBlocklist() {
    const response = await sendToExtension({ type: "GET_BLOCKLIST" });
    return response.blockList;
  }
};

// ─── State Polling (optional) ────────────────────────────────────────────────

/**
 * Poll extension state at regular intervals
 * @param {function} callback - Called with state updates
 * @param {number} intervalMs - Polling interval (default 1000ms)
 * @returns {function} Cleanup function to stop polling
 */
export function pollExtensionState(callback, intervalMs = 1000) {
  let stopped = false;

  async function poll() {
    if (stopped) return;
    
    try {
      const state = await extensionAPI.getState();
      callback(state);
    } catch (err) {
      console.error("Failed to poll extension state:", err);
    }
    
    setTimeout(poll, intervalMs);
  }

  poll();

  // Return cleanup function
  return () => {
    stopped = true;
  };
}