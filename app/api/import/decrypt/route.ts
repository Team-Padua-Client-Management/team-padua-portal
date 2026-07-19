import { NextRequest, NextResponse } from "next/server";
import { OfficeFile, InvalidKeyError, FileFormatError, ParseError } from "office-crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const password = formData.get("password") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file parameter." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password Required: Please provide the document password to open this file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("=== [BACKEND] Decryption Start ===");
    console.log("File Name:", file.name);
    console.log("File Type:", file.type);
    console.log("File Size:", file.size, "bytes");
    console.log("Buffer Length:", buffer.length, "bytes");
    console.log("Password Length:", password.length);
    console.log("Password Value:", password);

    if (buffer.length < 4) {
      console.log("Decryption Result: Failed (Invalid Excel format - file too small)");
      return NextResponse.json(
        { error: "Invalid Excel format: File is too small or empty.", code: "INVALID_WORKBOOK" },
        { status: 400 }
      );
    }

    const magic = buffer.readUInt32BE(0);
    console.log(`File Magic Hex: 0x${magic.toString(16).toUpperCase()}`);

    if (magic !== 0xD0CF11E0 && magic !== 0x504B0304) {
      console.log("Decryption Result: Failed (Invalid Excel format magic signature)");
      return NextResponse.json(
        { error: "Invalid Excel format: The file signature is invalid. Ensure it is a valid Excel spreadsheet.", code: "INVALID_WORKBOOK" },
        { status: 400 }
      );
    }

    let decryptedBuffer: Uint8Array;
    try {
      const officeFile = OfficeFile(buffer);
      console.log(`Encryption Format: ${officeFile.format}`);
      if ('type' in officeFile) {
        console.log(`Encryption Type: ${(officeFile as any).type}`);
      }

      officeFile.loadKey({ password, verifyPassword: true });
      decryptedBuffer = officeFile.decrypt();
    } catch (err: any) {
      console.error("[BACKEND] Decryption processing failed:");
      console.error(err);

      if (err instanceof InvalidKeyError || err.name === "InvalidKeyError") {
        return NextResponse.json(
          { error: "Wrong password: Decryption failed. Please check the password and try again.", code: "INVALID_PASSWORD" },
          { status: 400 }
        );
      }

      if (err instanceof FileFormatError || err.name === "FileFormatError") {
        return NextResponse.json(
          { error: "Unsupported encryption: The Excel file encryption method is not supported.", code: "UNSUPPORTED_ENCRYPTION" },
          { status: 400 }
        );
      }

      if (err instanceof ParseError || err.name === "ParseError") {
        return NextResponse.json(
          { error: "Corrupted workbook: The Excel file appears to be corrupted or invalid.", code: "CORRUPTED_FILE" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Decryption failed: ${err instanceof Error ? err.message : String(err)}`, code: "DECRYPTION_LIBRARY_ERROR" },
        { status: 400 }
      );
    }

    console.log("Decryption Result: Success");
    console.log("=== [BACKEND] Decryption End ===");

    return new NextResponse(Buffer.from(decryptedBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="decrypted-${file.name}"`,
      },
    });
  } catch (err) {
    console.error("Internal Decryption error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

