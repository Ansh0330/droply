import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          error: "Access Denied , Unauthorized",
        },
        { status: 401 }
      );
    }

    const { fileId } = await props.params;

    if (!fileId) {
      return NextResponse.json(
        {
          error: "File Id is required",
        },
        { status: 404 }
      );
    }

    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) {
      return NextResponse.json(
        {
          error: "File not found",
        },
        { status: 404 }
      );
    }

    // toggle star status
    const updatedFiles = await db
      .update(files)
      .set({ isTrash: !file.isTrash })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();
    const updatedFile = updatedFiles[0];

    const action = updatedFile.isTrash ? "moved to trash" : "restored";
    const message = `File ${action} successfully`;

    return NextResponse.json(
      {
        success: true,
        message: message,
        updatedFile,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error in updating files",
        error,
      },
      {
        status: 500,
      }
    );
  }
}
