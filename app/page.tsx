import { Chatbot } from "@/components/Chatbot";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/80">
      <section className="w-full py-6 md:py-8 border-b border-border/10">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 space-y-3">
              <Badge className="mb-1" variant="outline">
                <Sparkles className="h-3 w-3 mr-1" />
                Advanced AI Assistant
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Experience the power of <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">DeepSeek</span>
              </h2>
            </div>
          </div>
        </div>
      </section>
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-4 md:py-6 flex items-start justify-center">
        <Chatbot />
      </main>
    </div>
  );
}
