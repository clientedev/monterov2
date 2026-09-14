import { useState, useContext } from "react";
import { Search, Trash2, Archive, ArchiveRestore, StickyNote, Plus, Clock, RefreshCw } from "lucide-react";
import { useStickyNotes, StickyNote as StickyNoteType } from "@/hooks/useStickyNotes";
import { Button } from "@/components/ui/button";
import { StickyNotesContext } from "@/pages/admin-crm/layout";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function NoteCard({
  note,
  onRestore,
  onDelete,
  onArchive,
  isActive,
}: {
  note: StickyNoteType;
  onRestore?: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  isActive: boolean;
}) {
  const darken = (hex: string, amt = 30) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - amt);
    const g = Math.max(0, ((num >> 8) & 0xff) - amt);
    const b = Math.max(0, (num & 0xff) - amt);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  return (
    <div
      style={{
        background: note.color,
        borderRadius: 14,
        padding: "14px 16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        border: `1.5px solid ${darken(note.color, 15)}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <span
          style={{
            position: "absolute", top: 10, right: 10,
            background: "#10b981", color: "#fff", borderRadius: 20,
            fontSize: 9, fontWeight: 800, padding: "2px 7px", letterSpacing: "0.05em",
          }}
        >
          ABERTA
        </span>
      )}

      <div style={{ fontWeight: 800, fontSize: 14, color: "#1e293b", paddingRight: isActive ? 56 : 0 }}>
        {note.title || "Sem título"}
      </div>

      <div style={{
        fontSize: 12, color: "#475569", lineHeight: 1.55,
        overflow: "hidden", maxHeight: 80,
        display: "-webkit-box",
        WebkitLineClamp: 4,
        WebkitBoxOrient: "vertical",
      } as React.CSSProperties}>
        {note.content || <span style={{ fontStyle: "italic", opacity: 0.5 }}>Nota vazia</span>}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 10, color: "#64748b", marginTop: 4,
      }}>
        <Clock size={10} />
        {formatDate(note.updatedAt)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        {onRestore && (
          <button
            onClick={() => onRestore(note.id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
              padding: "5px 8px", fontSize: 11, fontWeight: 700, color: "#1e293b",
              cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.14)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
          >
            <ArchiveRestore size={12} />
            {isActive ? "Focar" : "Reabrir"}
          </button>
        )}
        {onArchive && !note.archived && (
          <button
            onClick={() => onArchive(note.id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 8,
              padding: "5px 8px", fontSize: 11, fontWeight: 700, color: "#64748b",
              cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
          >
            <Archive size={12} />
            Arquivar
          </button>
        )}
        <button
          onClick={() => {
            if (confirm("Apagar esta nota permanentemente?")) onDelete(note.id);
          }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(239,68,68,0.12)", border: "none", borderRadius: 8,
            padding: "5px 8px", fontSize: 11, fontWeight: 700, color: "#dc2626",
            cursor: "pointer", transition: "background 0.15s",
            width: 32,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.22)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
          title="Apagar permanentemente"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function NotasPage() {
  const stickyCtx = useContext(StickyNotesContext);
  const [search, setSearch] = useState("");

  if (!stickyCtx) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "#64748b" }}>
        <StickyNote size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
        <p>Sistema de notas não disponível neste contexto.</p>
      </div>
    );
  }

  const { openedNotes, archivedNotes, createNote, restoreNote, archiveNote, deleteNote, bringToFront } = stickyCtx;

  const filterNote = (n: StickyNoteType) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  };

  const filteredActive = openedNotes.filter(filterNote);
  const filteredArchived = archivedNotes.filter(filterNote);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              background: "linear-gradient(135deg, #fef08a 0%, #fbbf24 100%)",
              borderRadius: 12, padding: 10, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(251,191,36,0.25)",
            }}>
              <StickyNote size={22} color="#1e293b" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1e293b", margin: 0 }}>Notas Adesivas</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                {openedNotes.length} ativas · {archivedNotes.length} arquivadas
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => createNote()}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #fef08a 0%, #fbbf24 100%)",
            border: "none", borderRadius: 12, padding: "10px 18px",
            fontSize: 13, fontWeight: 800, color: "#1e293b",
            cursor: "pointer", boxShadow: "0 4px 12px rgba(251,191,36,0.25)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(251,191,36,0.35)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(251,191,36,0.25)";
          }}
        >
          <Plus size={16} />
          Nova Nota
        </button>
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título ou conteúdo..."
          style={{
            width: "100%", paddingLeft: 42, paddingRight: 14, height: 42,
            borderRadius: 12, border: "1.5px solid #e2e8f0",
            background: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "#0f6570")}
          onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
        />
      </div>

      {/* ── Active Notes ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 4, height: 20, background: "#10b981", borderRadius: 3 }} />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: 0 }}>
            Notas Abertas
          </h2>
          <span style={{
            background: "#d1fae5", color: "#065f46", borderRadius: 20,
            fontSize: 11, fontWeight: 800, padding: "2px 8px",
          }}>
            {filteredActive.length}
          </span>
        </div>

        {filteredActive.length === 0 ? (
          <div style={{
            background: "#f8fafc", borderRadius: 14, border: "1.5px dashed #e2e8f0",
            padding: "32px 24px", textAlign: "center", color: "#94a3b8",
          }}>
            <StickyNote size={32} style={{ opacity: 0.2, margin: "0 auto 10px", display: "block" }} />
            <p style={{ fontSize: 13, margin: 0 }}>
              {search ? "Nenhuma nota aberta encontrada" : "Nenhuma nota aberta no momento"}
            </p>
            {!search && (
              <button
                onClick={() => createNote()}
                style={{
                  marginTop: 12, background: "#fef08a", border: "none", borderRadius: 8,
                  padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  color: "#1e293b",
                }}
              >
                + Criar primeira nota
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filteredActive.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={true}
                onRestore={(id) => bringToFront(id)}
                onArchive={archiveNote}
                onDelete={deleteNote}
              />
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)" }} />

      {/* ── Archived Notes ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 4, height: 20, background: "#94a3b8", borderRadius: 3 }} />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: 0 }}>
            Arquivo
          </h2>
          <span style={{
            background: "#f1f5f9", color: "#64748b", borderRadius: 20,
            fontSize: 11, fontWeight: 800, padding: "2px 8px",
          }}>
            {filteredArchived.length}
          </span>
        </div>

        {filteredArchived.length === 0 ? (
          <div style={{
            background: "#f8fafc", borderRadius: 14, border: "1.5px dashed #e2e8f0",
            padding: "32px 24px", textAlign: "center", color: "#94a3b8",
          }}>
            <Archive size={32} style={{ opacity: 0.2, margin: "0 auto 10px", display: "block" }} />
            <p style={{ fontSize: 13, margin: 0 }}>
              {search ? "Nenhuma nota arquivada encontrada" : "Nenhuma nota arquivada ainda"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filteredArchived.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={false}
                onRestore={restoreNote}
                onDelete={deleteNote}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
