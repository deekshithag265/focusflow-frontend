import useAppStore, { ALARMS } from "../store/useAppStore";
import { useTheme } from "../lib/useTheme";
import { useAudio } from "../lib/useAudio";

const SOUNDS = [
  { id: "rain",   label: "Rain",   icon: "ti-cloud-rain" },
  { id: "cafe",   label: "Café",   icon: "ti-coffee" },
  { id: "white",  label: "White",  icon: "ti-wind" },
  { id: "lofi",   label: "Lo-fi",  icon: "ti-music" },
  { id: "forest", label: "Forest", icon: "ti-trees" },
  { id: "ocean",  label: "Ocean",  icon: "ti-waves" },
];

export default function AudioPage() {
  const store = useAppStore();
  const { theme, accent, soundMix, masterVol, alarmId, notifEnabled } = store;
  const { c, card, label, btn, ac: accentColor } = useTheme(theme, accent);
  const audio = useAudio();

  const setSoundVolume = (id, val) => {
    const newMix = { ...soundMix, [id]: val };
    store.setSoundMix(newMix);
    if (val > 0) audio.startSound(id, val * masterVol / 100);
    else audio.stopSound(id);
  };

  const handleMasterVol = (val) => {
  store.setMasterVol(val);
  audio.setMasterVolume(val);
};

  const requestNotif = () => {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then(p => store.setNotifEnabled(p === "granted"));
  };

  const activeSounds = Object.values(soundMix).filter(v => v > 0).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1, minHeight: 0, alignItems: "stretch" }}>

      {/* Left — Volume mixing */}
      <div style={{ ...card, display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexShrink: 0 }}>
          <div>
            <div style={{ ...label, marginBottom: 3 }}>Volume mixing</div>
            <div style={{ fontSize: 12, color: c.text3 }}>Mix multiple soundscapes at once</div>
          </div>
          {activeSounds > 0 && (
            <div style={{
              fontSize: 11, fontFamily: "monospace",
              background: accentColor + "22",
              color: accentColor,
              border: `0.5px solid ${accentColor}55`,
              borderRadius: 20, padding: "3px 10px",
              flexShrink: 0,
            }}>
              {activeSounds} active
            </div>
          )}
        </div>

        {/* Sound rows */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 0 }}>
          {SOUNDS.map(s => {
            const vol = soundMix[s.id] || 0;
            const active = vol > 0;
            return (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                background: active ? accentColor + "0f" : "transparent",
                border: `0.5px solid ${active ? accentColor + "33" : "transparent"}`,
                transition: "all 0.15s",
              }}>
                <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: active ? accentColor : c.text3, width: 18, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: active ? c.text1 : c.text2, width: 50, flexShrink: 0, fontWeight: active ? 500 : 400 }}>
                  {s.label}
                </span>
                <div style={{ flex: 1 }}>
                  <input
                    type="range" min={0} max={100} step={5} value={vol}
                    onChange={e => setSoundVolume(s.id, +e.target.value)}
                    style={{ width: "100%", accentColor: active ? accentColor : c.text3 }}
                  />
                </div>
                <span style={{ fontSize: 11, color: active ? accentColor : c.text3, fontFamily: "monospace", minWidth: 30, textAlign: "right", opacity: active ? 1 : 0.5 }}>
                  {vol}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Master volume */}
        <div style={{ borderTop: `0.5px solid ${c.border}`, paddingTop: 12, marginTop: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-volume" style={{ fontSize: 15, color: c.text2, width: 18, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: c.text2, width: 50, flexShrink: 0, fontWeight: 500 }}>Master</span>
            <input
              type="range" min={0} max={100} step={5} value={masterVol}
              onChange={e => handleMasterVol(+e.target.value)}
              style={{ flex: 1, accentColor }}
            />
            <span style={{ fontSize: 11, color: accentColor, fontFamily: "monospace", minWidth: 30, textAlign: "right" }}>
              {masterVol}%
            </span>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", boxSizing: "border-box" }}>

        {/* Alarm sound */}
        <div style={{ ...card, flexShrink: 0 }}>
          <div style={{ ...label, marginBottom: 4 }}>Alarm sound</div>
          <div style={{ fontSize: 12, color: c.text3, marginBottom: 14 }}>Plays at the end of each session</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ALARMS.map(a => {
              const selected = alarmId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => { store.setAlarmId(a.id); audio.playBell(a.freq); }}
                  style={{
                    ...btn,
                    padding: "10px 12px",
                    background: selected ? accentColor + "18" : "transparent",
                    borderColor: selected ? accentColor : c.border,
                    color: selected ? accentColor : c.text2,
                    display: "flex", alignItems: "center", gap: 7, justifyContent: "center",
                    fontSize: 13,
                    fontWeight: selected ? 500 : 400,
                    transition: "all 0.15s",
                  }}>
                  <i className={selected ? "ti ti-bell-ringing" : "ti ti-bell"} style={{ fontSize: 14 }} />
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ ...card, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ ...label, marginBottom: 4, flexShrink: 0 }}>Notifications</div>
          <div style={{ fontSize: 12, color: c.text3, marginBottom: 16, flexShrink: 0 }}>Get reminded when sessions end</div>

          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px",
            borderRadius: 8,
            background: notifEnabled ? accentColor + "0f" : c.bg2 || c.bg + "80",
            border: `0.5px solid ${notifEnabled ? accentColor + "33" : c.border}`,
            marginBottom: 14,
            transition: "all 0.2s",
            flexShrink: 0,
          }}>
            <i
              className={notifEnabled ? "ti ti-bell-ringing" : "ti ti-bell-off"}
              style={{ fontSize: 16, color: notifEnabled ? accentColor : c.text3, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: notifEnabled ? c.text1 : c.text2, flex: 1 }}>
              Desktop push notifications
            </span>
            <button
              onClick={notifEnabled ? () => store.setNotifEnabled(false) : requestNotif}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: notifEnabled ? accentColor : c.border,
                border: "none", cursor: "pointer", position: "relative",
                transition: "all 0.2s", flexShrink: 0,
              }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3,
                left: notifEnabled ? 21 : 3,
                transition: "left 0.2s",
              }} />
            </button>
          </div>

          <div style={{ fontSize: 12, color: c.text3, lineHeight: 1.7, flexShrink: 0 }}>
            Notifications will remind you to take breaks and celebrate completed sessions.
          </div>
        </div>

      </div>
    </div>
  );
}