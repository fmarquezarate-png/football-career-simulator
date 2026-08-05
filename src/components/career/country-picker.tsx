"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { flagUrl } from "@/lib/data/loader";

export interface CountryOption {
  id: string;
  name: string;
  code: string;
}

/** Normaliza para buscar sin acentos ("cote" encuentra "Côte d'Ivoire"). */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function CountryPicker({
  countries, value, onChange,
}: {
  countries: CountryOption[];
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => countries.find(c => c.code === value) ?? countries[0],
    [countries, value],
  );

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return countries;
    return countries.filter(c => norm(c.name).includes(q));
  }, [countries, query]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(""); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm hover:bg-white/5"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Image src={flagUrl(selected.code, 40)} alt="" width={22} height={15} unoptimized className="shrink-0 rounded-[2px]" />
          <span className="truncate">{selected.name}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Buscar entre ${countries.length} países…`}
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <ul role="listbox" className="max-h-72 overflow-y-auto p-1">
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Ningún país coincide con “{query}”.
              </li>
            )}
            {results.map(c => (
              <li key={c.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.code === value}
                  onClick={() => { onChange(c.code); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
                    c.code === value ? "bg-primary/15 text-primary" : "hover:bg-white/5",
                  )}
                >
                  <Image src={flagUrl(c.code, 40)} alt="" width={22} height={15} unoptimized className="shrink-0 rounded-[2px]" />
                  <span className="truncate">{c.name}</span>
                  {c.code === value && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
