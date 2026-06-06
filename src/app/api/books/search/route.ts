import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const genre = searchParams.get("genre") || "";
    const authorName = searchParams.get("authorName") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const sortByParam = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const allowedSortFields = ["title", "publishedYear", "createdAt"];
    const sortBy = allowedSortFields.includes(sortByParam) ? sortByParam : "createdAt";

    const where: any = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (genre) {
      where.genre = genre;
    }

    if (authorName) {
      where.author = { name: { contains: authorName, mode: "insensitive" } };
    }

    const [total, data] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: { author: { select: { id: true, name: true, nationality: true } } },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error searching books:", error);
    return NextResponse.json({ error: "Error al buscar libros" }, { status: 500 });
  }
}