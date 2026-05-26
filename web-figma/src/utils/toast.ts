import { toast as sonnerToast } from "sonner";
import { parseError } from "./errorHandler";

// Navigation helper that coordinates with AppShell's popstate listener
export const navigateTo = (path: string) => {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const toast = {
  success: (message: string, options?: any) => {
    let action = options?.action;

    if (!action) {
      const lower = message.toLowerCase();
      
      // 1. Expense/Transaction/Import Successful -> View Ledger
      if (
        lower.includes("pengeluaran") || 
        lower.includes("transaksi") || 
        lower.includes("diimpor")
      ) {
        action = {
          label: "Lihat Ledger",
          onClick: () => navigateTo("/ledger"),
        };
      }
      // 2. Income/Pemasukan Successful -> View Ledger
      else if (lower.includes("pemasukan") && !lower.includes("sumber")) {
        action = {
          label: "Lihat Ledger",
          onClick: () => navigateTo("/ledger"),
        };
      }
      // 3. Category/Monthly Plan Successful -> View Budgets
      else if (lower.includes("kategori") || lower.includes("rencana")) {
        action = {
          label: "Lihat Budgets",
          onClick: () => navigateTo("/budget"),
        };
      }
      // 4. Wallet Operations Successful -> View Wallets
      else if (lower.includes("dompet") || lower.includes("wallet")) {
        action = {
          label: "Lihat Wallets",
          onClick: () => navigateTo("/wallets"),
        };
      }
    }

    return sonnerToast.success(message, {
      ...options,
      action: action || options?.action,
    });
  },

  error: (err: any, options?: any) => {
    const parsed = parseError(err);
    const displayMessage = `[${parsed.code}] ${parsed.message}`;
    const copyContent = parsed.originalMessage 
      ? `Code: ${parsed.code}\nMessage: ${parsed.message}\nTechnical Details: ${parsed.originalMessage}`
      : `Code: ${parsed.code}\nMessage: ${parsed.message}`;

    let action = options?.action;

    // Automatically inject "Salin Error" (Copy Error) button
    if (!action) {
      action = {
        label: "Salin Error",
        onClick: () => {
          navigator.clipboard.writeText(copyContent).then(() => {
            sonnerToast.success("Pesan error disalin ke clipboard.", {
              id: "copy-error-success",
              duration: 2000,
            });
          }).catch(() => {});
        },
      };
    }

    return sonnerToast.error(displayMessage, {
      ...options,
      action: action || options?.action,
    });
  },

  warning: (message: string, options?: any) => {
    return sonnerToast.warning(message, options);
  },

  info: (message: string, options?: any) => {
    return sonnerToast.info(message, options);
  },

  custom: (message: string, options?: any) => {
    return sonnerToast(message, options);
  },
};
