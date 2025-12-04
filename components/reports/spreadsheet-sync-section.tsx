'use client'

import { Button } from '@/components/ui/button'

export function SpreadsheetSyncSection() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="max-w-4xl bg-gray-50 rounded-lg p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Get deeper insights with
                <br />
                Spreadsheet Sync
              </h2>
              <p className="text-gray-700 mb-6">
                Securely send data back and forth between Accunza and your spreadsheet for
                up-to-date data and custom insights.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#D4AF37] mt-2"></span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create reports the way you want</h3>
                    <p className="text-sm text-gray-600">
                      Use spreadsheets to create custom charts and graphs using data from Accunza.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#D4AF37] mt-2"></span>
                  <div>
                    <h3 className="font-semibold text-gray-900">A 2-way sync</h3>
                    <p className="text-sm text-gray-600">
                      Add and edit data in bulk in a spreadsheet, and sync it with Accunza.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#D4AF37] mt-2"></span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Run multi-company reports in spreadsheets
                    </h3>
                    <p className="text-sm text-gray-600">
                      Group companies and run consolidated reports in spreadsheets.
                    </p>
                  </div>
                </li>
              </ul>
              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Run report in Excel
                </Button>
                <Button
                  variant="outline"
                  className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Run report in Google Sheets
                </Button>
              </div>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:underline mt-4"
              >
                Video tutorials
              </a>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-64 bg-white rounded-lg shadow-xl border border-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
