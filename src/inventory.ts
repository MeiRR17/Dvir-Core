export type RepoObservation = {
  owner: string;
  name: string;
  archived: boolean;
};
export type Page = { repositories: readonly RepoObservation[]; complete: boolean };
export type Summary = {
  coverage: 'complete' | 'partial';
  personal: number;
  archived: number;
  active: number;
};

// Return counts only. The raw inventory stays with the authorized caller.
export function summarizeInventory(owner: string, pages: readonly Page[]): Summary {
  if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(owner)) throw new Error('Invalid owner');
  const records = new Map<string, boolean>();
  let complete = false;
  for (const page of pages) {
    if (complete) throw new Error('Page after terminal page');
    if (typeof page.complete !== 'boolean') throw new Error('Invalid page');
    for (const repo of page.repositories) {
      if (typeof repo.owner !== 'string') throw new Error('Invalid owner observation');
      if (repo.owner.toLowerCase() !== owner.toLowerCase()) continue;
      if (!/^[a-z\d_.-]{1,100}$/i.test(repo.name) || typeof repo.archived !== 'boolean') {
        throw new Error('Invalid repository observation');
      }
      const key = repo.name.toLowerCase();
      const previous = records.get(key);
      if (previous !== undefined && previous !== repo.archived) throw new Error('Conflicting observation');
      records.set(key, repo.archived);
    }
    complete = page.complete;
  }
  const archived = [...records.values()].filter(Boolean).length;
  return { coverage: complete ? 'complete' : 'partial', personal: records.size, archived, active: records.size - archived };
}
