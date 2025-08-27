import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get("userId");
    const parentId = searchParams.get("parentId");

    if (!queryUserId || queryUserId !== userId) {
      if (!userId) {
        return NextResponse.json(
          {
            error: "Access Denied , Unauthorized",
          },
          { status: 401 }
        );
      }
    }

    // fetch files from database
    let userFiles;
    if (parentId) {
      //fetch from a specific folder
      userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), eq(files.parentId, parentId)));
    } else {
      userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), isNull(files.parentId)));
    }

    return NextResponse.json(
      {
        success: true,
        message: "Files fetched successfully",
        userFiles,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error in fetching files",
        error,
      },
      {
        status: 500,
      }
    );
  }
}
