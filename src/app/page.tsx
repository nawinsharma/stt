"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Document, Packer, Paragraph, TextRun } from "docx";
import ThemeToggle from "@/lib/ThemeToggle";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import EditorToolbar from "@/lib/EditorToolbar";

export default function Home() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isFixing, setIsFixing] = useState<boolean>(false);
  const [hasContent, setHasContent] = useState<boolean>(false);

  const baselineTextRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      Color,
      TextStyle,
      Underline,
      Highlight,
      Link.configure({ autolink: true, openOnClick: true, linkOnPaste: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Placeholder.configure({ placeholder: "Start speaking or type to transcribe…" }),
      CharacterCount,
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: "<p>Start speaking to transcribe…</p>",
    autofocus: "end",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap prose max-w-none w-full min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh] p-4 rounded-md border bg-card text-card-foreground focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      const text = editor.getText().trim();
      setHasContent(text.length > 0);
    },
    onCreate({ editor }) {
      const text = editor.getText().trim();
      setHasContent(text.length > 0);
    },
  });

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isFixing);
  }, [editor, isFixing]);
  useEffect(() => {
    if (!editor) return;
    if (!isListening) return;
    const text = [baselineTextRef.current, transcript].filter(Boolean).join(" ").trim();
    const currentText = editor.getText();
    if (text !== currentText) {
      editor.commands.setContent(`<p>${escapeHtml(text).replace(/\n/g, "<br/>")}</p>`);
      editor.commands.focus("end");
    }
  }, [transcript, isListening, editor]);

  const startListening = useCallback(async () => {
    if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable) return;
    if (!editor) return;
    baselineTextRef.current = editor.getText();
    resetTranscript();
    setIsListening(true);
    await SpeechRecognition.startListening({ continuous: true, language: "en-US", interimResults: true });
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable, editor, resetTranscript]);

  const stopListening = useCallback(async () => {
    setIsListening(false);
    await SpeechRecognition.stopListening();
  }, []);

  const clearAll = useCallback(() => {
    baselineTextRef.current = "";
    resetTranscript();
    editor?.commands.setContent("<p></p>");
    setHasContent(false);
  }, [editor, resetTranscript]);

  const exportPdf = useCallback(async () => {
    if (!editor) return;
    const text = editor.getText();
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;

    const lines = doc.splitTextToSize(text || "", maxWidth);
    let cursorY = margin;
    const lineHeight = 16;

    doc.setFont("Times", "Normal");
    doc.setFontSize(12);

    for (const line of lines) {
      if (cursorY + lineHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    }

    doc.save("transcript.pdf");
  }, [editor]);

  const exportDocx = useCallback(async () => {
    if (!editor) return;
    const text = editor.getText();

    const paragraphs = text.split("\n").map((line) =>
      new Paragraph({
        children: [new TextRun({ text: line })],
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs.length ? paragraphs : [new Paragraph("")],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "transcript.docx");
  }, [editor]);

  const applyGrammarFix = useCallback(async () => {
    if (!editor) return;
    const current = editor.getText();
    if (!current.trim()) return;
    try {
      setIsFixing(true);
      const res = await fetch("/api/grammar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: current }) });
      const data = await res.json();
      const corrected: string = (data?.text as string) ?? current;
      const safeText = (corrected || "").trim() || current;
      editor.commands.setContent(`<p>${escapeHtml(safeText).replace(/\n/g, "<br/>")}</p>`);
      editor.commands.focus("end");
    } finally {
      setIsFixing(false);
    }
  }, [editor]);

  const toolbar = useMemo(() => <EditorToolbar editor={editor} />, [editor]);

  return (
    <div className="min-h-dvh w-full flex flex-col justify-start p-3 sm:p-6">
      <div className="w-full flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4 sm:mb-6">
        <h1 className="text-xl font-semibold">Speech → text</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={exportPdf}>Export PDF</Button>
          <Button variant="outline" size="sm" onClick={exportDocx}>Export DOCX</Button>
        </div>
      </div>

      <div className="w-full flex-1">
        {toolbar}
        <div className="rounded-md border w-full relative">
          <EditorContent editor={editor} />
          {isFixing ? (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-md">
              <span className="text-sm text-muted-foreground">Fixing…</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <Button variant="outline" onClick={startListening} disabled={isListening || !browserSupportsSpeechRecognition || !isMicrophoneAvailable}>{isListening ? "Listening…" : "Start"}</Button>
          <Button variant="outline" onClick={stopListening} disabled={!isListening}>Stop</Button>
          <Button variant="outline" onClick={clearAll}>Reset</Button>
          {hasContent ? (
            <Button onClick={applyGrammarFix} disabled={isFixing}>
              {isFixing ? "Fixing…" : "Fix Grammar"}
            </Button>
          ) : null}
          <StatusBadge
            ok={browserSupportsSpeechRecognition && isMicrophoneAvailable}
            listening={listening}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ ok, listening }: { ok: boolean; listening: boolean }) {
  const label = !ok ? "Mic unavailable" : listening ? "Listening" : "Idle";
  const tone = !ok ? "bg-destructive text-white" : listening ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground";
  return (
    <span className={`text-xs px-2 py-1 rounded ${tone}`}>{label}</span>
  );
}

function escapeHtml(input: string): string {
  return input
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/"/g, "&quot;")
    .replaceAll(/'/g, "&#039;");
}
