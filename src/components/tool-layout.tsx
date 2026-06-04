import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="mx-auto flex w-[min(100%-24px,1120px)] flex-1 flex-col px-0 py-8 md:w-[min(100%-48px,1120px)] md:py-12">
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
        className="mb-6 w-full"
      >
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.18, ease: [0.2, 0, 0, 1] }}
        className="w-full rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] md:p-6"
      >
        {children}
      </motion.div>
    </div>
  );
}
