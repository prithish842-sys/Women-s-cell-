let applicationReady = false;

export function setApplicationReady(ready: boolean) {
  applicationReady = ready;
}

export function isApplicationReady() {
  return applicationReady;
}

export async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, timeoutMessage = 'Operation timed out') {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
