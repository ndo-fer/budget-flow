/**
 * Budget Flow - Central Error Handler Utility
 * Maps raw database, network, auth, and system errors to clean, localized,
 * user-friendly messages and unique error codes.
 */

export interface SystemError {
  message: string;
  code: string;
  originalMessage?: string;
}

export const ERROR_MAP: Record<string, { message: string; code: string }> = {
  // Database Error Codes (BF-DB-xxx)
  "delete_user_not_found": {
    message: "Fungsi pembersihan akun tidak ditemukan di server. Harap hubungi dukungan teknis.",
    code: "BF-DB-001",
  },
  "schema_cache_error": {
    message: "Terjadi kegagalan konfigurasi sistem database database. Harap hubungi admin.",
    code: "BF-DB-001",
  },
  "unique_constraint_violation": {
    message: "Data ini sudah terdaftar di sistem. Silakan gunakan nama atau data yang berbeda.",
    code: "BF-DB-002",
  },
  "rls_policy_violation": {
    message: "Akses ditolak. Anda tidak memiliki izin untuk melihat atau memodifikasi data ini.",
    code: "BF-DB-003",
  },
  "foreign_key_violation": {
    message: "Gagal menyimpan data karena referensi kategori atau dompet tidak valid/tidak ditemukan.",
    code: "BF-DB-004",
  },

  // Auth Error Codes (BF-AUTH-xxx)
  "invalid_credentials": {
    message: "Email atau password yang Anda masukkan salah. Silakan periksa kembali.",
    code: "BF-AUTH-001",
  },
  "weak_password": {
    message: "Password baru terlalu lemah. Harap gunakan minimal 6 karakter.",
    code: "BF-AUTH-002",
  },
  "email_taken": {
    message: "Alamat email ini sudah terdaftar. Silakan masuk menggunakan email tersebut.",
    code: "BF-AUTH-003",
  },

  // Network Error Codes (BF-NET-xxx)
  "network_error": {
    message: "Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet dan coba lagi.",
    code: "BF-NET-001",
  },
};

/**
 * Parses raw error from Supabase / PostgREST / network fetch and returns a clean user-friendly SystemError.
 */
export function parseError(error: any): SystemError {
  if (!error) {
    return {
      message: "Terjadi kesalahan sistem yang tidak diketahui.",
      code: "BF-SYS-999",
    };
  }

  const rawMessage = typeof error === "string" 
    ? error 
    : error.message || error.error_description || String(error);

  const lowerMessage = rawMessage.toLowerCase();

  // 1. Missing RPC delete_user / schema cache issues
  if (lowerMessage.includes("delete_user") || lowerMessage.includes("schema cache")) {
    return {
      message: ERROR_MAP.schema_cache_error.message,
      code: ERROR_MAP.schema_cache_error.code,
      originalMessage: rawMessage,
    };
  }

  // 2. Database Constraint & RLS Policies
  if (lowerMessage.includes("unique constraint") || lowerMessage.includes("duplicate key")) {
    return {
      message: ERROR_MAP.unique_constraint_violation.message,
      code: ERROR_MAP.unique_constraint_violation.code,
      originalMessage: rawMessage,
    };
  }

  if (lowerMessage.includes("row-level security") || lowerMessage.includes("rls") || lowerMessage.includes("permission denied")) {
    return {
      message: ERROR_MAP.rls_policy_violation.message,
      code: ERROR_MAP.rls_policy_violation.code,
      originalMessage: rawMessage,
    };
  }

  if (lowerMessage.includes("foreign key constraint") || lowerMessage.includes("violates foreign key")) {
    return {
      message: ERROR_MAP.foreign_key_violation.message,
      code: ERROR_MAP.foreign_key_violation.code,
      originalMessage: rawMessage,
    };
  }

  // 3. Authentication
  if (lowerMessage.includes("invalid login credentials") || lowerMessage.includes("invalid credentials")) {
    return {
      message: ERROR_MAP.invalid_credentials.message,
      code: ERROR_MAP.invalid_credentials.code,
      originalMessage: rawMessage,
    };
  }

  if (lowerMessage.includes("password should be at least") || lowerMessage.includes("weak_password")) {
    return {
      message: ERROR_MAP.weak_password.message,
      code: ERROR_MAP.weak_password.code,
      originalMessage: rawMessage,
    };
  }

  if (lowerMessage.includes("already registered") || lowerMessage.includes("email already exists") || lowerMessage.includes("email_exists")) {
    return {
      message: ERROR_MAP.email_taken.message,
      code: ERROR_MAP.email_taken.code,
      originalMessage: rawMessage,
    };
  }

  // 4. Network
  if (lowerMessage.includes("fetch failed") || lowerMessage.includes("network error") || lowerMessage.includes("failed to fetch")) {
    return {
      message: ERROR_MAP.network_error.message,
      code: ERROR_MAP.network_error.code,
      originalMessage: rawMessage,
    };
  }

  // 5. Default Fallback
  return {
    message: `Terjadi kesalahan internal pada aplikasi.`,
    code: "BF-SYS-999",
    originalMessage: rawMessage,
  };
}
