"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Zap, Shield, FileType, CheckCircle2, Box, Crop, Download, Maximize, Film, QrCode, Link as LinkIcon2, MonitorUp, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLS = [
  {
    title: "AI Image Enhancer",
    description: "Professional-grade enhancement that restores detail, adjusts contrast, and makes colors pop.",
    icon: <Sparkles className="h-6 w-6 text-emerald-500" />,
    href: "/tools/image-enhancer",
    popular: true,
  },
  {
    title: "PNG to Favicon",
    description: "Generate a complete .ico and .png favicon package for modern web apps with one click.",
    icon: <Box className="h-6 w-6 text-purple-500" />,
    href: "/tools/png-to-favicon",
  },
  {
    title: "Format Converter",
    description: "Convert seamlessly between PNG, JPG, WEBP, and more with high quality.",
    icon: <FileType className="h-6 w-6 text-blue-500" />,
    href: "/tools/format-converter",
  },
  {
    title: "Image Resizer",
    description: "Resize images to exact pixel dimensions while maintaining aspect ratio.",
    icon: <Maximize className="h-6 w-6 text-emerald-500" />,
    href: "/tools/resize",
  },
  {
    title: "Compressor",
    description: "Reduce file sizes significantly without losing visible image quality.",
    icon: <Download className="h-6 w-6 text-orange-500" />,
    href: "/tools/compress",
  },
  {
    title: "Video Upscaler",
    description: "Upscale 720p or 1080p videos to crisp 4K UHD resolution with Lanczos resampling.",
    icon: <MonitorUp className="h-6 w-6 text-cyan-500" />,
    href: "/tools/video-upscaler",
    popular: true,
  },
  {
    title: "BG Remover",
    description: "Instantly remove backgrounds from any photo using AI-powered segmentation.",
    icon: <Eraser className="h-6 w-6 text-rose-500" />,
    href: "/tools/bg-remover",
    popular: true,
  },
  {
    title: "Video to Image",
    description: "Extract high-quality JPG frames or generate animated GIFs from MP4 videos.",
    icon: <Film className="h-6 w-6 text-pink-500" />,
    href: "/tools/video-to-image",
  },
  {
    title: "QR Code Generator",
    description: "Instantly create high resolution, deeply customizable QR Codes for texts or links.",
    icon: <QrCode className="h-6 w-6 text-emerald-500" />,
    href: "/tools/qr-generator",
  },
  {
    title: "Watermark Remover",
    description: "Remove logos or watermarks from videos by selecting the area you want to clean.",
    icon: <Eraser className="h-6 w-6 text-indigo-500" />,
    href: "/tools/watermark-remover",
    popular: true,
  },
  {
    title: "URL Video Downloader",
    description: "Paste a YouTube or raw .mp4 link to bypass CORS and download the whole video locally.",
    icon: <LinkIcon2 className="h-6 w-6 text-emerald-500" />,
    href: "/tools/video-downloader",
  },
];

const FEATURES = [
  { text: "Lightning Fast Conversion", icon: <Zap className="h-5 w-5 text-yellow-500" /> },
  { text: "Secure Processing", icon: <Shield className="h-5 w-5 text-green-500" /> },
  { text: "No Uploads Stored", icon: <CheckCircle2 className="h-5 w-5 text-blue-500" /> },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center pb-24 border-t border-border/40">
      <section className="w-full relative flex flex-col items-center px-4 pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mb-8 relative z-10"
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 backdrop-blur-sm">
            <Zap className="mr-2 h-4 w-4" />
            V1.0 is now live
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Convert Media <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">Instantly</span>
          </h1>
          <p className="text-xl text-muted-foreground md:px-12 leading-relaxed">
            The ultimate online toolkit for developers and creators. Generate complete favicon packages, convert formats, and compress sizes locally and securely.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 z-10"
        >
          <Link href="/tools/png-to-favicon">
            <Button size="lg" className="rounded-full shadow-lg h-12 px-8">
              Start Converting <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#tools">
            <Button size="lg" variant="outline" className="rounded-full h-12 px-8 group backdrop-blur-sm bg-background/50">
              View All Tools
            </Button>
          </Link>
        </motion.div>
      </section>

      <section className="w-full max-w-6xl px-4 py-8 relative z-10 flex justify-center mb-16">
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground">
          {FEATURES.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-2 bg-background/50 border border-border/50 px-4 py-2 rounded-full backdrop-blur-md"
            >
              {feature.icon}
              <span>{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="tools" className="w-full max-w-6xl px-4 py-16 scroll-mt-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Powerful Media Tools</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to optimize and format your visual assets. Select a tool below to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {TOOLS.map((tool, i) => (
            <Link key={i} href={tool.href} className="group outline-none">
              <motion.div 
                whileHover={{ y: -5 }}
                className="relative h-full overflow-hidden rounded-2xl border border-border/50 bg-background/40 p-8 backdrop-blur-md transition-all group-hover:border-primary/50 group-hover:bg-background/60 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:group-hover:shadow-[0_8px_30px_rgb(255,255,255,0.03)]"
              >
                {tool.popular && (
                  <div className="absolute top-4 right-4 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110 group-hover:bg-primary/20">
                  {tool.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold flex items-center group-hover:text-primary transition-colors">
                  {tool.title}
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
