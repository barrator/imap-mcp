/**
 * Recipient allowlist for forward_message, read from FORWARD_ALLOWLIST.
 *
 * Comma- or whitespace-separated entries, case-insensitive:
 *   - `alice@example.com` → that exact address
 *   - `example.com` or `@example.com` → any address at that domain
 *     (exact domain only: `sub.example.com` must be listed separately)
 *
 * An empty or unset variable denies every forward.
 */
function parseAllowlist(raw: string | undefined): { addresses: Set<string>; domains: Set<string> } {
  const addresses = new Set<string>();
  const domains = new Set<string>();
  for (const entry of (raw ?? "").split(/[\s,;]+/)) {
    const e = entry.trim().toLowerCase();
    if (!e) continue;
    const at = e.lastIndexOf("@");
    if (at > 0) addresses.add(e);
    else if (at === 0) {
      if (e.length > 1) domains.add(e.slice(1));
    } else domains.add(e);
  }
  return { addresses, domains };
}

/** Returns the recipients that FORWARD_ALLOWLIST does not permit. */
export function disallowedForwardRecipients(recipients: string[]): string[] {
  const { addresses, domains } = parseAllowlist(process.env.FORWARD_ALLOWLIST);
  return recipients.filter((r) => {
    const addr = r.trim().toLowerCase();
    if (addresses.has(addr)) return false;
    const at = addr.lastIndexOf("@");
    return at < 0 || !domains.has(addr.slice(at + 1));
  });
}
