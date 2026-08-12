import { createContext, useContext, type ReactNode } from 'react'
import type { ContentRecordId } from '../../domain'

const ListingRecordContext = createContext<ContentRecordId | null>(null)

export function ListingRecordProvider({
  children,
  recordId,
}: {
  readonly children: ReactNode
  readonly recordId: ContentRecordId
}) {
  return <ListingRecordContext.Provider value={recordId}>{children}</ListingRecordContext.Provider>
}

export function useListingRecordId(): ContentRecordId | undefined {
  return useContext(ListingRecordContext) ?? undefined
}
