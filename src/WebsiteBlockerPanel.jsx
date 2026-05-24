// Example: WebsiteBlockerPanel.jsx

import { useState, useEffect } from 'react';
import { extensionAPI, pollExtensionState } from './extensionBridge';

export default function WebsiteBlockerPanel() {
  const [state, setState] = useState(null);
  const [blocklist, setBlocklist] = useState([]);
  const [newSite, setNewSite] = useState('');
  const [showList, setShowList] = useState(false);

  // Poll extension state every second
  useEffect(() => {
    const cleanup = pollExtensionState(setState);
    return cleanup;
  }, []);

  // Load blocklist
  useEffect(() => {
    extensionAPI.getBlocklist().then(setBlocklist).catch(console.error);
  }, []);

  // Event handlers
  const handleResume = async () => {
    await extensionAPI.resumeSession();
  };

  const handleStop = async () => {
    await extensionAPI.stopSession();
  };

  const handleAddSite = async () => {
    if (!newSite.trim()) return;
    
    const domain = newSite.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    if (!blocklist.includes(domain)) {
      const updated = [...blocklist, domain];
      await extensionAPI.updateBlocklist(updated);
      setBlocklist(updated);
      setNewSite('');
    }
  };

  const handleRemoveSite = async (domain) => {
    const updated = blocklist.filter(d => d !== domain);
    await extensionAPI.updateBlocklist(updated);
    setBlocklist(updated);
  };

  if (!state) {
    return <div>Loading...</div>;
  }

  return (
    <div className="website-blocker-panel">
      {state.active ? (
        <div>
          <h3>Session {state.paused ? 'Paused' : 'Active'}</h3>
          <div className="timer">
            {formatTime(Math.ceil(state.remainingMs / 1000))}
          </div>
          
          <div className="controls">
            {state.paused ? (
              <button onClick={handleResume}>Resume</button>
            ) : (
              <button onClick={async () => await extensionAPI.pauseSession()}>
                Pause
              </button>
            )}
            <button onClick={handleStop}>Stop</button>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => extensionAPI.startSession(25, 'Focus')}>
            Start 25min Session
          </button>
        </div>
      )}

      <div className="blocklist-section">
        <h4>
          Blocked sites ({blocklist.length})
          <button onClick={() => setShowList(!showList)}>
            {showList ? 'hide' : 'show'}
          </button>
        </h4>

        {showList && (
          <>
            <ul>
              {blocklist.map(domain => (
                <li key={domain}>
                  {domain}
                  <button onClick={() => handleRemoveSite(domain)}>×</button>
                </li>
              ))}
            </ul>

            <div className="add-site">
              <input
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                placeholder="example.com"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
              />
              <button onClick={handleAddSite}>Add</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}