export function baseSessionId(sessionId: string): string {
  const slashIdx = sessionId.indexOf("/");
  return slashIdx === -1 ? sessionId : sessionId.slice(0, slashIdx);
}
