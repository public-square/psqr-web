import { Article } from '@/types/Article';

/** List */
interface List {
    /** List Key */
    key: string,
    /** List Name */
    name: string,
    /** Articles Associated with this list */
    articles: Array<Article>,
    /** URL of List */
    url: string
}

export { List }
