/**
 * DumpEverythingFAB — Keyboard shortcut redirect to KAAL Agent
 * The Brain Dump feature now lives inside the KAAL Agent screen (Brain Dump tab).
 * This component keeps the ⌘⇧B shortcut alive but routes to /agent instead.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router";

export function DumpEverythingFAB() {
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd/Ctrl + Shift + B → open KAAL Agent (Brain Dump tab)
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "b") {
        e.preventDefault();
        navigate("/agent");
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [navigate]);

  // No visible UI — the GlobalOrb and Navbar handle visual access
  return null;
}
