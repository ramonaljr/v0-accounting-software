export function TrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span>🔒</span>
        <span>Bank-grade security</span>
      </div>
      <span className="hidden sm:inline text-gray-300">•</span>
      <div className="flex items-center gap-2">
        <span>✓</span>
        <span>SOC2 ready</span>
      </div>
      <span className="hidden sm:inline text-gray-300">•</span>
      <div className="flex items-center gap-2">
        <span>🌍</span>
        <span>GDPR compliant</span>
      </div>
    </div>
  )
}
