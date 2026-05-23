import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      default: "border-slate-700 bg-slate-900 text-slate-200",
      critical: "border-red-500/40 bg-red-500/15 text-red-200",
      high: "border-orange-500/40 bg-orange-500/15 text-orange-200",
      medium: "border-yellow-500/40 bg-yellow-500/15 text-yellow-100",
      low: "border-sky-500/40 bg-sky-500/15 text-sky-200",
      success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
      warning: "border-amber-500/40 bg-amber-500/15 text-amber-200",
      failed: "border-red-500/40 bg-red-500/15 text-red-200"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
