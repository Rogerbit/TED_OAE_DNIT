"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "ted-oae-dnit:registrado-por";
const CHANGE_EVENT = "ted-oae-dnit:registrado-por-changed";

export interface Responsavel {
  id: string;
  nome: string;
}

const CurrentUserContext = createContext<{
  responsavelId: string;
  setResponsavelId: (id: string) => void;
  responsaveis: Responsavel[];
}>({ responsavelId: "", setResponsavelId: () => {}, responsaveis: [] });

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerSnapshot() {
  return "";
}

export function CurrentUserProvider({
  responsaveis,
  children,
}: {
  responsaveis: Responsavel[];
  children: React.ReactNode;
}) {
  // Reads localStorage as an external store -- avoids the classic
  // "setState inside an effect just to read a browser API on mount"
  // pattern, and stays in sync across tabs via the storage/custom event.
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const responsavelId = responsaveis.some((r) => r.id === stored) ? stored : (responsaveis[0]?.id ?? "");

  function setResponsavelId(id: string) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Per-viewer convenience only -- safe to ignore if storage is blocked.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <CurrentUserContext.Provider value={{ responsavelId, setResponsavelId, responsaveis }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

export function CurrentUserPicker() {
  const { responsavelId, setResponsavelId, responsaveis } = useCurrentUser();
  return (
    <label className="flex items-center gap-2 text-xs text-blue-100">
      Registrado por
      <select
        value={responsavelId}
        onChange={(e) => setResponsavelId(e.target.value)}
        className="rounded-md border border-blue-300/40 bg-blue-900/40 px-2 py-1 text-xs text-white"
      >
        {responsaveis.map((r) => (
          <option key={r.id} value={r.id} className="text-slate-900">
            {r.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
