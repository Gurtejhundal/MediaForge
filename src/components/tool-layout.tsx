import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 flex-1 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mb-10 text-center"
      >
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{title}</h1>
        <p className="text-muted-foreground text-lg">{description}</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-4xl bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8"
      >
        {children}
      </motion.div>
    </div>
  );
}
