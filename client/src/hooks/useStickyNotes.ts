import { useState, useEffect, useCallback } from "react";

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  zIndex: number;
}

const STORAGE_KEY = "crm_sticky_notes";

export const DEFAULT_NOTE_COLORS = [
  { name: "Amarelo", value: "#fef08a" },
  { name: "Rosa", value: "#fbcfe8" },
  { name: "Verde", value: "#bbf7d0" },
  { name: "Azul", value: "#bfdbfe" },
  { name: "Lavanda", value: "#ddd6fe" },
  { name: "Pêssego", value: "#fed7aa" },
  { name: "Cinza", value: "#e2e8f0" },
  { name: "Branco", value: "#ffffff" },
];

function loadNotes(): StickyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: StickyNote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

let topZIndex = 1000;

export function useStickyNotes() {
  const [notes, setNotes] = useState<StickyNote[]>(loadNotes);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const createNote = useCallback(() => {
    const id = `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    topZIndex += 1;
    const newNote: StickyNote = {
      id,
      title: "Nova Nota",
      content: "",
      color: DEFAULT_NOTE_COLORS[0].value,
      x: 100 + Math.floor(Math.random() * 180),
      y: 100 + Math.floor(Math.random() * 140),
      width: 280,
      height: 220,
      minimized: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
      zIndex: topZIndex,
    };
    setNotes((prev) => [...prev, newNote]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, changes: Partial<StickyNote>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...changes, updatedAt: new Date().toISOString() } : n
      )
    );
  }, []);

  const bringToFront = useCallback((id: string) => {
    topZIndex += 1;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, zIndex: topZIndex } : n))
    );
  }, []);

  const archiveNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, archived: true, minimized: false, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }, []);

  const restoreNote = useCallback((id: string) => {
    topZIndex += 1;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              archived: false,
              minimized: false,
              x: 100 + Math.floor(Math.random() * 200),
              y: 100 + Math.floor(Math.random() * 180),
              zIndex: topZIndex,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const openedNotes = notes.filter((n) => !n.archived);
  const archivedNotes = notes.filter((n) => n.archived);

  return {
    notes,
    openedNotes,
    archivedNotes,
    createNote,
    updateNote,
    bringToFront,
    archiveNote,
    restoreNote,
    deleteNote,
  };
}
