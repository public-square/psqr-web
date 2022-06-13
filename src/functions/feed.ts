import { ref, Ref } from "vue";
import { validateArticle } from "./utility";
import { FeedConfig } from "../types/FeedConfig";

/**
* Set Feed Url based on FeedName
*
* @param name FeedName
*/
export function setFeedUrl(name: string): string {
    const feedConfigs: Ref<FeedConfig | null> = ref(null);

    const saved = localStorage.getItem("feed_configuration");

    if (saved) {
        feedConfigs.value = JSON.parse(saved);
    }

    // set the current feed config
    let currentFeedConfig = feedConfigs.value?.feeds?.[name];

    if (typeof currentFeedConfig === 'undefined') {
        currentFeedConfig = feedConfigs.value?.feed_default;
    }

    const url = currentFeedConfig?.url as string;

    return url;
}

/**
* Convert Article to a Thread
*
* @param p Article
* @return Thread, Array of Articles
*/
export function convertArticleToThread(p: any): Array<any> {
    if (p.replyThread.length == 0) {
        return [p]
    }

    const thread = [...p.replyThread];
    thread.push(p);

    return thread;
}

/**
* Find Reply to a Article in Given Feed
*
* @param currentFeed
* @param reply
*/
export async function findReplyArticle(currentFeed: any, reply: string): Promise<any> {
    if (reply == '') {
        return false;
    }

    try {
        // determine type
        const matches = reply.match(/^[a-z]+:/);
        if (matches == null) {
            return false;
        }

        let result = false;
        let value = '';
        switch (matches[0]) {
            case 'twitter:':
                value = reply.replace(/^twitter:/, '');
                for (let i = 0; i < currentFeed.allArticles.length; i++) {
                    const p = currentFeed.allArticles[i];

                    if (p.info.publicSquare.package.canonicalUrl == value) {
                        result = p;
                        break;
                    }
                }
                break;
            case 'psqr:':
                value = reply.replace(/^psqr:/, '');
                for (let i = 0; i < currentFeed.allArticles.length; i++) {
                    const p = currentFeed.allArticles[i];

                    if (p.infoHash == value) {
                        result = p;
                        break;
                    }
                }
                break;
            default:
                return false;
        }

        if (result !== false && await validateArticle(result as unknown as Document)) {
            return result
        }

        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

/**
* Add Replies to a Article as a Thread
*
* @param currentFeed currentFeed of the article (specified in case it gets changed)
* @param article reply article
* @return article
*/
export async function addReplyThread(currentFeed: any, article: any): Promise<any> {
    article.replyThread = [];
    const reply = article.info.publicSquare.package.references.content.reply;

    // if there is no reply to get, return article with empty thread
    if (reply == null || reply == '') {
        return article;
    }

    // run through thread and add the article objects to the array
    let currentReply = '';
    let replyArticle = article;
    do {
        currentReply = replyArticle.info.publicSquare.package.references.content.reply;
        replyArticle = await findReplyArticle(currentFeed, currentReply);

        if (replyArticle !== false) {
            article.replyThread.unshift(replyArticle);
        }
    } while (replyArticle !== false);

    // include reply articles in duplicateArticles list
    for (let i = 0; i < article.replyThread.length; i++) {
        const reply = article.replyThread[i];
        currentFeed.duplicateArticles.push(reply.infoHash);
    }

    return article;
}
