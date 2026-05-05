import { getUserDisplay } from "@/lib/utils";

export function ProfileCard({ user, onlineData, onClose }) {
    if (!user) return null;

    const status = onlineData?.status || "NO STATUS SET";
    const isOnline = !!onlineData;

    return (
        <div className="profile-overlay" onClick={onClose}>
            <div className="profile-card" onClick={e => e.stopPropagation()}>
                <pre className="ascii-art">
{`
  +--------------------------+
  |  USER_ID: ${user.uid.substring(0,8)}... |
  |  NICKNAME: ${user.nickname.padEnd(12)} |
  |  STATUS: ${isOnline ? "ONLINE  " : "OFFLINE "} |
  +--------------------------+
`}
                </pre>
                <div className="profile-details">
                    <p><span className="label">BIO:</span> {status}</p>
                    <p><span className="label">LAST_SEEN:</span> {isOnline ? "NOW" : "UNKNOWN"}</p>
                </div>
                <div className="profile-actions">
                    <button className="theme-btn active" onClick={onClose}>CLOSE</button>
                </div>
            </div>
        </div>
    );
}
