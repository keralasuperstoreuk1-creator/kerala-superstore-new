import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({ email, token, expiresAt }).execute();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.get("origin") || "http://localhost:3009";
    const resetUrl = `${baseUrl}/admin-app?reset=${token}`;

    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@keralasuperstore.com",
        to: email,
        subject: "Admin App - Password Reset",
        html: `<p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a><p>This link expires in 1 hour.</p>`,
      });
      return NextResponse.json({ message: "A reset link has been sent to your email." });
    }

    // Fallback: return the reset link directly when no SMTP configured
    return NextResponse.json({
      message: "Reset link generated",
      resetUrl,
      devMode: true,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
