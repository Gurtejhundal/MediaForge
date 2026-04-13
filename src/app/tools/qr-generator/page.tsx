"use client";

import { useState, useEffect } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2, Download, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function QrGeneratorPage() {
  const [text, setText] = useState("");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [margin, setMargin] = useState<number[]>([4]);
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("H");
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Debounced live preview generation
  useEffect(() => {
    if (!text.trim()) {
       setPreviewUrl(null);
       return;
    }

    const timer = setTimeout(async () => {
      setIsGenerating(true);
      const formData = new FormData();
      formData.append("text", text);
      formData.append("dark", darkColor);
      formData.append("light", lightColor);
      formData.append("margin", margin?.[0]?.toString() || "4");
      formData.append("errorCorrection", errorCorrection);
      formData.append("format", format);

      try {
        const response = await fetch("/api/convert/qr", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Preview generation failed", error);
      } finally {
        setIsGenerating(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [text, darkColor, lightColor, margin, errorCorrection, format]);

  const handleDownload = () => {
     if (!previewUrl) {
         toast.error("Please enter some text first.");
         return;
     }
     
     const link = document.createElement("a");
     link.href = previewUrl;
     link.download = `qr-code-${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
     document.body.appendChild(link);
     link.click();
     link.remove();
     
     toast.success("QR Code downloaded successfully!");
  };

  return (
    <ToolLayout 
      title="QR Code Generator" 
      description="Instantly convert links, passwords, and text into high-resolution, branded QR codes."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Settings Column */}
        <div className="space-y-6">
           <div className="bg-muted/30 p-6 rounded-xl border">
              <Label className="mb-2 block">Content Text or URL</Label>
              <Textarea 
                placeholder="https://example.com" 
                value={text} 
                onChange={e => setText(e.target.value)}
                className="h-32 resize-none bg-background/50"
              />
           </div>

           <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
              <h3 className="font-semibold flex items-center mb-2"><QrCode className="mr-2 h-5 w-5 text-primary" /> Appearance</h3>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label className="mb-2 block text-xs">Foreground Color</Label>
                    <div className="flex bg-background border rounded-md overflow-hidden h-10">
                       <input 
                         type="color" 
                         value={darkColor} 
                         onChange={e => setDarkColor(e.target.value)} 
                         className="h-full w-12 cursor-pointer border-r"
                       />
                       <span className="flex items-center px-3 text-sm font-mono uppercase bg-muted/10 w-full">{darkColor}</span>
                    </div>
                 </div>
                 <div>
                    <Label className="mb-2 block text-xs">Background Color</Label>
                    <div className="flex bg-background border rounded-md overflow-hidden h-10">
                       <input 
                         type="color" 
                         value={lightColor} 
                         onChange={e => setLightColor(e.target.value)} 
                         className="h-full w-12 cursor-pointer border-r"
                       />
                       <span className="flex items-center px-3 text-sm font-mono uppercase bg-muted/10 w-full">{lightColor}</span>
                    </div>
                 </div>
              </div>

              <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Quiet Zone Margin</Label>
                    <span className="text-sm font-bold bg-primary/20 text-primary px-2 py-1 rounded">
                      {margin[0]}px
                    </span>
                  </div>
                  <Slider 
                    value={margin} 
                    onValueChange={(val) => setMargin(val as number[])} 
                    max={10} 
                    min={0} 
                    step={1}
                  />
              </div>

              <div>
                 <Label className="mb-3 block text-sm">Error Correction Level</Label>
                 <div className="flex gap-2">
                    {(["L", "M", "Q", "H"] as const).map(level => (
                       <Button 
                         key={level}
                         variant={errorCorrection === level ? "default" : "outline"}
                         onClick={() => setErrorCorrection(level)}
                         className="flex-1"
                       >
                         {level}
                       </Button>
                    ))}
                 </div>
                 <p className="text-xs text-muted-foreground mt-2">Higher error correction creates denser codes but allows for logos/damage.</p>
              </div>
           </div>
        </div>

        {/* Preview Column */}
        <div className="bg-muted/10 p-6 rounded-xl border flex flex-col justify-between">
           <div className="flex-1 flex flex-col items-center justify-center min-h-[350px]">
             {isGenerating ? (
               <div className="flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                 <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                 <p>Building QR Matrix...</p>
               </div>
             ) : previewUrl ? (
               <div className="bg-white p-4 rounded-xl shadow-xl transform transition-all hover:scale-105" style={{ backgroundColor: lightColor }}>
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={previewUrl} alt="Generated QR Code" className="w-[280px] h-[280px] object-contain rounded-md" />
               </div>
             ) : (
               <div className="text-center p-8 border-2 border-dashed rounded-xl w-full max-w-[280px] aspect-square flex flex-col items-center justify-center">
                 <QrCode className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                 <p className="text-muted-foreground font-medium">Your preview will appear here</p>
                 <p className="text-xs text-muted-foreground mt-2 opacity-70">Type some text to get started</p>
               </div>
             )}
           </div>

           <div className="mt-8 space-y-4 pt-4 border-t border-border/50">
             <div className="flex gap-2 items-center mb-4">
                 <Label className="whitespace-nowrap mr-2">Export As:</Label>
                 <Button variant={format === "png" ? "secondary" : "ghost"} size="sm" onClick={() => setFormat("png")}>PNG</Button>
                 <Button variant={format === "jpeg" ? "secondary" : "ghost"} size="sm" onClick={() => setFormat("jpeg")}>JPG</Button>
             </div>
             <Button 
               size="lg" 
               className="w-full h-12" 
               disabled={!previewUrl || isGenerating}
               onClick={handleDownload}
             >
               <Download className="mr-2 h-5 w-5" /> Download QR Code
             </Button>
           </div>
        </div>

      </div>
    </ToolLayout>
  );
}
