interface PublicSquare {
    package: Package
}

/** Packaged Information */
interface Package {
    /** GeoTag */
    geo: string,
    /** Political Subdivision */
    politicalSubdivision: string,
    /** Publish Date */
    publishDate: number,
    /** Origin Language */
    lang: string,
    /** Title */
    title: string
    /** General Description */
    description: string,
    /** Image */
    image: string,
    /** URL */
    canonicalUrl: string,
    /** Body */
    body: string,
    /** Content References */
    references: References
}

/** Package References */
interface References {
    /** Content Being Referenced */
    content: Array<string>
}

export { PublicSquare, Package, References }
