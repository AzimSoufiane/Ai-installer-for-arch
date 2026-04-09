/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Terminal, 
  Cpu, 
  Zap, 
  Copy, 
  Check, 
  Download, 
  Shield, 
  Info,
  ChevronRight,
  Settings,
  HardDrive,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Hardware = "cpu" | "nvidia" | "amd" | "intel";
type Model = 
  | "phi-3.5-mini" 
  | "phi-3.5-moe" 
  | "phi-3.5-vision" 
  | "phi-3-mini" 
  | "phi-3-small" 
  | "phi-3-medium";
type Tool = "ollama" | "llama-cpp";

export default function App() {
  const [hardware, setHardware] = useState<Hardware>("cpu");
  const [model, setModel] = useState<Model>("phi-3.5-mini");
  const [tool, setTool] = useState<Tool>("ollama");
  const [quant, setQuant] = useState("q4_k_m");
  const [copied, setCopied] = useState(false);
  const [showAur, setShowAur] = useState(true);

  const generateScript = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    let script = `#!/bin/bash\n\n`;
    script += `# Phi-3 Arch Setup Script - Generated on ${new Date().toLocaleDateString()}\n`;
    script += `# Hardware: ${hardware.toUpperCase()} | Model: ${model} | Tool: ${tool}\n\n`;

    script += `set -e\n\n`;
    script += `echo "🚀 Starting Phi-3 setup for Arch Linux..."\n\n`;

    // System Update
    script += `# 1. Update System\n`;
    script += `echo "📦 Updating system packages..."\n`;
    script += `sudo pacman -Syu --noconfirm\n\n`;

    // Dependencies
    script += `# 2. Install Dependencies\n`;
    script += `echo "🛠️ Installing base dependencies..."\n`;
    const baseDeps = ["git", "base-devel", "cmake", "wget", "curl"];
    script += `sudo pacman -S --needed --noconfirm ${baseDeps.join(" ")}\n\n`;

    if (showAur) {
      script += `# 3. Install AUR Helper (yay)\n`;
      script += `if ! command -v yay &> /dev/null; then\n`;
      script += `    echo "✨ Installing yay (AUR helper)..."\n`;
      script += `    git clone https://aur.archlinux.org/yay.git /tmp/yay\n`;
      script += `    cd /tmp/yay && makepkg -si --noconfirm && cd -\n`;
      script += `fi\n\n`;
    }

    // Hardware specific drivers
    script += `# 4. Hardware Specific Drivers\n`;
    if (hardware === "nvidia") {
      script += `echo "🎮 Installing NVIDIA drivers and CUDA..."\n`;
      script += `sudo pacman -S --needed --noconfirm nvidia nvidia-utils cuda cudnn\n`;
    } else if (hardware === "amd") {
      script += `echo "🔴 Installing AMD ROCm drivers..."\n`;
      script += `sudo pacman -S --needed --noconfirm rocm-hip-sdk rocm-opencl-runtime\n`;
    } else if (hardware === "intel") {
      script += `echo "🔵 Installing Intel OneAPI/OpenVINO dependencies..."\n`;
      script += `sudo pacman -S --needed --noconfirm intel-compute-runtime\n`;
    } else {
      script += `echo "💻 Using CPU only mode..."\n`;
    }
    script += `\n`;

    // Tool installation
    script += `# 5. Install ${tool === "ollama" ? "Ollama" : "llama.cpp"}\n`;
    if (tool === "ollama") {
      script += `echo "🦙 Installing Ollama..."\n`;
      script += `sudo pacman -S --needed --noconfirm ollama\n`;
      script += `sudo systemctl enable --now ollama\n\n`;
      
      script += `# 6. Pull Model\n`;
      let ollamaModel = "phi3.5";
      if (model === "phi-3.5-moe") ollamaModel = "phi3.5:moe";
      else if (model === "phi-3.5-vision") ollamaModel = "phi3.5:vision";
      else if (model === "phi-3-mini") ollamaModel = "phi3";
      else if (model === "phi-3-small") ollamaModel = "phi3:small";
      else if (model === "phi-3-medium") ollamaModel = "phi3:medium";

      script += `echo "📥 Pulling ${model} (${quant})..."\n`;
      script += `ollama pull ${ollamaModel}\n`;
    } else {
      script += `echo "🏗️ Building llama.cpp from source..."\n`;
      script += `mkdir -p ~/ai && cd ~/ai\n`;
      script += `if [ ! -d "llama.cpp" ]; then\n`;
      script += `    git clone https://github.com/ggerganov/llama.cpp\n`;
      script += `fi\n`;
      script += `cd llama.cpp\n`;
      
      let buildFlags = "";
      if (hardware === "nvidia") buildFlags = "-DGGML_CUDA=ON";
      else if (hardware === "amd") buildFlags = "-DGGML_HIPBLAS=ON";
      
      script += `cmake -B build ${buildFlags}\n`;
      script += `cmake --build build --config Release -j $(nproc)\n\n`;

      script += `# 6. Download Model\n`;
      let modelUrl = "";
      switch (model) {
        case "phi-3.5-mini":
          modelUrl = "https://huggingface.co/microsoft/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-q4_k_m.gguf";
          break;
        case "phi-3.5-moe":
          modelUrl = "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct-GGUF/resolve/main/Phi-3.5-MoE-instruct-Q4_K_M.gguf";
          break;
        case "phi-3.5-vision":
          modelUrl = "https://huggingface.co/microsoft/Phi-3.5-vision-instruct-GGUF/resolve/main/Phi-3.5-vision-instruct-Q4_K_M.gguf";
          break;
        case "phi-3-mini":
          modelUrl = "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4_k_m.gguf";
          break;
        case "phi-3-small":
          modelUrl = "https://huggingface.co/microsoft/Phi-3-small-8k-instruct-GGUF/resolve/main/Phi-3-small-8k-instruct-Q4_K_M.gguf";
          break;
        case "phi-3-medium":
          modelUrl = "https://huggingface.co/microsoft/Phi-3-medium-4k-instruct-GGUF/resolve/main/Phi-3-medium-4k-instruct-Q4_K_M.gguf";
          break;
      }
      
      script += `mkdir -p models\n`;
      script += `echo "📥 Downloading ${model}..."\n`;
      script += `wget -O models/${model}-${quant}.gguf ${modelUrl}\n`;
    }

    script += `\necho "✅ Setup complete! You can now run the model."\n`;
    if (tool === "ollama") {
      let runModel = "phi3.5";
      if (model === "phi-3.5-moe") runModel = "phi3.5:moe";
      else if (model === "phi-3.5-vision") runModel = "phi3.5:vision";
      else if (model === "phi-3-mini") runModel = "phi3";
      else if (model === "phi-3-small") runModel = "phi3:small";
      else if (model === "phi-3-medium") runModel = "phi3:medium";
      script += `echo "Run: ollama run ${runModel}"\n`;
    } else {
      script += `echo "Run: ./build/bin/llama-cli -m models/${model}-${quant}.gguf -p 'You are a helpful assistant.'"\n`;
    }

    return script;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generateScript()], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `setup-phi3-${hardware}.sh`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Terminal className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Phi-3 Arch Wizard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-zinc-800/50 border-zinc-700 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
              v1.0.0-stable
            </Badge>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
          
          {/* Left Column: Configuration */}
          <div className="space-y-10">
            <header className="space-y-4">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold tracking-tight lg:text-5xl bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent"
              >
                Deploy Phi-3 on Arch Linux
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-zinc-400 text-lg max-w-2xl leading-relaxed"
              >
                Generate a production-ready shell script optimized for your hardware. 
                Automate dependencies, drivers, and model deployment in one command.
              </motion.p>
            </header>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Hardware Selection */}
              <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    Hardware Acceleration
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Select your GPU or compute backend</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "cpu", label: "CPU Only", icon: Cpu },
                      { id: "nvidia", label: "NVIDIA CUDA", icon: Zap },
                      { id: "amd", label: "AMD ROCm", icon: Monitor },
                      { id: "intel", label: "Intel iGPU/dGPU", icon: HardDrive },
                    ].map((hw) => (
                      <Button
                        key={hw.id}
                        variant={hardware === hw.id ? "default" : "outline"}
                        className={`h-20 flex-col gap-2 border-zinc-800 ${hardware === hw.id ? "" : "hover:bg-zinc-800/50"}`}
                        onClick={() => setHardware(hw.id as Hardware)}
                      >
                        <hw.icon className="w-5 h-5" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">{hw.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Model & Tool Selection */}
              <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    Model Configuration
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Choose model version and runtime</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Model Version</Label>
                    <Select value={model} onValueChange={(v) => setModel(v as Model)}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800">
                        <SelectItem value="phi-3.5-mini">Phi-3.5 Mini (3.8B)</SelectItem>
                        <SelectItem value="phi-3.5-moe">Phi-3.5 MoE (42B)</SelectItem>
                        <SelectItem value="phi-3.5-vision">Phi-3.5 Vision (4.2B)</SelectItem>
                        <SelectItem value="phi-3-mini">Phi-3 Mini (3.8B)</SelectItem>
                        <SelectItem value="phi-3-small">Phi-3 Small (7B)</SelectItem>
                        <SelectItem value="phi-3-medium">Phi-3 Medium (14B)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Runtime Tool</Label>
                    <Tabs value={tool} onValueChange={(v) => setTool(v as Tool)} className="w-full">
                      <TabsList className="grid grid-cols-2 bg-zinc-950 border border-zinc-800 p-1">
                        <TabsTrigger value="ollama" className="data-[state=active]:bg-zinc-800">Ollama</TabsTrigger>
                        <TabsTrigger value="llama-cpp" className="data-[state=active]:bg-zinc-800">llama.cpp</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Options */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Advanced Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-8">
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Auto-install yay</Label>
                    <p className="text-[10px] text-zinc-500">Install AUR helper if missing</p>
                  </div>
                  <Switch checked={showAur} onCheckedChange={setShowAur} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Quantization</Label>
                    <p className="text-[10px] text-zinc-500">Current: {quant}</p>
                  </div>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Q4_K_M</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview */}
          <div className="sticky top-28 space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl overflow-hidden">
              <CardHeader className="bg-zinc-950/50 border-b border-zinc-800 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400">setup-phi3.sh</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                      onClick={handleCopy}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] w-full bg-zinc-950 p-6 font-mono text-[13px] leading-relaxed text-zinc-300">
                  <pre className="whitespace-pre-wrap">
                    {generateScript()}
                  </pre>
                </ScrollArea>
              </CardContent>
              <CardFooter className="bg-zinc-950/50 border-t border-zinc-800 py-4 flex flex-col gap-4">
                <div className="flex items-start gap-3 text-xs text-zinc-500">
                  <Shield className="w-4 h-4 mt-0.5 text-primary/50" />
                  <p>
                    Ensure you have <code className="text-zinc-300">sudo</code> privileges. 
                    This script will modify system packages and drivers.
                  </p>
                </div>
                <Button className="w-full gap-2 group" onClick={handleDownload}>
                  Download Installer
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-primary">Pro Tip</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  For NVIDIA users, ensure you have <code className="text-zinc-300">nvidia-container-toolkit</code> installed if you plan to use Docker later.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Terminal className="w-4 h-4" />
            <span>Built for the Arch Linux Community</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-zinc-100 transition-colors">Documentation</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">GitHub</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
