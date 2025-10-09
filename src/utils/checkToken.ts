export function isTokenAlive(token: string): boolean {
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now + 10; // 10 секунд запас
  } catch {
    return false;
  }
}
