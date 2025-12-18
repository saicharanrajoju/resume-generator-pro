import React from 'react';

const PRICING = {
    // Claude 3.5 Sonnet pricing (approximate)
    INPUT_PER_1K: 0.003,
    OUTPUT_PER_1K: 0.015
};

// Data provided by user from billing console
const LEGACY_HISTORY = [
    { timestamp: '2025-12-18T00:00:00.000Z', input_tokens: 6419, output_tokens: 2000, model: 'claude-sonnet-4-20250514' },
    { timestamp: '2025-12-17T00:00:00.000Z', input_tokens: 62061, output_tokens: 25941, model: 'claude-sonnet-4-20250514' },
    { timestamp: '2025-12-16T00:00:00.000Z', input_tokens: 39790, output_tokens: 19226, model: 'claude-sonnet-4-20250514' },
    { timestamp: '2025-12-04T00:00:00.000Z', input_tokens: 4739, output_tokens: 4068, model: 'claude-sonnet-4-20250514' },
    { timestamp: '2025-12-03T00:00:00.000Z', input_tokens: 6556, output_tokens: 4058, model: 'claude-sonnet-4-20250514' }
];

function UsageTracker({ usageHistory, onClose }) {
    // Combine real-time history with legacy history
    const allHistory = [...usageHistory, ...LEGACY_HISTORY];

    const totalUsage = allHistory.reduce((acc, curr) => ({
        input: acc.input + (curr.input_tokens || 0),
        output: acc.output + (curr.output_tokens || 0),
        count: acc.count + 1
    }), {
        input: 0,
        output: 0,
        count: 0
    });

    const totalCost = (
        (totalUsage.input / 1000 * PRICING.INPUT_PER_1K) +
        (totalUsage.output / 1000 * PRICING.OUTPUT_PER_1K)
    );

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    📊 Token Usage Analytics
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium mb-1">Total Estimated Cost</p>
                    <p className="text-2xl font-bold text-blue-900">
                        ${totalCost.toFixed(4)}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                        Based on Claude 3.5 Sonnet pricing
                    </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium mb-1">Total Generations</p>
                    <p className="text-2xl font-bold text-purple-900">
                        {totalUsage.count}
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Tokens</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {(totalUsage.input + totalUsage.output).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        In: {totalUsage.input.toLocaleString()} | Out: {totalUsage.output.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <h4 className="font-semibold text-gray-700 mb-3">Recent Activity</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-gray-600">Date</th>
                                <th className="px-4 py-2 text-right text-gray-600">Input</th>
                                <th className="px-4 py-2 text-right text-gray-600">Output</th>
                                <th className="px-4 py-2 text-right text-gray-600">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {allHistory.slice(0, 10).map((entry, i) => {
                                const cost = (
                                    (entry.input_tokens / 1000 * PRICING.INPUT_PER_1K) +
                                    (entry.output_tokens / 1000 * PRICING.OUTPUT_PER_1K)
                                );
                                return (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-gray-600">
                                            {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-gray-700">{entry.input_tokens.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right font-mono text-gray-700">{entry.output_tokens.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right font-mono text-green-600">${cost.toFixed(4)}</td>
                                    </tr>
                                );
                            })}
                            {usageHistory.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                                        No usage history yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default UsageTracker;
