import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      required("NEXT_PUBLIC_SUPABASE_URL"),
      required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      { auth: { persistSession: false } }
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const objectKey = formData.get("objectKey");
    if (!(file instanceof File) || typeof objectKey !== "string" || !objectKey) {
      return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
    }

    const client = new S3Client({
      region: "auto",
      endpoint: required("R2_ENDPOINT"),
      credentials: {
        accessKeyId: required("R2_ACCESS_KEY_ID"),
        secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: required("R2_BUCKET_NAME"),
        Key: objectKey,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type || "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const publicBase = required("NEXT_PUBLIC_R2_PUBLIC_URL").replace(/\/$/, "");
    return NextResponse.json({ url: `${publicBase}/${objectKey}` });
  } catch (error) {
    console.error("R2 upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
