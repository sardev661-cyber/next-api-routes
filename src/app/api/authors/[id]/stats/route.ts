import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: {
          select: {
            title: true,
            publishedYear: true,
            pages: true,
            genre: true,
          },
          orderBy: { publishedYear: "asc" },
        },
      },
    });

    if (!author) {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 });
    }

    const books = author.books;
    const totalBooks = books.length;

    if (totalBooks === 0) {
      return NextResponse.json({
        authorId: author.id,
        authorName: author.name,
        totalBooks: 0,
        firstBook: null,
        latestBook: null,
        averagePages: 0,
        genres: [],
        longestBook: null,
        shortestBook: null,
      });
    }

    const firstBook = books[0];
    const latestBook = books[books.length - 1];

    const booksWithPages = books.filter((b) => b.pages !== null);
    const averagePages =
      booksWithPages.length > 0
        ? Math.round(
            booksWithPages.reduce((sum, b) => sum + (b.pages ?? 0), 0) /
              booksWithPages.length
          )
        : 0;

    const genres = [...new Set(books.map((b) => b.genre).filter(Boolean))];

    const longestBook = booksWithPages.reduce(
      (max, b) => (b.pages! > (max?.pages ?? -Infinity) ? b : max),
      booksWithPages[0]
    );

    const shortestBook = booksWithPages.reduce(
      (min, b) => (b.pages! < (min?.pages ?? Infinity) ? b : min),
      booksWithPages[0]
    );

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook: { title: firstBook.title, year: firstBook.publishedYear },
      latestBook: { title: latestBook.title, year: latestBook.publishedYear },
      averagePages,
      genres,
      longestBook: longestBook
        ? { title: longestBook.title, pages: longestBook.pages }
        : null,
      shortestBook: shortestBook
        ? { title: shortestBook.title, pages: shortestBook.pages }
        : null,
    });
  } catch (error) {
    console.error("Error fetching author stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas del autor" },
      { status: 500 }
    );
  }
}
