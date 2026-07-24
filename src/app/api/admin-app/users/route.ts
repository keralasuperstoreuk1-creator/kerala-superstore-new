import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await db.select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      phone: adminUsers.phone,
      isActive: adminUsers.isActive,
      createdAt: adminUsers.createdAt,
    }).from(adminUsers).orderBy(desc(adminUsers.createdAt));
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.insert(adminUsers).values({ name, email, passwordHash }).returning();

    return NextResponse.json({ id: result[0].id, name: result[0].name, email: result[0].email });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
