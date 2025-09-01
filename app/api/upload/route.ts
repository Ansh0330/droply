import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

//Is vale upload se apne DB me imagekit ki url add ho rahi hai 
export async function POST(request: NextRequest) {
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

    // parse request body
    const body = await request.json();
    const { imagekit, userId: bodyUserId } = body;

    if (bodyUserId !== userId) {
      return NextResponse.json(
        {
          error: "Access Denied , Unauthorized",
        },
        { status: 401 }
      );
    }

    if (!imagekit || !imagekit.url) {
      return NextResponse.json(
        {
          error: "Invalid file upload data",
        },
        { status: 404 }
      );
    }

    const fileData = {
      name: imagekit.name || "Untitled",
      path: imagekit.filePath || `/droply/${userId}/${imagekit.name}`,
      size: imagekit.size || 0,
      type: imagekit.fileType || "image",
      fileUrl: imagekit.url,
      thumbnailUrl: imagekit.thumbnailUrl || null,
      userId: userId,
      parentId: null, // root level by default
      isFolder: false,
      isStarred: false,
      isTrash: false,
    };

    const [newFile] = await db.insert(files).values(fileData).returning();

    return NextResponse.json(
      {
        newFile,
      },
      {
        status: 201,
      }
    );
    // eslint-disable-next-line
  } catch (error : any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to save file to the database",
      },
      { status: 500 }
    );
  }
}
