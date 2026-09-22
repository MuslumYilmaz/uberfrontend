// Robots path matching uses path + query, longest matching rule, Allow on a tie,
// * as a wildcard, and a trailing $ to match the end of the URL.
export function createRobotsPolicy(source, userAgent = 'googlebot') {
  const groups = [];
  let current = null, seenRules = false;
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.split('#', 1)[0].trim(), separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase(), value = line.slice(separator + 1).trim();
    if (key === 'user-agent') {
      if (!current || seenRules) { current = { agents: [], rules: [] }; groups.push(current); seenRules = false; }
      current.agents.push(value.toLowerCase());
    } else if (current && ['allow', 'disallow'].includes(key)) {
      seenRules = true;
      if (!value) continue;
      const terminal = value.endsWith('$'), pattern = terminal ? value.slice(0, -1) : value;
      const escaped = pattern.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      current.rules.push({ allow: key === 'allow', specificity: Buffer.byteLength(pattern.replaceAll('*', '')),
        matches: new RegExp(`^${escaped}${terminal ? '$' : ''}`) });
    }
  }
  const specific = groups.filter((group) => group.agents.some((agent) => agent !== '*' && userAgent.toLowerCase().includes(agent)));
  const selected = specific.length ? specific : groups.filter((group) => group.agents.includes('*'));
  const rules = selected.flatMap((group) => group.rules);
  return (pathWithQuery) => {
    let best = null;
    for (const rule of rules) {
      if (!rule.matches.test(pathWithQuery)) continue;
      if (!best || rule.specificity > best.specificity || (rule.specificity === best.specificity && rule.allow)) best = rule;
    }
    return best?.allow ?? true;
  };
}
