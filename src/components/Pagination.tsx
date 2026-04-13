interface PaginationProps {
    totalItems: number;
    pageSize?: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

export function Pagination({
    totalItems,
    pageSize = 20,
    currentPage,
    onPageChange,
}: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return (
        <div className="mt-5 flex flex-col items-start justify-between gap-3 text-sm sm:flex-row sm:items-center">
            <p className="muted">
                Page {currentPage} of {totalPages}
            </p>
            <div className="flex w-full items-center gap-2 sm:w-auto">
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary flex-1 px-3 py-2 disabled:opacity-50 sm:flex-none"
                >
                    Previous
                </button>
                <button
                    type="button"
                    onClick={() =>
                        onPageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="btn-primary flex-1 px-3 py-2 disabled:opacity-50 sm:flex-none"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
