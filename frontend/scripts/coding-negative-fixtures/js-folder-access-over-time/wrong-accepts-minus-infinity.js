// Wrong: rejects NaN and Infinity but stores a change at -Infinity, which is not a finite number either.
// Fails: rejects an effect, a subject or a time it does not know, and stores nothing
export default function createPermissions({ folders, files, groups }) {
  const parentOf = new Map(folders.map((folder) => [folder.id, folder.parentId]));
  const folderOf = new Map(files.map((file) => [file.id, file.folderId]));
  const groupsOf = new Map();
  for (const [groupId, members] of Object.entries(groups)) {
    for (const userId of members) {
      if (!groupsOf.has(userId)) groupsOf.set(userId, []);
      groupsOf.get(userId).push(groupId);
    }
  }
  // folder id -> subject key -> changes sorted by time; at the same time, a later call comes after an earlier one.
  const history = new Map();
  // A subject has exactly one key, user or group, whose value is a string id.
  const keyOf = (subject) => {
    const keys = subject !== null && typeof subject === 'object' ? Reflect.ownKeys(subject) : [];
    const kind = keys.length === 1 ? keys[0] : undefined;
    const id = kind === undefined ? undefined : subject[kind];
    if ((kind !== 'user' && kind !== 'group') || typeof id !== 'string') {
      throw new TypeError('setRule: subject must be { user } or { group } with a string id');
    }
    return `${kind}:${id}`;
  };

  // The number of changes in `changes` made at or before `at`.
  const countUpTo = (changes, at) => {
    let low = 0;
    let high = changes.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (changes[mid].at <= at) low = mid + 1;
      else high = mid;
    }
    return low;
  };

  function setRule(folderId, subject, effect, at) {
    // A mistyped effect, subject or time must never become a rule: check all three before storing anything.
    if (effect !== 'allow' && effect !== 'deny' && effect !== null) throw new TypeError("setRule: effect must be 'allow', 'deny' or null");
    if (typeof at !== 'number' || Number.isNaN(at) || at === Infinity) throw new TypeError('setRule: at must be a finite number');
    const key = keyOf(subject);
    if (!history.has(folderId)) history.set(folderId, new Map());
    const bySubject = history.get(folderId);
    if (!bySubject.has(key)) bySubject.set(key, []);
    const changes = bySubject.get(key);
    changes.splice(countUpTo(changes, at), 0, { at, effect });
  }

  // The effect in force for one subject on one folder at `at`: 'allow', 'deny', or null for none.
  const effectAt = (folderId, key, at) => {
    const changes = history.get(folderId)?.get(key);
    if (!changes) return null;
    const count = countUpTo(changes, at);
    return count === 0 ? null : changes[count - 1].effect;
  };

  function canAccess(userId, fileId, at) {
    if (!folderOf.has(fileId)) return false;
    const groupKeys = (groupsOf.get(userId) ?? []).map((groupId) => `group:${groupId}`);
    for (let folderId = folderOf.get(fileId); folderId != null; folderId = parentOf.get(folderId)) {
      const own = effectAt(folderId, `user:${userId}`, at);
      if (own !== null) return own === 'allow';
      const fromGroups = groupKeys.map((key) => effectAt(folderId, key, at)).filter((effect) => effect !== null);
      if (fromGroups.length > 0) return !fromGroups.includes('deny');
    }
    return false;
  }

  return { setRule, canAccess };
}

