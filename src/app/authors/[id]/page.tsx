"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Author {
  id: string;
  name: string;
  email: string;
  nationality: string;
  birthYear: number | null;
  bio: string | null;
}

interface Book {
  id: string;
  title: string;
  genre: string;
  publishedYear: number | null;
  pages: number | null;
  isbn: string | null;
  description: string | null;
}

interface AuthorStats {
  authorId: string;
  authorName: string;
  totalBooks: number;
  firstBook: { title: string; year: number } | null;
  latestBook: { title: string; year: number } | null;
  averagePages: number;
  genres: string[];
  longestBook: { title: string; pages: number } | null;
  shortestBook: { title: string; pages: number } | null;
}

const GENRES = [
  "Novela", "Cuento", "Poesía", "Ensayo", "Biografía",
  "Historia", "Ciencia ficción", "Periodismo", "Drama", "Otro",
];

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit author form
  const [editMode, setEditMode] = useState(false);
  const [authorForm, setAuthorForm] = useState({
    name: "", email: "", nationality: "", birthYear: "", bio: "",
  });
  const [savingAuthor, setSavingAuthor] = useState(false);

  // New book form
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "",
  });
  const [savingBook, setSavingBook] = useState(false);
  const [bookFormError, setBookFormError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [authorRes, booksRes, statsRes] = await Promise.all([
        fetch(`/api/authors/${id}`),
        fetch(`/api/authors/${id}/books`),
        fetch(`/api/authors/${id}/stats`),
      ]);

      if (!authorRes.ok) { setError("Autor no encontrado"); setLoading(false); return; }

      const [authorData, booksData, statsData] = await Promise.all([
        authorRes.json(),
        booksRes.json(),
        statsRes.json(),
      ]);

      setAuthor(authorData);
      setBooks(booksData);
      setStats(statsData);
      setAuthorForm({
        name: authorData.name,
        email: authorData.email,
        nationality: authorData.nationality || "",
        birthYear: authorData.birthYear?.toString() || "",
        bio: authorData.bio || "",
      });
    } catch {
      setError("Error al cargar los datos del autor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleSaveAuthor = async () => {
    setSavingAuthor(true);
    try {
      await fetch(`/api/authors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authorForm.name,
          email: authorForm.email,
          nationality: authorForm.nationality,
          birthYear: authorForm.birthYear ? parseInt(authorForm.birthYear) : undefined,
          bio: authorForm.bio,
        }),
      });
      setEditMode(false);
      fetchAll();
    } catch {
      /* ignore */
    } finally {
      setSavingAuthor(false);
    }
  };

  const handleDeleteAuthor = async () => {
    if (!confirm(`¿Eliminar al autor "${author?.name}" y todos sus libros?`)) return;
    await fetch(`/api/authors/${id}`, { method: "DELETE" });
    router.push("/");
  };

  const handleAddBook = async () => {
    if (!bookForm.title) { setBookFormError("El título es requerido"); return; }
    setSavingBook(true);
    setBookFormError("");
    try {
      await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookForm.title,
          description: bookForm.description,
          isbn: bookForm.isbn,
          publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear) : undefined,
          genre: bookForm.genre,
          pages: bookForm.pages ? parseInt(bookForm.pages) : undefined,
          authorId: id,
        }),
      });
      setBookForm({ title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "" });
      setShowBookForm(false);
      fetchAll();
    } catch {
      setBookFormError("Error al crear el libro");
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    await fetch(`/api/books/${bookId}`, { method: "DELETE" });
    fetchAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-spin inline-block mb-3">⏳</div>
          <p className="text-gray-400">Cargando información del autor...</p>
        </div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-gray-700 font-medium">{error || "Autor no encontrado"}</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
            ← Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">←</Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{author.name}</h1>
              <p className="text-sm text-gray-500">{author.nationality}{author.birthYear ? ` · ${author.birthYear}` : ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              {editMode ? "Cancelar edición" : "✏️ Editar autor"}
            </button>
            <button
              onClick={handleDeleteAuthor}
              className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Author info / edit form */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Información del Autor</h2>
              {editMode ? (
                <div className="space-y-3">
                  {[
                    { label: "Nombre", key: "name" },
                    { label: "Email", key: "email" },
                    { label: "Nacionalidad", key: "nationality" },
                    { label: "Año de nacimiento", key: "birthYear" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input
                        type={key === "birthYear" ? "number" : "text"}
                        value={authorForm[key as keyof typeof authorForm]}
                        onChange={(e) => setAuthorForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Biografía</label>
                    <textarea
                      value={authorForm.bio}
                      onChange={(e) => setAuthorForm((f) => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveAuthor}
                    disabled={savingAuthor}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {savingAuthor ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              ) : (
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs text-gray-400">Email</dt>
                    <dd className="text-sm text-gray-800 break-all">{author.email}</dd>
                  </div>
                  {author.nationality && (
                    <div>
                      <dt className="text-xs text-gray-400">Nacionalidad</dt>
                      <dd className="text-sm text-gray-800">{author.nationality}</dd>
                    </div>
                  )}
                  {author.birthYear && (
                    <div>
                      <dt className="text-xs text-gray-400">Año de nacimiento</dt>
                      <dd className="text-sm text-gray-800">{author.birthYear}</dd>
                    </div>
                  )}
                  {author.bio && (
                    <div>
                      <dt className="text-xs text-gray-400">Biografía</dt>
                      <dd className="text-sm text-gray-700 leading-relaxed">{author.bio}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            {/* Stats */}
            {stats && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">📊 Estadísticas</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Total de libros</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.totalBooks}</span>
                  </div>
                  {stats.averagePages > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Promedio de páginas</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.averagePages}</span>
                    </div>
                  )}
                  {stats.firstBook && (
                    <div>
                      <span className="text-xs text-gray-500">Primer libro</span>
                      <p className="text-xs text-gray-800 font-medium mt-0.5">{stats.firstBook.title} ({stats.firstBook.year})</p>
                    </div>
                  )}
                  {stats.latestBook && stats.latestBook.title !== stats.firstBook?.title && (
                    <div>
                      <span className="text-xs text-gray-500">Último libro</span>
                      <p className="text-xs text-gray-800 font-medium mt-0.5">{stats.latestBook.title} ({stats.latestBook.year})</p>
                    </div>
                  )}
                  {stats.longestBook && (
                    <div>
                      <span className="text-xs text-gray-500">Libro más largo</span>
                      <p className="text-xs text-gray-800 font-medium mt-0.5">{stats.longestBook.title} ({stats.longestBook.pages} págs.)</p>
                    </div>
                  )}
                  {stats.shortestBook && stats.shortestBook.title !== stats.longestBook?.title && (
                    <div>
                      <span className="text-xs text-gray-500">Libro más corto</span>
                      <p className="text-xs text-gray-800 font-medium mt-0.5">{stats.shortestBook.title} ({stats.shortestBook.pages} págs.)</p>
                    </div>
                  )}
                  {stats.genres.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">Géneros</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stats.genres.map((g) => (
                          <span key={g} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column: books */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">
                  Libros ({books.length})
                </h2>
                <button
                  onClick={() => setShowBookForm(!showBookForm)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  + Agregar libro
                </button>
              </div>

              {/* Add book form */}
              {showBookForm && (
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Nuevo libro para {author.name}</h3>
                  {bookFormError && <p className="text-red-600 text-sm mb-3">{bookFormError}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                      <input
                        type="text"
                        placeholder="Título del libro"
                        value={bookForm.title}
                        onChange={(e) => setBookForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Género</label>
                      <select
                        value={bookForm.genre}
                        onChange={(e) => setBookForm((f) => ({ ...f, genre: e.target.value }))}
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
                        placeholder="978-..."
                        value={bookForm.isbn}
                        onChange={(e) => setBookForm((f) => ({ ...f, isbn: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Año de publicación</label>
                      <input
                        type="number"
                        placeholder="1967"
                        value={bookForm.publishedYear}
                        onChange={(e) => setBookForm((f) => ({ ...f, publishedYear: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Páginas</label>
                      <input
                        type="number"
                        placeholder="417"
                        value={bookForm.pages}
                        onChange={(e) => setBookForm((f) => ({ ...f, pages: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                      <textarea
                        placeholder="Descripción..."
                        value={bookForm.description}
                        onChange={(e) => setBookForm((f) => ({ ...f, description: e.target.value }))}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={handleAddBook}
                      disabled={savingBook}
                      className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {savingBook ? "Guardando..." : "Crear libro"}
                    </button>
                    <button
                      onClick={() => { setShowBookForm(false); setBookFormError(""); }}
                      className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Books list */}
              {books.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">Este autor no tiene libros registrados aún.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {books.map((book) => (
                    <li key={book.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{book.title}</p>
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
                            {book.isbn && (
                              <span className="text-xs text-gray-400">ISBN: {book.isbn}</span>
                            )}
                          </div>
                          {book.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{book.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors flex-shrink-0"
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}