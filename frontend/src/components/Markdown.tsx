import React from 'react';

interface MarkdownProps {
  text: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ text }) => {
  if (!text) return null;

  // Simple and highly robust Regex-based Markdown parser to avoid peer dependency conflicts in React 19.
  const parseInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentText = line;
    let index = 0;

    // Matches **bold**, `code`, and [link](url)
    const regex = /(\*\*|`|\[)(.*?)(?:\1|\]\((.*?)\))/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(currentText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${index++}`}>{currentText.substring(lastIndex, match.index)}</span>);
      }

      const type = match[1];
      const content = match[2];
      const url = match[3];

      if (type === '**') {
        parts.push(<strong key={`bold-${index++}`} className="font-extrabold text-[#17233C]">{content}</strong>);
      } else if (type === '`') {
        parts.push(
          <code key={`code-${index++}`} className="bg-slate-100 dark:bg-slate-800 text-[#F26B0F] font-mono px-1.5 py-0.5 rounded text-[10px] border border-slate-200/50">
            {content}
          </code>
        );
      } else if (type === '[') {
        parts.push(
          <a 
            key={`link-${index++}`} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#FF8A1F] hover:text-[#F26B0F] underline font-extrabold cursor-pointer"
          >
            {content}
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < currentText.length) {
      parts.push(<span key={`text-${index++}`}>{currentText.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : [currentText];
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLang = '';
  let inList = false;
  let listItems: string[] = [];
  let listType: 'bullet' | 'number' = 'bullet';
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      const items = listItems.map((item, idx) => (
        <li key={idx} className="leading-relaxed">
          {parseInline(item)}
        </li>
      ));
      if (listType === 'bullet') {
        elements.push(<ul key={`list-${key}`} className="list-disc list-inside pl-4 mb-3 space-y-1 text-xs text-[#52627A] font-semibold">{items}</ul>);
      } else {
        elements.push(<ol key={`list-${key}`} className="list-decimal list-inside pl-4 mb-3 space-y-1 text-xs text-[#52627A] font-semibold">{items}</ol>);
      }
      listItems = [];
    }
    inList = false;
  };

  const flushTable = (key: number) => {
    if (tableRows.length > 0) {
      // Filter separator rows (e.g. |---|---|)
      const rows = tableRows.filter(row => !row.every(cell => /^[:-|-]+$/.test(cell.trim())));
      if (rows.length > 0) {
        const headers = rows[0];
        const bodyRows = rows.slice(1);
        elements.push(
          <div key={`table-wrapper-${key}`} className="overflow-x-auto my-3 rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-[#FFF9F3]">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="px-4 py-2 text-left font-black text-[#17233C] uppercase tracking-wider">{h.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-[#FFF9F3]/20 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-[#52627A] font-semibold">{parseInline(cell.trim())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        const codeText = codeContent.join('\n');
        elements.push(
          <div key={`code-block-${i}`} className="relative my-3 group">
            <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto shadow-sm border border-slate-800 leading-relaxed select-text">
              <code>{codeText}</code>
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(codeText)}
              className="absolute top-2.5 right-2.5 text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/60 transition-all cursor-pointer opacity-0 group-hover:opacity-100 shadow-sm"
            >
              Copy Code
            </button>
            {codeLang && (
              <span className="absolute bottom-2.5 right-3 text-[9px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
                {codeLang}
              </span>
            )}
          </div>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        // Open code block
        inCodeBlock = true;
        codeLang = line.trim().substring(3).trim();
        flushList(i);
        flushTable(i);
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Handle Tables
    if (line.trim().startsWith('|')) {
      flushList(i);
      inTable = true;
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Handle Headers
    if (line.trim().startsWith('#')) {
      flushList(i);
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headerText = match[2];
        if (level === 1) {
          elements.push(<h1 key={i} className="text-base md:text-lg font-black text-[#17233C] mt-4 mb-2 block">{parseInline(headerText)}</h1>);
        } else if (level === 2) {
          elements.push(<h2 key={i} className="text-sm md:text-base font-black text-[#F26B0F] mt-3 mb-1.5 block">{parseInline(headerText)}</h2>);
        } else {
          elements.push(<h3 key={i} className="text-xs md:text-sm font-extrabold text-[#17233C] mt-2 mb-1 block">{parseInline(headerText)}</h3>);
        }
        continue;
      }
    }

    // Handle Lists
    const bulletMatch = line.match(/^[\s]*[-*•]\s+(.*)$/);
    const numberMatch = line.match(/^[\s]*\d+\.\s+(.*)$/);

    if (bulletMatch) {
      if (!inList || listType !== 'bullet') {
        flushList(i);
        inList = true;
        listType = 'bullet';
      }
      listItems.push(bulletMatch[1]);
      continue;
    } else if (numberMatch) {
      if (!inList || listType !== 'number') {
        flushList(i);
        inList = true;
        listType = 'number';
      }
      listItems.push(numberMatch[1]);
      continue;
    } else if (inList) {
      flushList(i);
    }

    // Plain text / empty space
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2"></div>);
    } else {
      elements.push(
        <p key={i} className="text-xs text-[#52627A] leading-relaxed font-semibold block mb-2 select-text">
          {parseInline(line)}
        </p>
      );
    }
  }

  // Flush any leftover elements
  flushList(lines.length);
  flushTable(lines.length);

  return <div className="space-y-0.5">{elements}</div>;
};
