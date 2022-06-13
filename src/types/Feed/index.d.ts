import { Thread } from '@/types/Thread';

/** Feed Object */
interface Feed {
    /** URL of Feed */
    feedUrl: string,
    /** Latest ETag of Feed Article */
    latestEtag: string,
    /** Array of Articles for this feed */
    articles: Array<Thread>,
    /** Array of Duplicate Articles in this feed */
    duplicateArticles: Array<string>,
    /** Array of Article Hashes */
    hashes: Array<string>,
    /** Array of all Articles associated with this feed */
    allArticles: Array<Thread>
}

export { Feed }
