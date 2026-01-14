export type TopicDefinition = {
    id: string;
    title: string;
    tags: string[];
};

export type TopicsRegistry = {
    schemaVersion: 1;
    topics: TopicDefinition[];
};

const TOPIC_REGISTRY_ASSET_URL = 'assets/questions/topic-registry.json';

let cachedTopics: TopicsRegistry | null = null;

export async function loadTopics(): Promise<TopicsRegistry> {
    if (cachedTopics) return cachedTopics;

    try {
        const res = await fetch(TOPIC_REGISTRY_ASSET_URL);
        if (!res.ok) {
            throw new Error(
                `Failed to load topic registry: ${res.status} ${res.statusText} (${TOPIC_REGISTRY_ASSET_URL})`
            );
        }

        const data = (await res.json()) as TopicsRegistry;
        cachedTopics = data;
        return data;
    } catch {
        const empty: TopicsRegistry = { schemaVersion: 1, topics: [] };
        cachedTopics = empty;
        return empty;
    }
}

export function deriveTopicIdsFromTags(tags: string[], topicsRegistry: TopicsRegistry): string[] {
    const tagSet = new Set((tags ?? []).filter((t): t is string => typeof t === 'string' && t.length > 0));
    const ids = new Set<string>();

    for (const topic of topicsRegistry?.topics ?? []) {
        if (!topic || typeof topic.id !== 'string' || !Array.isArray(topic.tags)) continue;
        if (topic.tags.some((t) => tagSet.has(t))) ids.add(topic.id);
    }

    return [...ids].sort();
}

export function expandTopicsToTags(topicIds: string[], topicsRegistry: TopicsRegistry): string[] {
    const byId = new Map((topicsRegistry?.topics ?? []).map((t) => [t.id, t] as const));
    const tags = new Set<string>();

    for (const id of topicIds ?? []) {
        const topic = byId.get(id);
        if (!topic) continue;
        topic.tags.forEach((t) => tags.add(t));
    }

    return [...tags].sort();
}
