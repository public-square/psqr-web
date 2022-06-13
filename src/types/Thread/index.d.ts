import { File, Info } from "@/types/Metainfo";
import { Provenance } from "@/types/Provenance";
import { Article } from "@/types/Article";

/** Article Reply Thread */
interface Thread {
    /** Announce */
    announce: Array<string>,
    /** Article Content Type */
    contentType: string,
    /** Reply Thread Creation Date */
    created: number,
    /** Article Creator */
    createdBy: string,
    /** Copy of the Feed */
    feedCopy: Article,
    /** Files Associated with this Thread */
    files: Array<File>,
    /** Information of this Thread */
    info: Info,
    /** Hash of Torrent's info and content */
    infoHash: string,
    /** Name of this Thread */
    name: string,
    /** Thread Provenance */
    provenance: Provenance,
    /** Thread Replies */
    replyThread: Array<Thread>,
    /** URLList */
    urlList: Array<string>
}

export { Thread }
