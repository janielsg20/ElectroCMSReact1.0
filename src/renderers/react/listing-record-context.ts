import { createContext, useContext } from 'react'
import type { ContentRecordId } from '../../domain'

export const ListingRecordContext = createContext<ContentRecordId | null>(null)

export function useListingRecordId(): ContentRecordId | undefined {
  return useContext(ListingRecordContext) ?? undefined
}
