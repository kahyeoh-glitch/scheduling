import { useState } from "react";
import "./index.css";
import { DriversPage } from "./components/DriversPage";
import { ZonesPage } from "./components/ZonesPage";
import { RunPage } from "./components/RunPage";

type Tab = "run" | "drivers" | "zones";

export default function App() {
  const [tab, setTab] = useState<Tab>("run");

  return (
    <div className="app">
      <header className="app-header">
        <h1>Driver Scheduler</h1>
      </header>

      <nav className="tabs">
        <button className={tab === "run" ? "active" : ""} onClick={() => setTab("run")}>
          Run
        </button>
        <button className={tab === "drivers" ? "active" : ""} onClick={() => setTab("drivers")}>
          Drivers
        </button>
        <button className={tab === "zones" ? "active" : ""} onClick={() => setTab("zones")}>
          Zones
        </button>
      </nav>

      {tab === "run" && <RunPage />}
      {tab === "drivers" && <DriversPage />}
      {tab === "zones" && <ZonesPage />}
    </div>
  );
}
