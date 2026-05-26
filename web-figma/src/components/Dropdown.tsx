import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  icon,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuStyle({
          position: "absolute",
          top: `${rect.bottom + window.scrollY + 4}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
        });
      };
      
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-[#FEF9F4] py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA] text-left transition-colors relative"
      >
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B6E67]">
            {icon}
          </div>
        )}
        <span className={selectedOption ? "text-[#1A2B38]" : "text-[#7B6E67]"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#7B6E67] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40 cursor-default" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            style={{ ...menuStyle, zIndex: 9999 }}
            className="max-h-60 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {options.length === 0 ? (
              <div className="px-4 py-2.5 text-xs text-center text-[#7B6E67]">
                Tidak ada data pilihan
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-colors ${
                    option.value === value
                      ? "bg-[#29B9AA] text-white"
                      : "text-[#1A2B38] hover:bg-[#FEF9F4]"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
