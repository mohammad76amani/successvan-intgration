"use client";

interface DefaultReportProps {
  reportName: string;
}

export default function DefaultReport({ reportName }: DefaultReportProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left px-4 py-3 text-gray-400 font-semibold">
              Date
            </th>
            <th className="text-left px-4 py-3 text-gray-400 font-semibold">
              Description
            </th>
            <th className="text-left px-4 py-3 text-gray-400 font-semibold">
              Value
            </th>
            <th className="text-left px-4 py-3 text-gray-400 font-semibold">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr
              key={i}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="px-4 py-3 text-white">
                {new Date(Date.now() - i * 86400000).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-gray-300">
                {reportName} Entry {i}
              </td>
              <td className="px-4 py-3 text-white font-semibold">
                {Math.floor(Math.random() * 1000)}
              </td>
              <td className="px-4 py-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                  Active
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
