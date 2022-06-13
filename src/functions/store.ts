import localForage from "localforage";
import { validateKeyPair, parseKeyPair } from "./keys";

export interface ActionResponse {
    success: boolean;
    message: string;
}

// setup necessary localForage stores
const dbName = 'ology';
const lf = {
    config: localForage.createInstance({
        name: dbName,
        storeName: 'config'
    }),
    list: localForage.createInstance({
        name: dbName,
        storeName: 'list'
    })
};

/**
* Return a List of DIDS from the Config
*
* @return list
*/
async function getAllDids(): Promise<any> {
    const list: any[] = [];
    await lf.config.iterate((value: any) => {
        list.push(value.identity.didDoc)
    });

    return list;
}

/**
* Return a Specific DID from the config
*
* @param did DID to find
* @return DID Document
*/
async function getDid(did: string): Promise<any> {
    const config: any = await lf.config.getItem(did);
    const didDoc = config.identity.didDoc;

    return didDoc;
}

/**
* Return a Specific DID from the config
*
* @param did DID to find
* @return DID Document
*/
async function getAllKeyPairs(): Promise<any> {
    const list: any[] = [];
    await lf.config.iterate((value: any) => {
        for (let i = 0; i < value.identity.keyPairs.length; i++) {
            const pair = value.identity.keyPairs[i];

            list.push(pair)
        }
    });

    return list;
}

/**
* Locate a Key Pair based on provided KID
*
* @param kid KID
* @return False or Key Pair
*/
async function getKeyPair(kid: string): Promise<boolean | string> {
    const matches = kid.match(/[^#]+/g);

    if (matches === null) {
        return false;
    }

    const did = matches[0];
    const config: any = await lf.config.getItem(did);

    for (let i = 0; i < config.identity.keyPairs.length; i++) {
        const pair = config.identity.keyPairs[i];

        if (pair.kid === kid) {
            return pair;
        }
    }

    return false;
}

/**
* Delete Key Pair associated with KID
*
* @param kid KID
*/
async function deleteKeyPair(kid: string): Promise<any> {
    const matches = kid.match(/[^#]+/g);
    if (matches === null) return false;
    const did = matches[0];
    const config: any = await lf.config.getItem(did);

    for (let i = 0; i < config.identity.keyPairs.length; i++) {
        const pair = config.identity.keyPairs[i];

        if (pair.kid === kid) {
            config.identity.keyPairs.splice(i, 1);
        }
    }

    return await putConfig(did, config);
}

/**
* Import a new config
*
* @param config
* @return Success or Failure Response Object
*/
async function importConfig(config: any): Promise<ActionResponse> {
    // ensure identity config is present
    if (typeof config.identity === 'undefined') {
        const message = 'Identity object not present in config';
        return {success: false, message};
    }

    // ensure didDoc is present
    if (typeof config.identity.didDoc === 'undefined') {
        const message = 'DID doc not present in config';
        return {success: false, message};
    }

    // parse any keys provided
    if (typeof config.identity.keyPairs !== 'undefined' && config.identity.keyPairs.length > 0) {
        const pairs = config.identity.keyPairs;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];

            const parseResp = await parseKeyPair(pair);
            if (parseResp.success === false) {
                return {success: false, message: parseResp.message};
            }
            const pairObject = parseResp.pair;

            const validResp = await validateKeyPair(pairObject);
            if (validResp === false) {
                return {success: false, message: `${pair.kid} Key Pair is invalid`};
            }

            config.identity.keyPairs[i] = pairObject;
        }
    }

    // store config
    const storeResp = await putConfig(config.identity.didDoc.id, config);

    if (storeResp === null) {
        return {
            success: false,
            message: 'Unable to put config'
        }
    }

    return {
        success: true,
        message: 'Successfully put config'
    };
}

/**
* Return all configs
*
* @return List
*/
async function getAllConfigs(): Promise<any> {
    const list: any[] = [];

    await lf.config.iterate((value: any) => {
        list.push(value)
    });

    return list;
}

/**
* Retrieve a specific config based on DID
*
* @param did DID
* @return config
*/
async function getConfig(did: string): Promise<any> {
    const config = await lf.config.getItem(did);

    return config;
}

/**
* Update or Create a new Config
*
* @param did DID to be associated with
* @param config config to create
* @return Success or Failure Response
*/
async function putConfig(did: string, config: any): Promise<any> {
    const putResp = await lf.config.setItem(did, config);

    return putResp;
}

/**
* Delete a config associated with a DID
*
* @param did DID
* @return Success or Failure Response
*/
async function deleteConfig(did: string): Promise<any> {
    const delResp = await lf.config.removeItem(did);

    return delResp;
}

/**
* Iterate over and return all lists
*
* @return all lists found
*/
async function getAllLists(): Promise<any> {
    const list: any[] = [];

    await lf.list.iterate((value: any) => {
        list.push(value)
    });

    return list;
}

/**
* Retrieve a list based on its name
*
* @param name List Name
* @return empty array or found list
*/
async function getList(name: string): Promise<any> {
    const listKey = parseListKey(name);
    const list: any[] = await lf.list.getItem(listKey) || [];
    return list;
}

/**
* Import a List from a URL Endpoint
*
* @param name List Name
* @param endpoint URL Endpoint
* @param key List Key
* @param items List Items
* @return Success or Failure Message Object
*/
async function importList(name: string, endpoint: string, key: string, items = ''): Promise<ActionResponse> {
    const articleList: any[] = [];
    const list = {
        name: name,
        url: endpoint,
        key: key,
        articles: articleList
    }

    // parse list
    if (items.length > 0) {
        try {
            const rawList = items.split("\n");
            for (let i = 0; i < rawList.length; i++) {
                const item = rawList[i];
                if (item === '') continue;
                const parsedItem = JSON.parse(item);

                list.articles.push(parsedItem);
            }
        } catch (error) {
            return {
                success: false,
                message: `Error importing list: ${error.message}`
            }
        }
    }

    const putResp = await putList(list);

    if (putResp.articles.length === list.articles.length) {
        return {
            success: true,
            message: 'Successfully imported list'
        }
    } else {
        return {
            success: false,
            message: 'List import failed'
        }
    }
}

/**
* Create or Update a List
*
* @param list
* @return Success or Failure Response
*/
async function putList(list: any): Promise<any> {
    const listKey = parseListKey(list.name);
    const putResp = await lf.list.setItem(listKey, list);

    return putResp;
}

/**
* Add a Article to a List
*
* @param name List Name
* @param article article to add
* @return Success or Failure Response
*/
async function addArticleToList(name: string, article: any): Promise<any> {
    const listKey = parseListKey(name);
    const list: any = await lf.list.getItem(listKey);
    list.articles.unshift(article);

    const putResp = await lf.list.setItem(listKey, list);

    return putResp;
}

/**
* Delete a List with given name
*
* @param name List Name
* @return Success or Failure Response
*/
async function deleteList(name: string): Promise<any> {
    const listKey = parseListKey(name);
    const delResp = await lf.list.removeItem(listKey);

    return delResp;
}

/**
* Parse List Key to Lower Case and Replace Spaces with Dashes
*
* @param name List Name
* @return List Key
*/
function parseListKey(name: string): string {
    const listKey = name.toLocaleLowerCase().replace(/ /g, '-');

    return listKey;
}

export {
    lf, getAllDids, getDid,
    getAllKeyPairs, getKeyPair, deleteKeyPair,
    getAllConfigs, getConfig, importConfig, putConfig, deleteConfig,
    getAllLists, getList, putList, deleteList, importList, parseListKey, addArticleToList,
}
