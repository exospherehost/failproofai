/**
 * Shared pagination controls used by both the project list and session list.
 *
 * Renders Previous/Next buttons and a smart page-number strip that
 * collapses with ellipses when the total page count exceeds 7.
 */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) end = Math.min(5, totalPages - 1);
    if (currentPage >= totalPages - 2) start = Math.max(2, totalPages - 4);

    if (start > 2) pages.push("ellipsis-start");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("ellipsis-end");

    pages.push(totalPages);
    return pages;
  };

  const navBtnClass = (disabled: boolean) =>
    `px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-1 bg-muted text-muted-foreground ${
      disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/80"
    }`;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={navBtnClass(currentPage === 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page) =>
          typeof page === "string" ? (
            <span key={page} className="px-2 text-muted-foreground">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[2.5rem] px-3 py-2 text-sm rounded-md transition-colors ${
                currentPage === page
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={navBtnClass(currentPage === totalPages)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
