import { fileTypeFromBuffer } from "file-type";

/**
 * SIKKERHET: Filvalidering basert på magic bytes
 * 
 * Validerer faktisk filinnhold (ikke bare MIME type eller filnavn)
 * Beskytter mot ondsinnede filer omdøpt til tillatte formater
 */

export interface FileValidationResult {
  isValid: boolean;
  detectedType?: string;
  error?: string;
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_PDF_TYPE = "application/pdf";

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

/**
 * Valider bildefil basert på faktisk innhold
 */
export async function validateImageFile(
  buffer: Buffer
): Promise<FileValidationResult> {
  try {
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      return {
        isValid: false,
        error: "Kunne ikke bestemme filtype. Filen kan være korrupt eller ugyldig.",
      };
    }

    if (!ALLOWED_IMAGE_TYPES.has(fileType.mime)) {
      return {
        isValid: false,
        detectedType: fileType.mime,
        error: `Ugyldig bildeformat. Detektert: ${fileType.mime}. Kun JPG, PNG, WebP og GIF er tillatt.`,
      };
    }

    return {
      isValid: true,
      detectedType: fileType.mime,
    };
  } catch (error) {
    console.error("File validation error:", error);
    return {
      isValid: false,
      error: "Filvalidering feilet. Prøv igjen eller kontakt support.",
    };
  }
}

/**
 * Valider PDF-fil basert på faktisk innhold
 */
export async function validatePdfFile(
  buffer: Buffer
): Promise<FileValidationResult> {
  try {
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      return {
        isValid: false,
        error: "Kunne ikke bestemme filtype. Filen kan være korrupt eller ugyldig.",
      };
    }

    if (fileType.mime !== ALLOWED_PDF_TYPE) {
      return {
        isValid: false,
        detectedType: fileType.mime,
        error: `Ugyldig filformat. Detektert: ${fileType.mime}. Kun PDF er tillatt.`,
      };
    }

    return {
      isValid: true,
      detectedType: fileType.mime,
    };
  } catch (error) {
    console.error("PDF validation error:", error);
    return {
      isValid: false,
      error: "Filvalidering feilet. Prøv igjen eller kontakt support.",
    };
  }
}

/**
 * Valider dokument-fil (PDF, Word, Excel)
 */
export async function validateDocumentFile(
  buffer: Buffer
): Promise<FileValidationResult> {
  try {
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      return {
        isValid: false,
        error: "Kunne ikke bestemme filtype. Filen kan være korrupt eller ugyldig.",
      };
    }

    if (!ALLOWED_DOCUMENT_TYPES.has(fileType.mime)) {
      return {
        isValid: false,
        detectedType: fileType.mime,
        error: `Ugyldig dokumentformat. Detektert: ${fileType.mime}. Kun PDF, Word og Excel er tillatt.`,
      };
    }

    return {
      isValid: true,
      detectedType: fileType.mime,
    };
  } catch (error) {
    console.error("Document validation error:", error);
    return {
      isValid: false,
      error: "Filvalidering feilet. Prøv igjen eller kontakt support.",
    };
  }
}

/**
 * Valider filstørrelse
 */
export function validateFileSize(
  size: number,
  maxSizeMB: number = 10
): { isValid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (size > maxSizeBytes) {
    return {
      isValid: false,
      error: `Filen er for stor. Maksimal størrelse er ${maxSizeMB}MB.`,
    };
  }

  if (size === 0) {
    return {
      isValid: false,
      error: "Filen er tom.",
    };
  }

  return { isValid: true };
}
