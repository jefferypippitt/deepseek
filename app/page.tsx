import { Chatbot } from "@/components/Chatbot";
import { ChatHeader } from "@/components/ChatHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/80">
      <section className="w-full py-3 md:py-4 border-b border-border/10">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="w-full max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
              <div className="space-y-1">
                <Badge className="mb-1" variant="outline">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Advanced AI Assistant
                </Badge>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                  Experience the power of{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                    DeepSeek
                  </span>
                </h2>
              </div>
              <Button variant="link" asChild className="p-0 h-auto">
                <Link
                  href="https://www.prompt-kit.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Prompt-Kit <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 container max-w-5xl mx-auto px-4 pt-2 pb-4">
        <div className="w-full max-w-3xl mx-auto flex flex-col">
          <ChatHeader title="Chat" />
          <Chatbot />
        </div>
      </main>
    </div>
  );
}
