interface PaginationProps {
    totalItems: number;
    pageSize?: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ totalItems, pageSize = 20, currentPage, onPageChange }: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalPages <= 1) return null;

    return (
        <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8125rem" }}>
            <p className="muted">Page {currentPage} of {totalPages}</p>
            <div style={{ display: "flex", gap: 8 }}>
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary"
                    style={{ padding: "0.4rem 0.75rem" }}
                >Prev</button>
                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-primary"
                    style={{ padding: "0.4rem 0.75rem" }}
                >Next</button>
            </div>
        </div>
    );
}
