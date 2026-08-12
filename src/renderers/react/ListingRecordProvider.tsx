import type { ReactNode } from 'react'
import type { ContentRecordId } from '../../domain'
import { ListingRecordContext } from './listing-record-context'

export function ListingRecordProvider({
  children,
  recordId,
}: {
  readonly children: ReactNode
  readonly recordId: ContentRecordId
}) {
  return <ListingRecordContext.Provider value={recordId}>{children}</ListingRecordContext.Provider>
}
