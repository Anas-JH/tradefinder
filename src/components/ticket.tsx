import { cn } from "@/lib/utils"

interface TicketProps {
  label: string
  number?: string
  children: React.ReactNode
  className?: string
}

export function Ticket({ label, number, children, className }: TicketProps) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-sm border border-border bg-card"
      />
      <div className={cn("relative rounded-sm border border-border bg-card", className)}>
        <div className="flex items-center justify-between px-4 py-2 font-mono text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          <span>{label}</span>
          {number && <span>No. {number}</span>}
        </div>
        <div className="border-t border-dashed border-border" />
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
