"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={true}
      toastOptions={{
        classNames: {
          toast: "group-[.toaster]:bg-white group-[.toaster]:text-[#1A2B38] group-[.toaster]:border-black/10 group-[.toaster]:shadow-[0_12px_32px_rgba(26,43,56,0.08)] group-[.toaster]:rounded-3xl p-4 font-sans font-medium",
          description: "group-[.toast]:text-[#7B6E67] group-[.toast]:text-xs font-normal",
          actionButton: "group-[.toast]:bg-[#29B9AA] group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:rounded-2xl group-[.toast]:px-4 group-[.toast]:py-2.5 group-[.toast]:text-xs group-[.toast]:hover:bg-[#229A8E] group-[.toast]:transition-colors group-[.toast]:shadow-sm",
          cancelButton: "group-[.toast]:bg-[#F3EDE8] group-[.toast]:text-[#7B6E67] group-[.toast]:font-semibold group-[.toast]:rounded-2xl group-[.toast]:px-4 group-[.toast]:py-2.5 group-[.toast]:text-xs group-[.toast]:hover:bg-[#EADFD8] group-[.toast]:transition-colors",
          closeButton: "group-[.toast]:bg-white group-[.toast]:text-[#7B6E67] group-[.toast]:border-black/10 group-[.toast]:hover:bg-[#F3EDE8] group-[.toast]:hover:text-[#1A2B38] group-[.toast]:transition-colors",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
