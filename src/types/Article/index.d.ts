import { Metainfo } from '@/types/Metainfo';

/** Article Base Type - All Compiled Aspects of the Article */
interface Article {
    /** Article Body */
    body: string,
    /** Date of Article Broadcast */
    broadcastDate: number,
    /** Article Description */
    description: string,
    /** Associated Decentralized Identity */
    identity: string,
    /** DID Key */
    key: string,
    /** Hash of Torrent's info and content */
    infoHash: string,
    blindhash: number,
    /** Article Origin Language */
    lang: string,
    /** Article's Infomation about Information or its Metainformation */
    metainfo: Metainfo,
    /** Publish Date of Article */
    publishDate: number,
    /** Title of Article */
    title: string,
    /** Article's GeoTag */
    geo: string,
    /** Political Subdivision of DID */
    politicalSubdivision: string,
    /** Amplified Content */
    contentAmplify: number | null,
    /** Article Likes */
    contentLike: number | null,
    /** Article Replies */
    contentReply: number | null
}

export { Article }
