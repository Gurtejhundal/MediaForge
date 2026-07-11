import Link from "next/link";
import { ArrowUpRight, RadioTower, ShieldCheck } from "lucide-react";
import { toolGroups } from "@/lib/tool-catalog";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-black bg-[#12130f] text-[#ddd7c9]">
      <div className="mx-auto w-[min(100%-24px,1440px)] py-10 md:w-[min(100%-48px,1440px)] md:py-14">
        <div className="mf-chassis overflow-hidden p-3 md:p-4">
          <div className="grid gap-8 rounded-lg border border-[#4b4d44] bg-[#272922] p-5 md:p-8 lg:grid-cols-[minmax(260px,0.72fr)_2fr]">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a4a698]">Rack unit 24 / MediaForge</p>
              <h2 className="mf-display mt-4 max-w-sm text-5xl font-semibold uppercase leading-[0.88] tracking-[-0.015em] text-[#f0eadd] md:text-6xl">
                Keep the file. Use the console.
              </h2>
              <div className="mt-6 space-y-2">
                <span className="flex items-center rounded-sm border border-black bg-[#1b1d18] px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.13em] text-[#c6c9bb] shadow-[inset_0_2px_4px_rgba(0,0,0,.5)]">
                  <span className="mf-lamp mr-2" data-tone="green" /><ShieldCheck className="mr-2 size-3.5" /> Core tools stay local
                </span>
                <span className="flex items-center rounded-sm border border-black bg-[#1b1d18] px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.13em] text-[#c6c9bb] shadow-[inset_0_2px_4px_rgba(0,0,0,.5)]">
                  <span className="mf-lamp mr-2" data-tone="amber" /><RadioTower className="mr-2 size-3.5" /> Network routes are marked
                </span>
              </div>
            </div>

            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
              {toolGroups.map((group) => (
                <section key={group.key} aria-labelledby={`footer-${group.id}`}>
                  <div className="border-t border-[#55574d] pt-3">
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#e3a438]">{group.number}</p>
                    <h3 id={`footer-${group.id}`} className="mt-1 text-sm font-semibold text-[#eee8db]">{group.label}</h3>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {group.tools.map((tool) => (
                      <li key={tool.href}>
                        <Link href={tool.href} className="group inline-flex text-xs leading-5 text-[#9fa196] hover:text-[#f2ebdd]">
                          {tool.title}
                          <ArrowUpRight className="ml-1 size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 font-mono text-[9px] uppercase tracking-[0.13em] text-[#85877d] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MediaForge / Serial MF-LOCAL-01</p>
          <p>Built by <Link href="https://gurtejbirsingh.vercel.app/" className="text-[#c8c2b5] hover:text-[#e3a438]">Gurtejbir Singh</Link>. Feedback uses a network route.</p>
        </div>
      </div>
    </footer>
  );
}
