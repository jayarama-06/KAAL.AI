/**
 * MessageRenderer — Renders Gemini AI responses with beautiful typography.
 *
 * Handles the markdown Gemini naturally produces:
 * - **bold** / *italic*
 * - # headings (h2/h3 only — h1 is too loud for chat)
 * - - bullet lists / 1. numbered lists
 * - `inline code`
 * - > blockquotes
 * - Paragraph breaks (double newline)
 *
 * Design: matches KAAL's glass-morphism system (no random colors, no clutter).
 */

import React, { memo } from 'react';

interface Props {
  text:    string;
  color?:  string;   // text color (default #111827)
  isUser?: boolean;  // user bubbles get simpler rendering
  /** streaming cursor: if true and text doesn't end with cursor, show one */
  streaming?: boolean;
}

// ─── Inline markdown (bold, italic, code) ────────────────────────────────────

function renderInline(text: string, key: string | number, userMsg = false): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, `code`, and plain text
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    if (m[2] !== undefined) {
      parts.push(
        <strong key={`b-${m.index}`} style={{ fontWeight: 700, color: userMsg ? 'rgba(255,255,255,0.98)' : '#0F172A' }}>
          {m[2]}
        </strong>
      );
    } else if (m[3] !== undefined) {
      parts.push(
        <em key={`i-${m.index}`} style={{ fontStyle: 'italic', opacity: 0.85 }}>
          {m[3]}
        </em>
      );
    } else if (m[4] !== undefined) {
      parts.push(
        <code
          key={`c-${m.index}`}
          className="px-1.5 py-0.5 rounded-md text-[11px]"
          style={{
            fontFamily:  'var(--font-mono)',
            background:  userMsg ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.08)',
            color:       userMsg ? 'rgba(255,255,255,0.9)' : '#4F46E5',
            border:      `1px solid ${userMsg ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.2)'}`,
          }}
        >
          {m[4]}
        </code>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <span key={key}>{parts}</span>;
}

// ─── Block-level parser ───────────────────────────────────────────────────────

interface Block {
  type:     'paragraph' | 'heading2' | 'heading3' | 'bullet_list' | 'numbered_list' | 'blockquote' | 'divider';
  content?: string;
  items?:   string[];
}

function parseBlocks(raw: string): Block[] {
  const lines  = raw.split('\n');
  const blocks: Block[] = [];
  let   i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    // Skip blank lines
    if (line.trim() === '') { i++; continue; }

    // Divider
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // Heading 2  ##
    if (/^#{2}\s+/.test(line)) {
      blocks.push({ type: 'heading2', content: line.replace(/^#{2}\s+/, '') });
      i++;
      continue;
    }

    // Heading 3  ###
    if (/^#{3}\s+/.test(line)) {
      blocks.push({ type: 'heading3', content: line.replace(/^#{3}\s+/, '') });
      i++;
      continue;
    }

    // Heading 1 → treat as heading 2 (h1 is too loud in chat)
    if (/^#{1}\s+/.test(line)) {
      blocks.push({ type: 'heading2', content: line.replace(/^#{1}\s+/, '') });
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      blocks.push({ type: 'blockquote', content: line.replace(/^>\s?/, '') });
      i++;
      continue;
    }

    // Bullet list  - item  or  * item  or  • item
    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'bullet_list', items });
      continue;
    }

    // Numbered list  1. item
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'numbered_list', items });
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^[-*•\d>]/.test(lines[i]) &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paraLines.join(' ') });
    }
  }

  return blocks;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MessageRenderer = memo(function MessageRenderer({
  text,
  color  = '#111827',
  isUser = false,
  streaming = false,
}: Props) {
  if (!text) return null;

  // User messages: simple rendering, no markdown parsing
  if (isUser) {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap"
         style={{ color: 'rgba(255,255,255,0.93)', maxWidth: 'none' }}>
        {text}
      </p>
    );
  }

  const blocks = parseBlocks(text);

  return (
    <div className="space-y-2.5" style={{ maxWidth: 'none' }}>
      {blocks.map((block, bi) => {
        const isLast = bi === blocks.length - 1;

        switch (block.type) {
          case 'heading2':
            return (
              <p key={bi}
                 className="text-sm font-bold mt-3 mb-1"
                 style={{ color, fontFamily: 'var(--font-display)', letterSpacing: '0.01em' }}>
                {block.content}
              </p>
            );

          case 'heading3':
            return (
              <p key={bi}
                 className="text-xs font-bold uppercase tracking-widest mt-2.5 mb-1"
                 style={{ color: '#6B7280', fontFamily: 'var(--font-display)' }}>
                {block.content}
              </p>
            );

          case 'blockquote':
            return (
              <div key={bi}
                   className="border-l-2 pl-3 my-1"
                   style={{ borderColor: 'rgba(99,102,241,0.4)' }}>
                <p className="text-sm italic" style={{ color: '#6B7280' }}>
                  {renderInline(block.content ?? '', bi)}
                </p>
              </div>
            );

          case 'bullet_list':
            return (
              <ul key={bi} className="space-y-1.5 my-0.5">
                {(block.items ?? []).map((item, ii) => (
                  <li key={ii} className="flex items-start gap-2.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: 'rgba(99,102,241,0.5)' }}
                    />
                    <span className="text-sm leading-relaxed flex-1" style={{ color }}>
                      {renderInline(item, ii)}
                    </span>
                  </li>
                ))}
              </ul>
            );

          case 'numbered_list':
            return (
              <ol key={bi} className="space-y-1.5 my-0.5">
                {(block.items ?? []).map((item, ii) => (
                  <li key={ii} className="flex items-start gap-2.5">
                    <span
                      className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                      style={{
                        background:  'rgba(99,102,241,0.08)',
                        border:      '1px solid rgba(99,102,241,0.18)',
                        color:       '#6366F1',
                        fontFamily:  'var(--font-display)',
                      }}
                    >
                      {ii + 1}
                    </span>
                    <span className="text-sm leading-relaxed flex-1" style={{ color }}>
                      {renderInline(item, ii)}
                    </span>
                  </li>
                ))}
              </ol>
            );

          case 'divider':
            return (
              <hr key={bi}
                  className="my-1 border-0 h-px"
                  style={{ background: 'rgba(0,0,0,0.06)' }} />
            );

          case 'paragraph':
          default:
            return (
              <p key={bi}
                 className="text-sm leading-relaxed"
                 style={{ color, maxWidth: 'none' }}>
                {renderInline(block.content ?? '', bi)}
                {/* Streaming cursor on last paragraph */}
                {streaming && isLast && (
                  <span
                    className="inline-block w-0.5 h-3.5 ml-0.5 align-middle animate-pulse rounded-full"
                    style={{ background: '#9CA3AF' }}
                  />
                )}
              </p>
            );
        }
      })}
    </div>
  );
});