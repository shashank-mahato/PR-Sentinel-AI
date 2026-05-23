import Link from "next/link";
import { BarChart3, Github, GitPullRequestArrow, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/repositories", label: "Repositories", icon: Github },
  { href: "/reviews", label: "Reviews", icon: GitPullRequestArrow },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppSidebar({ pathname }: { pathname?: string }) {
  return (
    <aside className="hidden min-h-screen w-64 border-r border-slate-800 bg-slate-950/80 p-4 lg:block">
      <Link className="mb-8 flex items-center gap-3 px-2" href="/dashboard">
        <div className="rounded-lg bg-teal-400 p-2 text-slate-950">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-white">PR Sentinel AI</p>
          <p className="text-xs text-slate-500">Production PR reviews</p>
        </div>
      </Link>
      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-teal-400/12 text-teal-100" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
