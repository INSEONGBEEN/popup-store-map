export function markArrivalOnce(arrivedStoreIds: Set<number>, storeId: number) {
  if (arrivedStoreIds.has(storeId)) return false
  arrivedStoreIds.add(storeId)
  return true
}
