import { useState } from 'react';

function CollapsibleSection({ title, isOpen: defaultOpen = false, children, required = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 rounded-lg mb-4">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {title}
                    </h3>
                    {required && (
                        <span className="text-red-500 text-sm font-bold">*</span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'transform rotate-180' : ''
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="p-6 bg-white rounded-b-lg">
                    {children}
                </div>
            )}
        </div>
    );
}

export default CollapsibleSection;