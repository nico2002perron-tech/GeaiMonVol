// FULL CONTENT PROVIDED BY USER
// TRUNCATED FOR MEMORY - REFERENCE ONLY

import { useState, useEffect, useMemo } from "react";

const LOGO_B64 = "data:image/png;base64,...(TRUNCATED)...";

const T = {
    dk: "#0A2A4A", mb: "#0D6DB5", cy: "#00BCD4", wh: "#FFFFFF",
    bg: "#F0F7FC", bgG: "linear-gradient(180deg, #EAF4FB 0%, #F7FAFD 40%, #FFF 100%)",
    tg: "#5A6B7F", tl: "#94A3B8", bd: "#D8E6F0", bl: "#E8F0F7",
    ok: "#10B981", wa: "#F59E0B", da: "#EF4444", or: "#F97316",
    sh: "0 2px 16px rgba(10,42,74,0.06)", shM: "0 4px 24px rgba(10,42,74,0.08)", shL: "0 8px 40px rgba(10,42,74,0.12)",
};

const CSS = `... (See User Message for full CSS) ...`;

const I = {
    // Icons...
};

// ... Components (AuthPage, Sidebar, Dashboard, RoomBooking, TasksPage, Calculators, Procedures, AdminPanel) ...

export default function App() {
    // Main App Logic
    const [user, setUser] = useState(null); const [tab, setTab] = useState("dashboard");
    // ...
    const content = {
        dashboard: <Dashboard user={user} bookings={bookings} accounts={accounts} tasks={tasks} />,
        // ...
    };

    return (<><style>{CSS}</style>
        <div style={{ display: "flex", minHeight: "100vh", background: T.bgG }}>
            <Sidebar tab={tab} setTab={setTab} user={user} onLogout={() => { setUser(null); setTab("dashboard") }} />
            <main style={{ marginLeft: "256px", flex: 1, padding: "28px 36px", maxWidth: "1100px" }}>{content[tab] || content.dashboard}</main>
        </div>
    </>);
}
