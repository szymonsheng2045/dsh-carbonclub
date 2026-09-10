// A timeout releases the UI, not the Host operation. Never retry a mutation
// automatically: it may have succeeded just before its response was lost.
export async function boundedRequest<T>(request: Promise<T>, timeoutMs = 20_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([request, new Promise<never>((_, reject) => {
      timer = setTimeout(() => { reject(new Error('HOST_REQUEST_TIMEOUT')) }, timeoutMs)
    })])
  } finally { if (timer !== undefined) clearTimeout(timer) }
}
