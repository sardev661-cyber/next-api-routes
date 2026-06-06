"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Author {
  id: string;
  name: string;
  email: string;
  nationality: string;
  birthYear: number | null;
  bio: string | null;
  _count?: { books: number };
}

interface Stats {
  totalAuthors: number;
  totalBooks: number;
  genres: string[];
}

export default function DashboardPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    nationality: "",
    birthYear: "",
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/authors");
      const data = await res.json();
      setAuthors(data);

      const booksRes = await fetch("/api/books");
      const books = await booksRes.json();
      const genres = [...new Set<string>(books.map((b: any) => b.genre).filter(Boolean))];
      setStats({ totalAuthors: data.length, totalBooks: books.length, genres });
    } catch {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({ name: "", email: "", nationality: "", birthYear: "", bio: "" });
    setShowCreateForm(false);
    setEditingAuthor(null);
    setError("");
  };

  const openEdit = (author: Author) => {
    setEditingAuthor(author);
    setForm({
      name: author.name,
      email: author.email,
      nationality: author.nationality || "",
      birthYear: author.birthYear?.toString() || "",
      bio: author.bio || "",
    });
    setShowCreateForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError("Nombre y email son requeridos");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const body = {
        name: form.name,
        email: form.email,
        nationality: form.nationality,
        birthYear: form.birthYear ? parseInt(form.birthYear) : undefined,
        bio: form.bio,
      };

      if (editingAuthor) {
        await fetch(`/api/authors/${editingAuthor.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/authors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      resetForm();
      fetchData();
    } catch {
      setError("Error al guardar el autor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a "${name}"? Esta acción también eliminará sus libros.`)) return;
    try {
      await fetch(`/api/authors/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      setError("Error al eliminar el autor");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📚 Sistema de Biblioteca</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestión de autores y libros</p>
          </div>
          <Link
            href="/books"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Ver Libros →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total de Autores</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAuthors}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total de Libros</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalBooks}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Géneros disponibles</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.genres.length}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{stats.genres.join(", ")}</p>
            </div>
          </div>
        )}

        {/* Authors section */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Autores</h2>
            <button
              onClick={() => { resetForm(); setShowCreateForm(true); }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              + Nuevo Autor
            </button>
          </div>

          {/* Create / Edit form */}
          {showCreateForm && (
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {editingAuthor ? "Editar Autor" : "Crear Nuevo Autor"}
              </h3>
              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Nombre *", key: "name", placeholder: "Gabriel García Márquez" },
                  { label: "Email *", key: "email", placeholder: "autor@example.com" },
                  { label: "Nacionalidad", key: "nationality", placeholder: "Colombia" },
                  { label: "Año de nacimiento", key: "birthYear", placeholder: "1927" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      type={key === "birthYear" ? "number" : "text"}
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Biografía</label>
                  <textarea
                    placeholder="Breve descripción del autor..."
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Guardando..." : editingAuthor ? "Actualizar" : "Crear Autor"}
                </button>
                <button
                  onClick={resetForm}
                  className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Authors list */}
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-400">Cargando autores...</div>
          ) : authors.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              No hay autores registrados. ¡Crea el primero!
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {authors.map((author) => (
                <li key={author.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{author.name}</p>
                    <p className="text-sm text-gray-500 truncate">{author.email}</p>
                    {author.nationality && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {author.nationality}
                        {author.birthYear ? ` · Nació en ${author.birthYear}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/authors/${author.id}`}
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                    >
                      Ver libros
                    </Link>
                    <button
                      onClick={() => openEdit(author)}
                      className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-100 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(author.id, author.name)}
                      className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}