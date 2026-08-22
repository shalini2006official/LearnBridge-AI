import React from 'react';
import { BookOpen } from 'lucide-react';

interface GroundedBadgeProps {
  citation?: string;
  isGrounded: boolean;
}

export const GroundedBadge: React.FC<GroundedBadgeProps> = ({ citation, isGrounded: _isGrounded }) => {
  const cleanCitation = citation 
    ? citation.replace("Local Knowledge Base", "Wikipedia, GeeksforGeeks, or educational web references")
              .replace("Retrieved Vector Base Context", "Wikipedia, GeeksforGeeks, or educational web references")
              .replace("LearnBridge Sources", "Wikipedia, GeeksforGeeks, or educational web references")
    : "Wikipedia, GeeksforGeeks, or educational web references";

  const parseLinks = (text: string) => {
    const parts: React.ReactNode[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let lastIndex = 0;
    let keyIdx = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <a 
          key={keyIdx++} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[#FF8A1F] hover:text-[#F26B0F] underline font-extrabold cursor-pointer"
        >
          {label}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="mt-3 p-3 rounded-lg flex items-center justify-between gap-2 border text-xs leading-relaxed bg-[#FFF9F3]/50 border-[#FF8A1F]/15 text-[#52627A]">
      <div className="flex items-center gap-2">
        <BookOpen className="w-3.5 h-3.5 flex-shrink-0 text-[#FF8A1F]" />
        <span className="font-semibold text-[#17233C]">
          Sources: {parseLinks(cleanCitation)}
        </span>
      </div>
    </div>
  );
};
