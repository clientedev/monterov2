import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  emptyMessage?: string;
  /** Set to true to allow clearing the selection */
  clearable?: boolean;
  /** Optional callback to trigger quick creation of a new item */
  onAddNew?: () => void;
  addNewLabel?: string;
}

/**
 * SearchableSelect — a combobox with text search built on Popover + Command.
 * Replaces plain <Select> whenever the list can be large (contacts, clientes, etc.)
 * and wherever quick keyboard navigation is useful.
 */
export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Pesquisar...",
  disabled = false,
  className,
  triggerClassName,
  emptyMessage = "Nenhum item encontrado.",
  clearable = false,
  onAddNew,
  addNewLabel = "Adicionar novo...",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-11 rounded-xl border-input bg-background hover:bg-background text-left",
            !selected && "text-muted-foreground",
            triggerClassName,
          )}
        >
          <span className="truncate flex-1">
            {selected ? (
              <>
                {selected.label}
                {selected.sublabel && (
                  <span className="ml-1.5 text-muted-foreground text-xs">
                    {selected.sublabel}
                  </span>
                )}
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0", className)}
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>
              <div className="py-2 px-3 text-center space-y-2">
                <p className="text-xs text-muted-foreground">{emptyMessage}</p>
                {onAddNew && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold text-primary border-primary/20 hover:bg-primary/5 rounded-lg"
                    onClick={() => {
                      setOpen(false);
                      onAddNew();
                    }}
                  >
                    + {addNewLabel}
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {onAddNew && (
                <CommandItem
                  value="__add_new_option__"
                  onSelect={() => {
                    setOpen(false);
                    onAddNew();
                  }}
                  className="text-primary font-bold text-xs cursor-pointer bg-primary/5 hover:bg-primary/10 border-b border-primary/10 mb-1 py-2"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">+</span>
                    {addNewLabel}
                  </span>
                </CommandItem>
              )}
              {clearable && value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                  }}
                  className="text-muted-foreground text-xs italic"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Limpar seleção
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  // cmdk uses this for client-side filtering
                  value={`${option.label} ${option.sublabel ?? ""}`}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.sublabel && (
                    <span className="ml-2 text-muted-foreground text-xs shrink-0">
                      {option.sublabel}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
