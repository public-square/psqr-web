import { Provenance } from '@/types/Provenance';
import { PublicSquare } from '@/types/PublicSquare';

/** Article's Metainformation */
interface Metainfo {
    /** Name of Article */
    name: string,
    /** Hash of Torrent's info and content */
    infoHash: string,
    /** Article's Creation Timestamp */
    created: number,
    /** Article's Original Creator */
    createdBy: string,
    /** URL List */
    urlList: Array<string>,
    /** Announce */
    announce: Array<string>,
    /** Files Associated with this Article */
    files: Array<File>,
    /** Article's Provenance */
    provenance: Provenance,
    /** Article's Information */
    info: Info
}

/** Files Associated with the Article */
interface File {
    /** File Name */
    name: string,
    /** File Offset, usually starting with 0 */
    offset: number,
    /** Length of File */
    length: string
}

/** Article Info */
interface Info {
    publicSquare: PublicSquare,
    /** Hash of Torrent's info and content */
    infoHash: string,
    /** Name of Article */
    name: string
}

export { Metainfo, File, Info }
