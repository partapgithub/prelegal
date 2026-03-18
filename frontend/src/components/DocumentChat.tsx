"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocFormData } from "@/lib/generateDocument";
import { DocConfig } from "@/lib/documentTypes";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DocumentChatProps {
  data: DocFormData;
  onChange: (data: DocFormData) => void;
  config: DocConfig;
}

function buildOpeningMessage(config: DocConfig): ChatMessage {
  return {
    role: "assistant",
    content: `Hi! I'll help you create a **${config.name}**. Let's start — can you briefly describe what this agreement is for? For example, the ${config.descriptionLabel}.`,
  };
}

export default function DocumentChat({ data, onChange, config }: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildOpeningMessage(config)]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latestDataRef = useRef(data);
  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setStreaming(true);
    setStreamingContent("");

    let fullReply = "";

    try {
      const response = await fetch("/api/chat/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: newHistory,
          fields: latestDataRef.current,
          docType: config.filename,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        const payload = line.slice(6).trim();
        if (!payload || payload === "[DONE]") return;
        try {
          const event = JSON.parse(payload);
          if (event.type === "text" && event.delta) {
            fullReply += event.delta;
            setStreamingContent(fullReply);
          } else if (event.type === "fields" && event.fields) {
            onChange({ ...latestDataRef.current, ...event.fields });
          } else if (event.type === "error") {
            fullReply = `Sorry, an error occurred: ${event.message}`;
            setStreamingContent(fullReply);
          }
        } catch {
          // ignore malformed SSE chunks
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer) processLine(buffer);
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) processLine(line);
      }

      if (fullReply) {
        setMessages((prev) => [...prev, { role: "assistant", content: fullReply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setStreaming(false);
      setStreamingContent("");
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <Bubble key={i} role={msg.role} content={msg.content} />
        ))}

        {streaming && streamingContent && (
          <Bubble role="assistant" content={streamingContent} isStreaming />
        )}

        {streaming && !streamingContent && (
          <div className="flex gap-1 pl-1 pt-1">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-2 h-2 bg-brand-blue rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white px-4 py-3 flex gap-2 items-end shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          rows={2}
          disabled={streaming}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={streaming || !input.trim()}
          className="bg-brand-purple hover:bg-[#5e2d73] disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer self-end"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function Bubble({
  role,
  content,
  isStreaming = false,
}: {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-brand-blue text-white rounded-br-sm"
            : "bg-gray-100 text-gray-800 rounded-bl-sm"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{content}</span>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {content}
          </ReactMarkdown>
        )}
        {isStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-gray-400 ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
