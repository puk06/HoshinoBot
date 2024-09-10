const rosu = require("../node_modules/rosu-pp-js");
const { Tools: Utils } = require("../src/Utils.js");

/**
 * Represents a class for retrieving user data.
 * @class
 */
class User {
    constructor(name, apikey, mode, endpoint) {
        this.name = name;
        this.apikey = apikey;
        this.mode = mode;
        this.endpoint = endpoint;
    }

    /**
     * Retrieves data from an API endpoint.
     * @returns {Promise<any>} A promise that resolves with the retrieved data.
     */
    getData() {
        return new Promise(async (resolve, reject) => {
            await Utils.getAPIResponse(`https://osu.ppy.sh/api/${this.endpoint}?&k=${this.apikey}&type=string&m=${this.mode}&u=${this.name}`)
                .then(res => {
                    resolve(res[0]);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * Retrieves data without mode from the specified endpoint using the provided API key and name.
     * @returns {Promise<any>} A promise that resolves with the retrieved data or rejects with an error.
     */
    getDataWithoutMode() {
        return new Promise(async (resolve, reject) => {
            await Utils.getAPIResponse(`https://osu.ppy.sh/api/${this.endpoint}?&k=${this.apikey}&type=string&u=${this.name}`)
                .then(res => {
                    resolve(res[0]);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * Retrieves score data for a specific beatmap.
     * @param {string} beatmapId - The ID of the beatmap.
     * @param {number} [mods=0] - The mods applied to the score (default: 0).
     * @returns {Promise<Object>} - A promise that resolves with the score data.
     */
    getScoreData(beatmapId, mods = 0) {
        return new Promise(async (resolve, reject) => {
            await Utils.getAPIResponse(`https://osu.ppy.sh/api/${this.endpoint}?&k=${this.apikey}&b=${beatmapId}&type=string&m=${this.mode}&u=${this.name}&mods=${mods}`)
                .then(res => {
                    let maxPP = 0;
                    let maxPPIndex = 0;
                    for (let i = 0; i < res.length; i++) {
                        if (res[i].pp > maxPP) {
                            maxPP = res[i].pp;
                            maxPPIndex = i;
                        }
                    }
                    resolve(res[maxPPIndex]);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * Retrieves score data for a beatmap without mods.
     * @param {string} beatmapId - The ID of the beatmap.
     * @returns {Promise} A promise that resolves with the score data or rejects with an error.
     */
    getScoreDataWithoutMods(beatmapId) {
        return new Promise(async (resolve, reject) => {
            await Utils.getAPIResponse(`https://osu.ppy.sh/api/${this.endpoint}?&k=${this.apikey}&b=${beatmapId}&type=string&m=${this.mode}&u=${this.name}`)
                .then(res => {
                    resolve(res);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
}

/**
 * Represents a class for retrieving user data.
 * @class
 * @extends User
 */
class GetUserData extends User {
    constructor(name, apikey, mode = 0) {
        super(name, apikey, mode, 'get_user');
    }
}

/**
 * Represents a class for retrieving a user's recent data.
 * @class
 * @extends User
 */
class GetUserRecent extends User {
    constructor(name, apikey, mode = 0) {
        super(name, apikey, mode, 'get_user_recent');
    }
}

/**
 * Represents a user's score retrieval.
 * @class
 * @extends User
 */
class GetUserScore extends User {
    constructor(name, apikey, mode = 0) {
        super(name, apikey, mode, 'get_scores');
    }
}

/**
 * Represents a class for retrieving map data from the osu! API.
 * @class
 */
class GetMapData {
    /**
     * Creates an instance of GetMapData.
     * @param {string} maplink - The map link or ID.
     * @param {string} apikey - The API key for accessing the osu! API.
     * @param {number} [mode=0] - The game mode (0 = osu!, 1 = Taiko, 2 = Catch the Beat, 3 = osu!mania).
     */
    constructor(maplink, apikey, mode = 0) {
        this.maplink = /^\d+$/.test(maplink) ? maplink : maplink.split("/")[maplink.split("/").length - 1];
        this.apikey = apikey;
        this.mode = mode;
    }

    /**
     * Retrieves map data from the osu! API.
     * @returns {Promise<object>} A promise that resolves to the map data.
     * @throws {Error} If no data is found.
     */
    getData() {
        return new Promise(async (resolve, reject) => {
            await Utils.getAPIResponse(`https://osu.ppy.sh/api/get_beatmaps?k=${this.apikey}&m=${this.mode}&b=${this.maplink}&a=1`)
                .then(res => {
                    if (res.length === 0) {
                        reject(new Error("No data found"));
                    }
                    resolve(res[0]);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    getDataFromHash() {
        return new Promise(async (resolve, reject) => {
            await Utils.getAPIResponse(`https://osu.ppy.sh/api/get_beatmaps?k=${this.apikey}&h=${this.maplink}&a=1`)
                .then(res => {
                    if (res.length === 0) {
                        reject(new Error("No data found"));
                    }
                    resolve(res[0]);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * Retrieves map data from the osu! API without specifying the game mode.
     * @returns {Promise<object>} A promise that resolves to the map data.
     * @throws {Error} If no data is found.
     */
    getDataWithoutMode() {
        return new Promise(async (resolve, reject) => {
            await Utils.getAPIResponse(`https://osu.ppy.sh/api/get_beatmaps?k=${this.apikey}&b=${this.maplink}`)
                .then(res => {
                    if (res.length === 0) {
                        reject(new Error("No data found"));
                    }
                    resolve(res[0]);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
}

/**
 * Represents a class for retrieving map data from the osu! API.
 * @class
 */
class CalculatePPSR {
    /**
     * Represents a Library object.
     * @constructor
     * @param {string} maplink - The map link or map ID.
     * @param {number} [mods=0] - The mods applied to the beatmap.
     * @param {number} [mode=0] - The game mode.
     */
    constructor(maplink, mods = 0, mode = 0) {
        this.maplink = /^\d+$/.test(maplink) ? maplink : maplink.split("/")[maplink.split("/").length - 1];
        this.beatmapData = null;
        this.mods = mods;
        this.mode = mode;
        this.acc = 100;
    }

    setMods(mods) {
        this.mods = mods;
    }

    /**
     * Retrieves the map data from the specified URL.
     * @returns {Promise<void>} A promise that resolves when the map data is successfully retrieved.
     * @throws {Error} If there is an error while retrieving the map data.
     */
    async getMapData() {
        return new Promise(async (resolve, reject) => {
            this.beatmapdata = await Utils.getAPIResponse(`https://osu.ppy.sh/osu/${this.maplink}`, { responseType: "arrayBuffer" })
                .then(res => {
                    this.beatmapData = res;
                    resolve();
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    /**
     * Retrieves the beatmap data.
     * @returns {Promise<Object>} A promise that resolves with the beatmap data.
     */
    async getMap() {
        if (this.beatmapData === null) {
            await this.getMapData()
                .catch(error => {
                    reject(error);
                });
        }
        return this.beatmapData;
    }

    /**
     * Calculates the object based on the beatmap data and mode.
     * @returns {Promise<Number>} A promise that resolves to the calculated object.
     * @throws {Error} If there is an error during the calculation process.
     */
    async calcObject() {
        return new Promise(async (resolve, reject) => {
            try {
                if (this.beatmapData === null) {
                    await this.getMapData()
                        .catch(error => {
                            reject(error);
                        });
                }
                const map = new rosu.Beatmap(new Uint8Array(Buffer.from(this.beatmapData)))
                map.convert(this.mode);
                resolve(map.nObjects);
            } catch (error) {
                reject(error);
            }
        })
    }

    /**
     * Calculates the SR (Star Rating) and PP (Performance Points) for the beatmap.
     * @returns {Promise<{sr: number, pp: number}>} The calculated SR and PP values.
     */
    calculateSR() {
        return new Promise(async (resolve, reject) => {
            try {
                if (this.beatmapData === null) {
                    await this.getMapData()
                        .catch(error => {
                            reject(error);
                        });
                }

                const map = new rosu.Beatmap(new Uint8Array(Buffer.from(this.beatmapData)));
                map.convert(this.mode);

                const Difficulty = new rosu.Difficulty({
                    mods: this.mods
                }).calculate(map);

                const PP = new rosu.Performance({
                    accuracy: this.acc,
                    mods: this.mods
                }).calculate(Difficulty).pp;

                const param = {
                    sr: Difficulty.stars,
                    pp: PP
                };

                resolve(param);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Calculates the difficulty and performance points (PP) of a beatmap.
     * @returns {Promise<{sr: number, pp: number}>} The calculated difficulty (SR) and performance points (PP).
     */
    calculateDT() {
        return new Promise(async (resolve, reject) => {
            try {
                if (this.beatmapData === null) {
                    await this.getMapData()
                    .catch(error => {
                        reject(error);
                    });
                }
    
                const map = new rosu.Beatmap(new Uint8Array(Buffer.from(this.beatmapData)));
                map.convert(this.mode);
    
                const Difficulty = new rosu.Difficulty({
                    mods: 64
                }).calculate(map);

                const SR = Difficulty.stars;
                const PP = new rosu.Performance({
                    mods: 64
                }).calculate(Difficulty).pp;

                const param = {
                    sr: SR,
                    pp: PP
                };

                resolve(param);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Calculates the score PP (Performance Points).
     * @param {Object} params - The parameters for calculating the PP.
     * @returns {Promise<number>} - A promise that resolves with the calculated PP.
     * @throws {Error} - If an error occurs during the calculation.
     */
    calculateScorePP(params, passedObjects) {
        return new Promise(async (resolve, reject) => {
            try {
                if (this.beatmapData === null) {
                    await this.getMapData()
                        .catch(error => {
                            reject(error);
                        });
                }
    
                const map = new rosu.Beatmap(new Uint8Array(Buffer.from(this.beatmapData)));
                map.convert(this.mode);

                const difficultyObject = {
                    mods: this.mods
                };

                params.mods = this.mods;

                if (passedObjects) difficultyObject.passedObjects = passedObjects;
                const difficulty = new rosu.Difficulty(difficultyObject).calculate(map);
                const PP = new rosu.Performance(params).calculate(difficulty).pp;

                resolve(PP);
            } catch (error) {
                reject(error);
            }
        });
    }
}

class CheckMapData {
    constructor(maplink) {
        this.maplink = maplink;
        this.beatmapID = this.maplink.split("/")[maplink.split("/").length - 1];
    }

    check() {
        return new Promise(async (resolve, reject) => {
            try {
                const MAP_DATA = await Utils.getAPIResponse(`https://osu.ppy.sh/osu/${this.beatmapID}`);
                const snapArray = [8, 6, 4, 3];

                let BPMarray = [];
                let mapData = {
                    "BPMarray": [],
                    "maxStream": 0,
                    "streamCount": 0,
                    "over100ComboAverageStreamLength": 0,
                    "1/3 times": 0,
                    "max1/3Length": 0,
                    "1/4 times": 0,
                    "max1/4Length": 0,
                    "1/6 times": 0,
                    "max1/6Length": 0,
                    "1/8 times": 0,
                    "max1/8Length": 0,
                    "BPMMode": 0
                };

                function mode(BPMarray) {
                    if (BPMarray.length == 0) return 0;
                    if (BPMarray.length == 1) return BPMarray[0][1];
                    let maxInterval = 0;
                    let maxIntervalIndex = 0;
                    for (let i = 0; i < BPMarray.length - 1; i++) {
                        const interval = BPMarray[i + 1][0] - BPMarray[i][0];
                        if (interval > maxInterval) {
                            maxInterval = interval;
                            maxIntervalIndex = i;
                        }
                    }
                    return BPMarray[maxIntervalIndex][1];
                }

                function parse(data) {
                    const TIMINGPOINTS_SECTION = "[TimingPoints]";
                    const HITOBJECTS_SECTION = "[HitObjects]";

                    const beatmap = data
                        .match(/.+\r?\n/gm)
                        .map(line => line.replace(/\r?\n/, ""));
            
                    const timingPointsIndex = beatmap.indexOf(TIMINGPOINTS_SECTION);
                    const hitObjectsIndex = beatmap.indexOf(HITOBJECTS_SECTION);
                    
                    const timing_points = beatmap
                        .slice(timingPointsIndex + 1, hitObjectsIndex)
                        .filter(line => line !== "")
                        .map(line => {
                            const hit_objects = line.split(",");
                            return {
                                time: Number(hit_objects[0]),
                                beatLength: Number(hit_objects[1]),
                                meter: Number(hit_objects[2]),
                                sampleSet: Number(hit_objects[3]),
                                sampleIndex: Number(hit_objects[4]),
                                volume: Number(hit_objects[5]),
                                uninherited: Number(hit_objects[6]),
                                effects: Number(hit_objects[7])
                            }
                        });
            
                    const hit_objects = beatmap
                        .slice(hitObjectsIndex + 1)
                        .filter(line => line !== "")
                        .map(line => {
                            const hit_objects = line.split(",");
                            return Number(hit_objects[2]);
                        })
                    
                    const hit_object_interval = hit_objects.map((time, index, array) => {
                        if (index == 0) return 0;
                        return time - array[index - 1];
                    });


                    return {
                        timing_points,
                        hit_objects,
                        hit_object_interval
                    };
                }

                const map = parse(MAP_DATA);

                for (const element of map.timing_points) {
                    if (element.uninherited == 1) {
                        const BPM = 1 / element.beatLength * 60000;
                        BPMarray.push([element.time, BPM]);
                    }
                }

                
                const getSnapInterval = (snap, currentBPM) => (60000 / currentBPM / snap) + 1;

                let mapdataTemp = {
                    "BPMarray": [],
                    "prevValue": null,
                    "lastSnap": 0,
                    "max1/8Length": 0,
                    "max1/6Length": 0,
                    "max1/4Length": 0,
                    "max1/3Length": 0,
                    "current1/8Length": 0,
                    "current1/6Length": 0,
                    "current1/4Length": 0,
                    "current1/3Length": 0,
                    "1/8Times": 0,
                    "1/6Times": 0,
                    "1/4Times": 0,
                    "1/3Times": 0,
                    "maxStream": 0,
                    "maxTechStream": 0,
                    "currentStreamLength": 0,
                    "streamCount": 0,
                    "streamLength": [],
                    "techStreamLength": [],
                    "over100ComboAverageStreamLength": 0,
                    "currentObjectCount": 0
                }

                for (const timing of map.hit_objects) {
                    let currentBPM = 0;
                    for (let i = 0; i < BPMarray.length; i++) {
                        if (!BPMarray[i + 1]) {
                            currentBPM = BPMarray[i][1];
                            break;
                        }
                        if (BPMarray[i] && timing >= BPMarray[i][0] && timing < BPMarray[i + 1][0]) {
                            currentBPM = BPMarray[i][1];
                        }
                    }

                    let foundFlag = false;
                    for (const snap of snapArray) {
                        const snapInterval = getSnapInterval(snap, currentBPM);
                        if (mapdataTemp.prevValue !== null && Math.abs(timing - mapdataTemp.prevValue) <= snapInterval) {
                            foundFlag = true;
                            if (mapdataTemp.lastSnap == 8) {
                                if (mapdataTemp["current1/8Length"] == 0) {
                                    mapdataTemp["current1/8Length"] = 2;
                                } else {
                                    mapdataTemp["current1/8Length"]++;
                                }
                            }

                            if (mapdataTemp.lastSnap == 6) {
                                if (mapdataTemp["current1/6Length"] == 0) {
                                    mapdataTemp["current1/6Length"] = 2;
                                } else {
                                    mapdataTemp["current1/6Length"]++;
                                }
                            }

                            if (mapdataTemp.lastSnap == 4) {
                                if (mapdataTemp["current1/4Length"] == 0) {
                                    mapdataTemp["current1/4Length"] = 2;
                                } else {
                                    mapdataTemp["current1/4Length"]++;
                                }
                            }

                            if (mapdataTemp.lastSnap == 3) {
                                if (mapdataTemp["current1/3Length"] == 0) {
                                    mapdataTemp["current1/3Length"] = 2;
                                } else {
                                    mapdataTemp["current1/3Length"]++;
                                }
                                
                            }

                            if (mapdataTemp["current1/8Length"] > mapdataTemp["max1/8Length"]) mapdataTemp["max1/8Length"] = mapdataTemp["current1/8Length"];
                            if (mapdataTemp["current1/6Length"] > mapdataTemp["max1/6Length"]) mapdataTemp["max1/6Length"] = mapdataTemp["current1/6Length"];
                            if (mapdataTemp["current1/4Length"] > mapdataTemp["max1/4Length"]) mapdataTemp["max1/4Length"] = mapdataTemp["current1/4Length"];
                            if (mapdataTemp["current1/3Length"] > mapdataTemp["max1/3Length"]) mapdataTemp["max1/3Length"] = mapdataTemp["current1/3Length"];

                            if (mapdataTemp.lastSnap != snap) {
                                if (mapdataTemp.lastSnap == 0) mapdataTemp["currentStreamLength"] = 0;
                                if (mapdataTemp.lastSnap == 8) mapdataTemp["1/8Times"]++;
                                if (mapdataTemp.lastSnap == 6) mapdataTemp["1/6Times"]++;
                                if (mapdataTemp.lastSnap == 4) mapdataTemp["1/4Times"]++;
                                if (mapdataTemp.lastSnap == 3) mapdataTemp["1/3Times"]++;
                                mapdataTemp["current1/8Length"] = 0;
                                mapdataTemp["current1/6Length"] = 0;
                                mapdataTemp["current1/3Length"] = 0;
                                mapdataTemp["current1/4Length"] = 0;
                            }

                            if (mapdataTemp["current1/4Length"] >= 100) {
                                mapdataTemp["currentStreamLength"] = mapdataTemp["current1/4Length"];
                            }

                            mapdataTemp.lastSnap = snap;
                            mapdataTemp.currentObjectCount++;
                        }

                        if (foundFlag) break;
                    }

                    if (!foundFlag) {
                        mapdataTemp["current1/8Length"] = 0;
                        mapdataTemp["current1/6Length"] = 0;
                        mapdataTemp["current1/4Length"] = 0;
                        mapdataTemp["current1/3Length"] = 0;
                        if (mapdataTemp.lastSnap == 8) mapdataTemp["1/8Times"]++;
                        if (mapdataTemp.lastSnap == 6) mapdataTemp["1/6Times"]++;
                        if (mapdataTemp.lastSnap == 4) mapdataTemp["1/4Times"]++;
                        if (mapdataTemp.lastSnap == 3) mapdataTemp["1/3Times"]++;
                        if (mapdataTemp["currentStreamLength"] > 100 && mapdataTemp["currentStreamLength"] > mapdataTemp["maxStream"]) mapdataTemp["maxStream"] = mapdataTemp["currentStreamLength"];
                        if (mapdataTemp["currentStreamLength"] > 100) mapdataTemp["streamLength"].push(mapdataTemp["currentStreamLength"]);
                        mapdataTemp["currentStreamLength"] = 0;
                        mapdataTemp.lastSnap = 0;
                        mapdataTemp.currentObjectCount = 0;
                    }

                    mapdataTemp.prevValue = timing;
                }

                mapData["BPMarray"] = BPMarray.map(element => element[1]);
                mapData["maxStream"] = mapdataTemp["maxStream"];
                mapData["streamCount"] = mapdataTemp["streamLength"].length;
                mapData["over100ComboAverageStreamLength"] = mapdataTemp["streamLength"].reduce((a, b) => a + b, 0) / mapdataTemp["streamLength"].length;
                mapData["1/3 times"] = mapdataTemp["1/3Times"];
                mapData["max1/3Length"] = mapdataTemp["max1/3Length"];
                mapData["1/4 times"] = mapdataTemp["1/4Times"];
                mapData["max1/4Length"] = mapdataTemp["max1/4Length"];
                mapData["1/6 times"] = mapdataTemp["1/6Times"];
                mapData["max1/6Length"] = mapdataTemp["max1/6Length"];
                mapData["1/8 times"] = mapdataTemp["1/8Times"];
                mapData["max1/8Length"] = mapdataTemp["max1/8Length"];
                mapData["BPMMode"] = mode(BPMarray);
                resolve(mapData);
            } catch (error) {
                reject(error);
            }
        });
    }
}

const ModStrings = {
	0: "NM",
	1: "NF",
	2: "EZ",
	8: "HD",
	16: "HR",
	32: "SD",
	64: "DT",
	128: "RX",
	256: "HT",
	512: "NC",
	1024: "FL",
	2048: "Autoplay",
	8192: "Relax2",
	16384: "PF"
};

const ModtoStrings = {
	"NM": 0,
	"NF": 1,
	"EZ": 2,
	"HD": 8,
	"HR": 16,
	"SD": 32,
	"DT": 64,
	"RX": 128,
	"HT": 256,
	"NC": 512,
	"FL": 1024,
	"Autoplay": 2048,
	"Relax2": 8192,
	"PF": 16384
};

/**
 * Represents a Library object.
 * @class
 */
class Mod {
    /**
     * Represents a Library object.
     * @constructor
     * @param {Array} mods - The array of mods.
     */
    constructor(mods) {
        this.mods = mods;
    }

    /**
     * Retrieves the mods information.
     * @returns {Object} The mods information object.
     */
    get() {
        // modをチェックする
        if (!this.mods) {
            return {
                "array": ["NM"],
                "str": "NM",
                "num": 0,
                "calc": 0
            };
        }

        if (/^\d+$/.test(this.mods)) {
            this.mods = Number(this.mods);
            let activeMods = [];
            for (let i = 0; i < 14; i++) {
                const bit = 1 << i;
                if ((this.mods & bit) === bit) {
                    activeMods.push(ModStrings[bit])
                }
            }
            if (activeMods.includes("DT") && activeMods.includes("NC")) activeMods = activeMods.filter(mod => mod !== "DT");

            let num = 0;
            num = activeMods.reduce((acc, modString) =>{
                let modValue = ModtoStrings[modString];
                if (modString == "NC") modValue = 576;
                if (modString == "PF") modValue = 16416;
                if (modValue) return acc | modValue;
                return acc;
            }, 0);

            let calc = 0;
            let modsForCalc = activeMods;
            if (activeMods.includes("NC")) {
                modsForCalc = modsForCalc.filter(mod => mod !== "NC");
                modsForCalc.push("DT");
            }
            calc = modsForCalc.reduce((acc, modString) =>{
                const modValue = ModtoStrings[modString];
                if (modValue) return acc | modValue;
                return acc;
            }, 0);

            return {
                "array": activeMods.length == 0 ? ["NM"] : activeMods,
                "str": activeMods == "" ? "NM" : activeMods.join(""),
                "num": !num ? 0 : num,
                "calc": !calc ? 0 : calc
            };
        } else {
            this.mods = this.mods.toUpperCase();
            let activeMods = this.mods.match(/.{2}/g);
            const checkArray = ['NM', 'EZ', 'HT', 'NF', 'HR', 'HD', 'SD', 'DT', 'NC', 'FL', 'SO', 'PF', 'V2', 'TD', 'HD', 'FI', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'];
            for (const element of activeMods) {
                if (!checkArray.includes(element)) return false;
            }
            if (activeMods.includes("NC") && activeMods.includes("HT") || activeMods.includes("DT") && activeMods.includes("HT") || activeMods.includes("DT") && activeMods.includes("NC") || activeMods.includes("EZ") && activeMods.includes("HR")) return false;
            const checkMods = activeMods.some(mod => mod.length != 2);
            if (checkMods) return false;
            activeMods = activeMods.map(mod => mod.toUpperCase());
            if (activeMods.includes("DT") && activeMods.includes("NC")) activeMods = activeMods.filter(mod => mod !== "DT");

            let num = 0;
            num = activeMods.reduce((acc, modString) =>{
                let modValue = ModtoStrings[modString];
                if (modString == "NC") modValue = 576;
                if (modString == "PF") modValue = 16416;
                if (modValue) return acc | modValue;
                return acc;
            }, 0);

            let calc = 0;
            let modsForCalc = activeMods;
            if (activeMods.includes("NC")) {
                modsForCalc = modsForCalc.filter(mod => mod !== "NC");
                modsForCalc.push("DT");
            }
            calc = modsForCalc.reduce((acc, modString) =>{
                const modValue = ModtoStrings[modString];
                if (modValue) return acc | modValue;
                return acc;
            }, 0);

            return {
                "array": activeMods.length == 0 ? ["NM"] : activeMods,
                "str": activeMods == "" ? "NM" : activeMods.join(""),
                "num": !num ? 0 : num,
                "calc": !calc ? 0 : calc
            };
        }
    }
}

/**
 * Utility class for building URLs related to osu!.
 * @class
 */
class URLBuilder {
    /**
     * Returns the icon URL for a given user ID.
     * @param {string} userId - The user ID.
     * @returns {string} The icon URL.
     */
    static iconURL(userId) {
        if (!userId) return "https://a.ppy.sh/2";
        return `https://a.ppy.sh/${userId}`;
    }

    /**
     * Returns the mamestagram icon URL for a given user ID.
     * @param {string} userId - The user ID.
     * @returns {string} The mamestagram icon URL.
     */
    static mamestagramIconURL(userId) {
        if (!userId) return "https://a.mamesosu.net/1";
        return `https://a.mamesosu.net/${userId}`;
    }

    /**
     * Generates a beatmap URL based on the provided parameters.
     * @param {string} beatmapSetId - The ID of the beatmap set.
     * @param {string} mode - The mode of the beatmap.
     * @param {string} beatmapId - The ID of the specific beatmap.
     * @returns {string} The generated beatmap URL.
     */
    static beatmapURL(beatmapSetId, mode, beatmapId) {
        return `https://osu.ppy.sh/beatmapsets/${beatmapSetId}#${modeconvertforlinks(mode)}/${beatmapId}`;
    }

    /**
     * Returns the URL of a user's profile on osu! based on their user ID.
     * If no user ID is provided, the default URL for the osu! homepage is returned.
     * @param {string} userId - The user ID of the osu! user.
     * @returns {string} The URL of the user's profile on osu!.
     */
    static userURL(userId) {
        if (!userId) return "https://osu.ppy.sh/home";
        return `https://osu.ppy.sh/users/${userId}`;
    }

    /**
     * Returns the URL of a user's profile on mamestagram based on their user ID.
     * If no user ID is provided, the default URL for the mamestagram homepage is returned.
     * @param {string} userId - The user ID of the osu! user.
     * @returns {string} The URL of the user's profile on mamestagram.
     */
    static mamestagramUserURL(userId) {
        if (!userId) return "https://web.mamesosu.net/profile/1"
        return `https://web.mamesosu.net/profile/${userId}`;
    }
    
    /**
     * Returns the URL of the background image for a given beatmap set ID.
     * @param {string} beatmapSetId - The ID of the beatmap set.
     * @returns {string} The URL of the background image.
     */
    static backgroundURL(beatmapSetId) {
        beatmapSetId = /^\d+$/.test(beatmapSetId) ? beatmapSetId : beatmapSetId.split("/")[4].split("#")[0];
        return `https://assets.ppy.sh/beatmaps/${beatmapSetId}/covers/cover.jpg`;
    }

    /**
     * Returns the URL of the thumbnail image for a given beatmap set ID.
     * @param {number} beatmapSetId - The ID of the beatmap set.
     * @returns {string} The URL of the thumbnail image.
     */
    static thumbnailURL(beatmapSetId) {
        return `https://b.ppy.sh/thumb/${beatmapSetId}l.jpg`;
    }
}

/**
 * A utility class that provides various tools and functions.
 * @class
 */
class Tools {
    /**
     * Maps the status code to its corresponding status string.
     * @param {number} approved - The status code to be mapped.
     * @returns {string} - The corresponding status string.
     */
    static mapstatus(approved) {
        switch (Number(approved)) {
            case -2:
                return "Graveyard";
            case -1:
                return "WIP";
            case 0:
                return "Pending";
            case 1:
                return "Ranked";
            case 2:
                return "Approved";
            case 3:
                return "Qualified";
            case 4:
                return "Loved";
            default:
                return "Unknown";
        }
    }

    
    /**
     * Converts a mode number to its corresponding emoji.
     * @param {number} mode - The mode number.
     * @returns {string} - The emoji corresponding to the mode number.
     */
    static modeEmojiConvert(mode) {
        switch (mode) {
            case 0:
                return "<:osu:1198316136605945856>";
            case 1:
                return "<:taiko:1198316140015927367>";
            case 2:
                return "<:fruits:1198316131270799410>";
            case 3:
                return "<:mania:1198316134932426844>";
            default:
                return "<:osu:1198316136605945856>";
        }
    }
}

/**
 * A utility class that provides various tools and functions.
 * @class
 */
class GetRank {
    /**
     * Retrieves the rank of a user based on their performance points (PP) and game mode.
     * @param {number} pp - The performance points (PP) of the user.
     * @param {number} mode - The game mode (0: osu!, 1: Taiko, 2: Catch the Beat, 3: osu!mania).
     * @returns {Promise<object>} A promise that resolves to the rank of the user.
     */
    static async get(pp, mode) {
        const apikey = process.env.OSUDAILY;
        return await Utils.getAPIResponse(`https://osudaily.net/api/pp.php?k=${apikey}&v=${pp}&t=pp&m=${mode}`);
    }
}

/**
 * Calculates the global performance points (PP) based on the given scores and user play count.
 * @class
 */
class CalculateGlobalPP {
    /**
     * Calculates the global performance points (PP) based on the given scores and user play count.
     * @param {number[]} scores - The scores achieved by the user.
     * @param {number} userplaycount - The play count of the user.
     * @returns {number} The calculated global performance points (PP).
     */
    static calculate(scores, userplaycount) {
        const userScores = scores.slice();
        let scorepp = 0.0;
        for (let i = 0; i < userScores.length; i++) {
            scorepp += userScores[i] * Math.pow(0.95, i);
        }
        return scorepp + extraPolatePPRemainder(userScores, userplaycount);
    }
}

/**
 * Calculates the performance and accuracy of a full combo (FC) for a given score in osu! game.
 * @class
 */
class CalculateIfFC {
    /**
     * Calculates the performance and accuracy of a full combo (FC) for a given score.
     * @param {object} score - The score object containing the number of 300s, 100s, 50s, and misses.
     * @param {number} mode - The game mode (0: osu!, 1: Taiko, 2: Catch the Beat, 3: osu!mania).
     * @param {number} passedObjects - The number of objects passed.
     * @param {number} calcmods - The calculation mods applied.
     * @param {object} map - The map data.
     * @returns {object} - The calculated performance (ifFCPP), hit counts (ifFCHits), and accuracy (ifFCAcc).
     */
    static calculate(score, mode, passedObjects, calcmods, map) {
        let ifFCPP = 0;
        let ifFCAcc = 100;
        let ifFCHits = {
            n300: 0,
            n100: 0,
            n50: 0,
            misses: 0
        };
    
        const objects = map.nObjects;
        switch (mode) {
            case 0: {
                map.convert(0);
                const difficulty = new rosu.Difficulty({
                    mods: calcmods
                }).calculate(map);

                let n300 = score.n300 + Math.max(0, objects - passedObjects);
                const countHits = objects - score.misses;
                const ratio = 1.0 - (n300 / countHits);
                const new100s = Math.ceil(ratio * score.misses);
                n300 += Math.max(0, score.misses - new100s);
                const n100 = score.n100 + new100s;
                const n50 = score.n50;
                const calcScore = {
                    n300: n300,
                    n100: n100,
                    n50: n50,
                    misses: 0,
                    combo: difficulty.maxCombo,
                    mods: calcmods
                };
    
                ifFCHits.n300 = n300;
                ifFCHits.n100 = n100;
                ifFCHits.n50 = n50;

                ifFCPP = new rosu.Performance(calcScore).calculate(difficulty).pp;
                if (isNaN(ifFCPP)) ifFCPP = 0;
                ifFCAcc = Math.round((n300 * 300 + n100 * 100 + n50 * 50) / ((n300 + n100 + n50 + 0) * 300) * 10000) / 100;
                return { ifFCPP, ifFCHits, ifFCAcc };
            }
    
            case 1: {
                map.convert(1);
                const difficulty = new rosu.Difficulty({
                    mods: calcmods
                }).calculate(map);

                let n300 = score.n300 + Math.max(0, objects - passedObjects);
                const countHits = objects - score.misses;
                const ratio = 1.0 - (n300 / countHits);
                const new100s = Math.ceil(ratio * score.misses);
                n300 += Math.max(0, score.misses - new100s);
                const n100 = score.n100 + new100s;
                const calcScore = {
                    n300: n300,
                    n100: n100,
                    misses: 0,
                    mods: calcmods
                };
    
                ifFCHits.n300 = n300;
                ifFCHits.n100 = n100;

                ifFCPP = new rosu.Performance(calcScore).calculate(difficulty).pp;
                if (isNaN(ifFCPP)) ifFCPP = 0;
                ifFCAcc = Math.round((100.0 * (2 * n300 + n100)) / (2 * objects) * 100) / 100;
                return { ifFCPP, ifFCHits, ifFCAcc };
            }
    
            case 2: {
                map.convert(2);
                const difficulty = new rosu.Difficulty({
                    mods: calcmods
                }).calculate(map);

                const passedObjectsforCatch = score.n300 + score.n100 + score.misses;
                const missing = objects - passedObjectsforCatch;
                const missingFruits = Math.max(0, missing - Math.max(0, difficulty.nDroplets - score.n100));
                const missingDroplets = missing - missingFruits;
                const nFruits = score.n300 + missingFruits;
                const nDroplets = score.n100 + missingDroplets;
                const nTinyDropletMisses = score.nKatu;
                const nTinyDroplets = Math.max(0, difficulty.nTinyDroplets - nTinyDropletMisses);
                const calcScore = {
                    n300: nFruits,
                    n100: nDroplets,
                    n50: nTinyDroplets,
                    nGeki: score.nGeki,
                    nKatu: score.nKatu,
                    misses: 0,
                    combo: difficulty.maxCombo,
                    mods: calcmods
                };
    
                ifFCHits.n300 = nFruits;
                ifFCHits.n100 = nDroplets;
                ifFCHits.n50 = nTinyDroplets;

                ifFCPP = new rosu.Performance(calcScore).calculate(difficulty).pp;
                if (isNaN(ifFCPP)) ifFCPP = 0;
                ifFCAcc = Math.round((100.0 * (nFruits + nDroplets + nTinyDroplets)) / (nFruits + nDroplets + nTinyDroplets + score.nKatu) * 100) / 100;
                return { ifFCPP, ifFCHits, ifFCAcc };
            }
    
            case 3: {
                return { ifFCPP, ifFCHits, ifFCAcc };
            }
        }
    }
}

/**
 * Represents a class for calculating and generating SR (Star Rating) chart.
 * @class
 */
class SRChart {
    /**
     * Calculates the SR (Star Rating) chart for a given beatmap ID and mode.
     * @param {string} beatmapId - The ID of the beatmap.
     * @param {string} mode - The mode of the beatmap (e.g., "osu", "taiko", "catch", "mania").
     * @returns {Promise<ArrayBuffer>} - The SR chart as an ArrayBuffer.
     * @throws {Error} - If the object count is too high.
     */
    static async calculate(beatmapId, mode) {
        return new Promise(async (resolve, reject) => {
            try {
                const beatmapdata = await Utils.getAPIResponse(`https://osu.ppy.sh/osu/${beatmapId}`, { responseType: "arrayBuffer" });
                const map = new rosu.Beatmap(new Uint8Array(Buffer.from(beatmapdata)));
                const objectCount = map.nObjects;
    
                if (objectCount > 10000) {
                    reject(new Error("オブジェクト数が多すぎます。"));
                } else {
                    const baseURL = 'https://image-charts.com/chart.js/2.8.0';
                    const srdata = await calculateStarRating(map, mode);
                    const dividedsrdata = divideInto100Parts(srdata);
                    const srdatalengtharray = labelarray(dividedsrdata.length);
                    const chartConfig = {
                        type: "line",
                        data: {
                            datasets: [
                                {
                                    data: dividedsrdata,
                                    label: "SRdata",
                                    borderColor: "rgb(255, 255, 255)",
                                    backgroundColor: "rgba(54, 162, 235, 0.5)",
                                    fill: "start"
                                }
                            ],
                            labels: srdatalengtharray,
                        }
                    };
                    const requestURL = `${baseURL}?bkg=white&c=${JSON.stringify(chartConfig)}`;
                    const response = await Utils.getAPIResponse(requestURL, { responseType: "arraybuffer" });
                    resolve(response);
                }
            } catch (error) {
                reject(error);
            }
        })
    }
}

function extraPolatePPRemainder(scores, userplaycount) {
    if (scores.length < 100) {
        return 0.0;
    }

    let ys = scores;
    for (let i = 0; i < ys.length; i++) {
        ys[i] = Math.log10(scores[i] * Math.pow(0.95, i)) / Math.log10(100);
    }

    let b = calculateLinearRegression(ys);
    let pp = 0.0;
    for (let n = 100; n <= userplaycount; n++) {
        let val = Math.pow(100.0, b[0] + b[1] * n);
        if (val <= 0.0) break;
        pp += val;
    }

    return pp;
}

function calculateLinearRegression(ys) {
    let sumOxy = 0.0;
    let sumOx2 = 0.0;
    let avgX = 0.0;
    let avgY = 0.0;
    let sumX = 0.0;
    for (let n = 1; n <= ys.length; n++) {
        let weight = Math.log1p(n + 1.0);
        sumX += weight;
        avgX += n * weight;
        avgY += ys[n - 1] * weight;
    }

    avgX /= sumX;
    avgY /= sumX;

    for (let n = 1; n <= ys.length; n++) {
        sumOxy += (n - avgX) * (ys[n - 1] - avgY) * Math.log1p(n + 1.0);
        sumOx2 += Math.pow(n - avgX, 2.0) * Math.log1p(n + 1.0);
    }

    let Oxy = sumOxy / sumX;
    let Ox2 = sumOx2 / sumX;

    return [avgY - (Oxy / Ox2) * avgX, Oxy / Ox2];
}

function calculateStarRating(beatmap, Mode) {
    return new Promise((resolve, reject) => {
        try {
            let srdata = [];
            beatmap.convert(Mode);
            let gradualDiff = new rosu.Difficulty().gradualDifficulty(beatmap);
            let i = 1;

            while (gradualDiff.nRemaining > 0) {
                let gradual_diff = gradualDiff.next();
                if (gradual_diff == undefined) continue;
                srdata.push(gradual_diff.stars);
                i += 1;
            }

            resolve(srdata);
        } catch(e) {
            reject(e);
        }
    })
}

function divideInto100Parts(data) {
    const result = [];
    const length = data.length;
    const step = Math.floor(length / 100);
    for (let i = 0; i < length; i += step) {
        result.push(data[i]);
    }
    let n = result.length - 100;
    for (let i = 0; i < n; i++) {
        const index = Math.floor(Math.random() * result.length);
        result.splice(index, 1);
    }
    return result;
}

function labelarray(count) {
    const countarray = new Array(100);
    countarray.fill(".");
    countarray[0] = 0;
    countarray[24] = 25
    countarray[49] = 50;
    countarray[74] = 75;
    countarray[count - 1] = 100;
    return countarray;
}

function modeconvertforlinks(mode) {
    switch (Number(mode)) {
        case 0:
            return "osu";
        case 1:
            return "taiko";
        case 2:
            return "fruits";
        case 3:
            return "mania";
        default:
            return "osu";
    }
}

module.exports = {
    GetUserData,
    GetMapData,
    GetUserRecent,
    GetUserScore,
    CalculatePPSR,
    CheckMapData,
    CalculateIfFC,
    Mod,
    URLBuilder,
    Tools,
    GetRank,
    CalculateGlobalPP,
    SRChart
};
