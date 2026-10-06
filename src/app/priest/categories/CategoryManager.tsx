"use client";

import { useState, useTransition } from "react";
import { createCategory, updateCategory, deleteCategory } from "./actions";

type Category = { id: string; name: string; count: number };

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createCategory(name);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.category) {
        setCategories((prev) =>
          [...prev, { ...result.category!, count: 0 }].sort((a, b) => a.name.localeCompare(b.name))
        );
        setNewName("");
      }
    });
  }

  function startEditing(category: Category) {
    setError(null);
    setEditingId(category.id);
    setEditingName(category.name);
  }

  function handleRename(id: string) {
    setError(null);
    const name = editingName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await updateCategory(id, name);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.category) {
        setCategories((prev) =>
          prev
            .map((c) => (c.id === id ? { ...c, name: result.category!.name } : c))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setEditingId(null);
      }
    });
  }

  function handleDelete(category: Category) {
    const confirmed = window.confirm(
      category.count > 0
        ? `Delete "${category.name}"? This removes the tag from ${category.count} question${category.count === 1 ? "" : "s"} — the questions themselves are not affected.`
        : `Delete "${category.name}"?`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
          placeholder="New category name…"
          className="flex-1 rounded-md border border-border bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending || !newName.trim()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {categories.length === 0 ? (
        <p className="text-sm opacity-70">No categories yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm"
            >
              {editingId === c.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleRename(c.id);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-md border border-border bg-transparent p-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              ) : (
                <span className="text-sm">
                  {c.name}{" "}
                  <span className="text-xs opacity-60">
                    ({c.count} question{c.count === 1 ? "" : "s"})
                  </span>
                </span>
              )}

              <div className="flex shrink-0 gap-2 text-xs">
                {editingId === c.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRename(c.id)}
                      disabled={isPending || !editingName.trim()}
                      className="rounded-md border border-border px-2 py-1 hover:bg-accent/10 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-border px-2 py-1 hover:bg-accent/10"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEditing(c)}
                      className="rounded-md border border-border px-2 py-1 hover:bg-accent/10"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      disabled={isPending}
                      className="rounded-md border border-border px-2 py-1 text-red-600 hover:bg-red-600/10 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
