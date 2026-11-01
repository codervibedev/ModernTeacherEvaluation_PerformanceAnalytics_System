export default function AdminPlaceholder({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0c2a5e]">{title}</h1>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <div className="mt-6 bg-white border border-blue-100 rounded-xl p-10 text-center text-sm text-gray-500">
        Coming soon. Gagawin ito sa susunod na phase.
      </div>
    </div>
  )
}