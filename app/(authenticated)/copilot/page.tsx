"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { processCoPilotQuery } from "@/features/copilot/actions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: {
    type: string;
    parameters: unknown;
    result?: unknown;
  };
  timestamp: Date;
}

const suggestedQueries = [
  "Show me last month's profit and loss",
  "What were my top 5 expenses this quarter?",
  "Show me overdue invoices",
  "Reconcile my bank account",
  "Categorize uncategorized transactions",
];

export default function CoPilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your AI accounting assistant. I can help you generate reports, reconcile accounts, categorize transactions, and answer questions about your finances. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (query?: string) => {
    const queryText = query || input.trim();
    if (!queryText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: queryText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await processCoPilotQuery({
        query: queryText,
        history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: ("message" in result ? result.message : undefined) || "Task completed successfully.",
          action: "action" in result ? result.action : undefined,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.error || "Sorry, I couldn't process your request.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("[CoPilot] Query error:", error);
      toast.error("An unexpected error occurred");
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          AI Co-Pilot
        </h1>
        <p className="text-muted-foreground mt-1">
          Your intelligent accounting assistant
        </p>
      </div>

      {/* Suggested Queries */}
      {messages.length === 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Try asking me:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(query)}
                  disabled={isLoading}
                >
                  {query}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>

                    {/* Action Card */}
                    {message.action && (
                      <div className="mt-3 p-3 rounded border border-border bg-background">
                        <div className="flex items-center gap-2 mb-2">
                          {message.action.result ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {message.action.type.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        </div>
                        {message.action.result !== undefined && (
                          <pre className="text-xs text-muted-foreground overflow-x-auto">
                            {String(JSON.stringify(message.action.result, null, 2))}
                          </pre>
                        )}
                      </div>
                    )}

                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input */}
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your finances..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
