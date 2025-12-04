'use client'

export function CustomReportsTable() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Report name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Created by
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Date range
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm text-gray-600">
                    Reports that you customize and then save will be listed here. Click &apos;Save
                    Customizations&apos; at the top of the report.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                    <button className="hover:text-gray-700">First</button>
                    <button className="hover:text-gray-700">Previous</button>
                    <span>0 - 0</span>
                    <button className="hover:text-gray-700">Next</button>
                    <button className="hover:text-gray-700">Last</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
