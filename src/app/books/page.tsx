"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

interface Author {
  id: string;
  name: string;
}

interface Book {
  id: string;
  title: string;
  genre: string;
  publishedYear: number | null;
  pages: number | null;
  isbn: string | null;
  description: string | null;
  authorId: string;
  author: { id: string; name: string; nationality: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const GENRES = [
  "Novela", "Cuento", "Poesía", "Ensayo", "Biografía",
  "Historia", "Ciencia ficción", "Periodismo", "Drama", "Otro",
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Fecha de creación" },
  { value: "title", label: "Título" },
  { value: "publishedYear", label: "Año de publicación" },
];

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  // Create / Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", isbn: "", publishedYear: "",
    genre: "", pages: "", authorId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBooks = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (genre) params.set("genre", genre);
      if (authorFilter) params.set("authorName", authorFilter);
      params.set("page", page.toString());
      params.set("limit", "10");
      params.set("sortBy", sortBy);
      params.set("order", order);

      const res = await fetch(`/api/books/search?${params}`);
      const json = await res.json();
      setBooks(json.data || []);
      setPagination(json.pagination || null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search, genre, authorFilter, page, sortBy, order]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchBooks();
    }, 0);

    return () => clearTimeout(timeout);
  }, [fetchBooks]);

  useEffect(() => {
    fetch("/api/authors").then((r) => r.json()).then(setAuthors).catch(() => {});
  }, []);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "", authorId: "" });
    setEditingBook(null);
    setShowForm(false);
    setFormError("");
  };

  const openEdit = (book: Book) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      description: book.description || "",
      isbn: book.isbn || "",
      publishedYear: book.publishedYear?.toString() || "",
      genre: book.genre || "",
      pages: book.pages?.toString() || "",
      authorId: book.authorId,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.authorId) {
      setFormError("Título y autor son requeridos");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const body = {
        title: form.title,
        description: form.description,
        isbn: form.isbn,
        publishedYear: form.publishedYear ? parseInt(form.publishedYear) : undefined,
        genre: form.genre,
        pages: form.pages ? parseInt(form.pages) : undefined,
        authorId: form.authorId,
      };

      if (editingBook) {
        await fetch(`/api/books/${editingBook.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      resetForm();
      fetchBooks();
    } catch {
      setFormError("Error al guardar el libro");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    fetchBooks();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📖 Libros</h1>
            <p className="text-sm text-gray-500 mt-0.5">Búsqueda y gestión de libros</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              ← Dashboard
            </Link>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              + Nuevo Libro
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Create / Edit form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              {editingBook ? "Editar Libro" : "Crear Nuevo Libro"}
            </h2>
            {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                <input
                  type="text"
                  placeholder="Cien años de soledad"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Autor *</label>
                <select
                  value={form.authorId}
                  onChange={(e) => setForm((f) => ({ ...f, authorId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                >
                  <option value="">Seleccionar autor</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Género</label>
                <select
                  value={form.genre}
                  onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                >
                  <option value="">Seleccionar género</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ISBN</label>
                <input
                  type="text"
                  placeholder="978-0307474728"
                  value={form.isbn}
                  onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Año de publicación</label>
                <input
                  type="number"
                  placeholder="1967"
                  value={form.publishedYear}
                  onChange={(e) => setForm((f) => ({ ...f, publishedYear: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Páginas</label>
                <input
                  type="number"
                  placeholder="417"
                  value={form.pages}
                  onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <textarea
                  placeholder="Descripción del libro..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
                {submitting ? "Guardando..." : editingBook ? "Actualizar" : "Crear Libro"}
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

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="🔍 Buscar por título..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Buscar por autor..."
              value={authorFilter}
              onChange={(e) => { setAuthorFilter(e.target.value); setPage(1); }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={genre}
              onChange={(e) => { setGenre(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            >
              <option value="">Todos los géneros</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={order}
              onChange={(e) => { setOrder(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
            {(search || genre || authorFilter) && (
              <button
                onClick={() => { setSearch(""); setGenre(""); setAuthorFilter(""); setPage(1); }}
                className="text-sm text-red-600 hover:text-red-800 px-2 py-2"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {loading ? "Buscando..." : pagination ? `${pagination.total} resultado${pagination.total !== 1 ? "s" : ""} encontrado${pagination.total !== 1 ? "s" : ""}` : ""}
            </p>
            {pagination && pagination.totalPages > 1 && (
              <p className="text-sm text-gray-500">
                Página {pagination.page} de {pagination.totalPages}
              </p>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin text-3xl mb-3">⏳</div>
              <p className="text-gray-400 text-sm">Cargando libros...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p>No se encontraron libros con esos filtros.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {books.map((book) => (
                <li key={book.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{book.title}</p>
                      <p className="text-sm text-gray-600">{book.author?.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {book.genre && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{book.genre}</span>
                        )}
                        {book.publishedYear && (
                          <span className="text-xs text-gray-400">{book.publishedYear}</span>
                        )}
                        {book.pages && (
                          <span className="text-xs text-gray-400">{book.pages} págs.</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(book)}
                        className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-100 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(book.id, book.title)}
                        className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 2)
                  .map((p, idx, arr) => (
                    <>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span key={`ellipsis-${p}`} className="px-2 py-2 text-sm text-gray-400">…</span>
                      )}
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                          p === pagination.page
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    </>
                  ))}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
