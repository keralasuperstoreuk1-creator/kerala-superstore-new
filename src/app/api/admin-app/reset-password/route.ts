import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const records = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
    if (records.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const record = records[0];
    if (record.used) {
      return NextResponse.json({ error: "This reset link has already been used" }, { status: 400 });
    }
    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: "This reset link has expired" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.email, record.email)).execute();
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.token, token)).execute();

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
