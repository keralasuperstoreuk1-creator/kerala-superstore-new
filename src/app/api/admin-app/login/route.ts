import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const DEFAULT_ADMINS = [
  { name: "Rajesh Kumar", email: "rajesh@keralasuperstore.com", password: "admin123" },
  { name: "Priya Nair", email: "priya@keralasuperstore.com", password: "admin123" },
  { name: "Suresh Menon", email: "suresh@keralasuperstore.com", password: "admin123" },
  { name: "Anitha George", email: "anitha@keralasuperstore.com", password: "admin123" },
  { name: "Vishnu Prakash", email: "vishnu@keralasuperstore.com", password: "admin123" },
];

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    let user = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);

    if (user.length === 0) {
      const admin = DEFAULT_ADMINS.find((a) => a.email === email);
      if (!admin) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }
      const passwordHash = await bcrypt.hash(admin.password, 10);
      const result = await db.insert(adminUsers).values({ name: admin.name, email: admin.email, passwordHash }).returning();
      user = result;
    }

    const valid = await bcrypt.compare(password, user[0].passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
      phone: user[0].phone,
    });
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
