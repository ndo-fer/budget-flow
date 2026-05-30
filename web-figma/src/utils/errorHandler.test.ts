import { describe, it, expect } from "vitest";
import { parseError } from "./errorHandler";

describe("errorHandler", () => {
  it("handles null or undefined error safely", () => {
    const res = parseError(null);
    expect(res.code).toBe("BF-SYS-999");
    expect(res.message).toContain("tidak diketahui");
  });

  it("parses database constraint violations", () => {
    const error = { message: "duplicate key value violates unique constraint 'wallets_name_key'" };
    const res = parseError(error);
    expect(res.code).toBe("BF-DB-002");
    expect(res.message).toContain("sudah terdaftar");
  });

  it("parses Row-Level Security policy violations", () => {
    const error = "new row violates row-level security policy for table 'transactions'";
    const res = parseError(error);
    expect(res.code).toBe("BF-DB-003");
    expect(res.message).toContain("Akses ditolak");
  });

  it("parses foreign key constraint violations", () => {
    const error = new Error("insert or update on table 'transactions' violates foreign key constraint");
    const res = parseError(error);
    expect(res.code).toBe("BF-DB-004");
    expect(res.message).toContain("referensi kategori atau dompet tidak valid");
  });

  it("parses auth invalid credentials", () => {
    const error = { error_description: "Invalid login credentials" };
    const res = parseError(error);
    expect(res.code).toBe("BF-AUTH-001");
    expect(res.message).toContain("Email atau password");
  });

  it("parses weak password validation errors", () => {
    const error = "weak_password: Password should be at least 6 characters";
    const res = parseError(error);
    expect(res.code).toBe("BF-AUTH-002");
    expect(res.message).toContain("Password baru terlalu lemah");
  });

  it("parses email taken errors", () => {
    const error = "Email already registered";
    const res = parseError(error);
    expect(res.code).toBe("BF-AUTH-003");
    expect(res.message).toContain("sudah terdaftar");
  });

  it("parses fetch/network failures", () => {
    const error = "TypeError: Failed to fetch";
    const res = parseError(error);
    expect(res.code).toBe("BF-NET-001");
    expect(res.message).toContain("Koneksi jaringan terputus");
  });

  it("passes through non-technical custom validation string messages", () => {
    const error = "Nama kategori tidak boleh kosong.";
    const res = parseError(error);
    expect(res.code).toBe("BF-VAL-001");
    expect(res.message).toBe("Nama kategori tidak boleh kosong.");
  });

  it("falls back to generic error on other technical errors", () => {
    const error = new TypeError("Cannot read properties of undefined (reading 'map')");
    const res = parseError(error);
    expect(res.code).toBe("BF-SYS-999");
    expect(res.message).toContain("Terjadi kesalahan internal");
  });
});
