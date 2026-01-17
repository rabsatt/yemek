import EditEntryClient from './EditEntryClient'

// Required for static export with dynamic routes
// Returns empty array since entry IDs are dynamic and loaded at runtime
export function generateStaticParams() {
  return []
}

// Enable dynamic rendering for this page
export const dynamic = 'force-static'
export const dynamicParams = true

export default function EditEntryPage() {
  return <EditEntryClient />
}
