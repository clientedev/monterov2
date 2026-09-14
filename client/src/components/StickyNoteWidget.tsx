import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Minus, Maximize2, Palette, GripVertical, StickyNote } from "lucide-react";
import { useStickyNotes, StickyNote as StickyNoteType, DEFAULT_NOTE_COLORS } from "@/hooks/useStickyNotes";

// ─── Single Floating Note ────────────────────────────────────────────────────

function FloatingNote({
  note,
  onUpdate,
  onArchive,
  onBringToFront,
}: {
  note: StickyNoteType;
  onUpdate: (id: string, changes: Partial<StickyNoteType>) => void;
  onArchive: (id: string) => void;
  onBringToFront: (id: string) => void;
}) {
  const noteRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [showPalette, setShowPalette] = useState(false);
  const [localTitle, setLocalTitle] = useState(note.title);
  const [localContent, setLocalContent] = useState(note.content);

  // Sync local state if note changes from outside
  useEffect(() => { setLocalTitle(note.title); }, [note.title]);
  useEffect(() => { setLocalContent(note.content); }, [note.content]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    e.preventDefault();
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - note.x,
      y: e.clientY - note.y,
    };
    onBringToFront(note.id);
  }, [note.x, note.y, note.id, onBringToFront]);

  // ── Resize ────────────────────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    onBringToFront(note.id);
  }, [note.id, onBringToFront]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging.current && noteRef.current) {
        const newX = Math.max(0, e.clientX - dragOffset.current.x);
        const newY = Math.max(0, e.clientY - dragOffset.current.y);
        noteRef.current.style.left = `${newX}px`;
        noteRef.current.style.top = `${newY}px`;
      }
      if (resizing.current && noteRef.current) {
        const rect = noteRef.current.getBoundingClientRect();
        const newW = Math.max(200, e.clientX - rect.left);
        const newH = Math.max(120, e.clientY - rect.top);
        noteRef.current.style.width = `${newW}px`;
        noteRef.current.style.height = `${newH}px`;
      }
    };
    const handleMouseUp = () => {
      if (dragging.current && noteRef.current) {
        const left = parseFloat(noteRef.current.style.left) || note.x;
        const top = parseFloat(noteRef.current.style.top) || note.y;
        onUpdate(note.id, { x: left, y: top });
        dragging.current = false;
      }
      if (resizing.current && noteRef.current) {
        const w = parseFloat(noteRef.current.style.width) || note.width;
        const h = parseFloat(noteRef.current.style.height) || note.height;
        onUpdate(note.id, { width: w, height: h });
        resizing.current = false;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [note.id, note.x, note.y, note.width, note.height, onUpdate]);

  const headerBg = note.color === "#ffffff" ? "#f1f5f9" : `${note.color}cc`;

  return (
    <div
      ref={noteRef}
      onMouseDown={() => onBringToFront(note.id)}
      style={{
        position: "fixed",
        left: note.x,
        top: note.y,
        width: note.minimized ? 240 : note.width,
        height: note.minimized ? "auto" : note.height,
        zIndex: note.zIndex,
        background: note.color,
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1.5px solid rgba(0,0,0,0.10)",
        transition: "box-shadow 0.15s, width 0.1s",
        userSelect: "none",
        minWidth: 200,
      }}
      className="sticky-note-widget"
    >
      {/* ── Header / Drag Handle ── */}
      <div
        onMouseDown={handleDragMouseDown}
        style={{
          background: headerBg,
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          cursor: "grab",
          borderBottom: `1px solid rgba(0,0,0,0.08)`,
          flexShrink: 0,
        }}
      >
        <GripVertical size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
        <input
          data-no-drag="true"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={() => onUpdate(note.id, { title: localTitle })}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontWeight: 700,
            fontSize: 12,
            color: "#1e293b",
            cursor: "text",
            minWidth: 0,
          }}
          placeholder="Título..."
        />
        {/* Actions */}
        <div data-no-drag="true" style={{ display: "flex", gap: 2, flexShrink: 0, position: "relative" }}>
          {/* Palette */}
          <button
            onClick={() => setShowPalette((v) => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "2px 3px", borderRadius: 4, display: "flex", alignItems: "center",
              opacity: 0.6, transition: "opacity 0.15s",
            }}
            title="Mudar cor"
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
          >
            <Palette size={13} />
          </button>
          {/* Minimize */}
          <button
            onClick={() => onUpdate(note.id, { minimized: !note.minimized })}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "2px 3px", borderRadius: 4, display: "flex", alignItems: "center",
              opacity: 0.6, transition: "opacity 0.15s",
            }}
            title={note.minimized ? "Expandir" : "Minimizar"}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
          >
            {note.minimized ? <Maximize2 size={13} /> : <Minus size={13} />}
          </button>
          {/* Close / Archive */}
          <button
            onClick={() => onArchive(note.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "2px 3px", borderRadius: 4, display: "flex", alignItems: "center",
              opacity: 0.6, transition: "opacity 0.15s",
            }}
            title="Fechar (arquivar)"
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
          >
            <X size={13} />
          </button>

          {/* Color Palette Dropdown */}
          {showPalette && (
            <div
              style={{
                position: "absolute", top: "100%", right: 0, marginTop: 6,
                background: "#fff", borderRadius: 10, padding: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                display: "grid", gridTemplateColumns: "repeat(4, 28px)", gap: 4,
                zIndex: 10,
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              {DEFAULT_NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.name}
                  onClick={() => { onUpdate(note.id, { color: c.value }); setShowPalette(false); }}
                  style={{
                    width: 28, height: 28, borderRadius: 7, border: note.color === c.value ? "2.5px solid #0f6570" : "1.5px solid rgba(0,0,0,0.12)",
                    background: c.value, cursor: "pointer", transition: "transform 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {!note.minimized && (
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={() => onUpdate(note.id, { content: localContent })}
          placeholder="Escreva sua nota..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            padding: "8px 10px",
            fontSize: 13,
            color: "#1e293b",
            lineHeight: 1.55,
            fontFamily: "inherit",
          }}
        />
      )}

      {/* ── Resize Handle ── */}
      {!note.minimized && (
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: "absolute", bottom: 2, right: 2,
            width: 16, height: 16, cursor: "se-resize",
            display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
            opacity: 0.35,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M10 0L0 10H2L10 2V0ZM10 4L4 10H6L10 6V4ZM10 8L8 10H10V8Z" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Sticky Notes Widget (renders all open notes + top-bar button) ───────────

interface StickyNoteWidgetProps {
  /** Pass the hook so the layout can own the state globally */
  hook: ReturnType<typeof useStickyNotes>;
}

export function StickyNotesLayer({ hook }: StickyNoteWidgetProps) {
  const { openedNotes, updateNote, archiveNote, bringToFront } = hook;
  return createPortal(
    <>
      {openedNotes.map((note) => (
        <FloatingNote
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onArchive={archiveNote}
          onBringToFront={bringToFront}
        />
      ))}
    </>,
    document.body
  );
}

// ─── Top-bar Button ──────────────────────────────────────────────────────────

export function StickyNoteButton({ hook }: { hook: ReturnType<typeof useStickyNotes> }) {
  const { createNote, openedNotes } = hook;
  return (
    <button
      onClick={() => createNote()}
      title="Nova nota adesiva"
      style={{
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, borderRadius: 10,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        cursor: "pointer", transition: "background 0.15s, transform 0.1s",
        color: "#fef08a",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(254,240,138,0.15)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      onMouseDown={e => (e.currentTarget.style.transform = "scale(0.92)")}
      onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
    >
      <StickyNote size={18} />
      {openedNotes.length > 0 && (
        <span
          style={{
            position: "absolute", top: -4, right: -4,
            background: "#fef08a", color: "#1e293b",
            borderRadius: "50%", width: 16, height: 16,
            fontSize: 9, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1.5px solid rgba(0,0,0,0.2)",
          }}
        >
          {openedNotes.length > 9 ? "9+" : openedNotes.length}
        </span>
      )}
    </button>
  );
}
