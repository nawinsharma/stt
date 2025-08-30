"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";

type Props = {
  editor: Editor | null;
};

export default function EditorToolbar({ editor }: Props) {
  return (
    <div className="flex gap-2 items-center mb-3 overflow-x-auto whitespace-nowrap py-1">
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="Bold" title="Bold">
        <span className="font-bold">B</span>
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="Italic" title="Italic">
        <span className="italic">I</span>
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleUnderline().run()} aria-label="Underline" title="Underline">
        <span className="underline">U</span>
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleStrike().run()} aria-label="Strikethrough" title="Strikethrough">
        <span className="line-through">S</span>
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleHighlight().run()} aria-label="Highlight" title="Highlight">
        ✺
      </Button>
      <input
        type="color"
        className="h-9 w-10 rounded-md border bg-background text-foreground"
        onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
        title="Text color"
        aria-label="Text color"
      />
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label="Bulleted list" title="Bulleted list">
        ••
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label="Numbered list" title="Numbered list">
        1.
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBlockquote().run()} aria-label="Quote" title="Quote">
        " "
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} aria-label="Code block" title="Code block">
        <span className="font-mono text-sm">{`</>`}</span>
      </Button>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().setTextAlign("left").run()} aria-label="Align left" title="Align left">↤</Button>
        <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().setTextAlign("center").run()} aria-label="Align center" title="Align center">↔</Button>
        <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().setTextAlign("right").run()} aria-label="Align right" title="Align right">↦</Button>
        <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().setTextAlign("justify").run()} aria-label="Justify" title="Justify">☰</Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const url = window.prompt("Enter URL");
          if (!url) return;
          editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
        aria-label="Link"
        title="Link"
      >
        🔗
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().unsetLink().run()} aria-label="Unlink" title="Unlink">✖️</Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const src = window.prompt("Image URL");
          if (!src) return;
          editor?.chain().focus().setImage({ src }).run();
        }}
        aria-label="Image"
        title="Image"
      >
        🖼️
      </Button>
      <div className="h-6 w-px bg-border mx-1" />
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().setParagraph().run()} aria-label="Paragraph" title="Paragraph">¶</Button>
      <Button variant="outline" size="sm" onClick={() => applyHeading(editor, 1)} aria-label="Heading 1" title="Heading 1">H1</Button>
      <Button variant="outline" size="sm" onClick={() => applyHeading(editor, 2)} aria-label="Heading 2" title="Heading 2">H2</Button>
      <Button variant="outline" size="sm" onClick={() => applyHeading(editor, 3)} aria-label="Heading 3" title="Heading 3">H3</Button>
      <div className="h-6 w-px bg-border mx-1" />
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().undo().run()} aria-label="Undo" title="Undo">↶</Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().redo().run()} aria-label="Redo" title="Redo">↷</Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()} aria-label="Clear formatting" title="Clear formatting">⌫</Button>
    </div>
  );
}

function btn() {
  return "h-9 px-3 rounded-md border bg-background text-foreground hover:bg-secondary";
}

function applyHeading(editor: Editor | null, level: 1 | 2 | 3) {
  if (!editor) return;
  let chain = editor.chain().focus();
  if (editor.isActive('codeBlock')) chain = chain.toggleCodeBlock();
  if (editor.isActive('blockquote')) chain = chain.toggleBlockquote();
  if (editor.isActive('bulletList')) chain = chain.liftListItem('listItem');
  if (editor.isActive('orderedList')) chain = chain.liftListItem('listItem');
  chain = chain.setParagraph();
  chain.toggleHeading({ level }).run();
}


