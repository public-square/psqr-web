/** Feed Configuration */
interface FeedConfig {
    /** Default to use if set */
    feed_default: FeedTemplate,
    /** Total Feeds */
    feeds: Record<string, FeedTemplate>,
    /** Feed Config Version */
    version: number
}

/** Individual Feed Template */
interface FeedTemplate {
    /** Is Deletable? */
    canDelete: boolean,
    /** Name of Feed */
    name: string,
    /** Slug of Feed */
    slug: string,
    /** URL of Feed */
    url: string
}

export { FeedConfig, FeedTemplate }
