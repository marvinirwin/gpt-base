import React from 'react';
type LibraryListItem = {
    id: string;
    label: string;
};

interface LibraryListProps {
    items: LibraryListItem[];
    onClick: (id: string) => void;
    selectedItem: LibraryListItem | null;
}

export const LibraryList: React.FC<LibraryListProps> = ({ items, onClick, selectedItem }) => {
    return (
        <div className="flex flex-col space-y-2 col-span-3">
            {items.map((item) => (
                <button
                    key={item.id}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    onClick={() => onClick(item.id)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};
