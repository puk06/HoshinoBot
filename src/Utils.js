const path = require("node:path");
const fs = require("../node_modules/fs-extra");
const axios = require("../node_modules/axios");

/**
 * A utility class that provides various helper methods.
 */
class Tools {

    /**
     * Formats the given time in seconds into a string representation of minutes and seconds.
     * @param {number} sec - The time in seconds.
     * @returns {string} The formatted time string in the format "minutes:seconds".
     */
    static formatTime(sec) {
        const min = Math.floor(sec / 60);
        const second = Math.floor(sec % 60);
        return `${min}:${second.toString().padStart(2, "0")}`;
    }

    /**
     * Formats the hits based on the given score and mode.
     *
     * @param {object} score - The score object containing hit counts.
     * @param {number} mode - The mode to determine the format.
     * @returns {string} The formatted hits.
     */
    static formatHits(score, mode) {
        switch (mode) {
            case 0:
                return `{${score.n300}/${score.n100}/${score.n50}/${score.misses}}`;
    
            case 1:
                return `{${score.n300}/${score.n100}/${score.misses}}`;
    
            case 2:
                return `{${score.n300}/${score.n100}/${score.n50}/${score.misses}}`;
    
            case 3:
                return `{${score.nGeki}/${score.n300}/${score.nKatu}/${score.n100}/${score.n50}/${score.misses}}`;

            default:
                return `{${score.n300}/${score.n100}/${score.n50}/${score.misses}}`;
        }
    }

    /**
     * Finds the different elements between two arrays.
     * @param {Array} array1 - The first array.
     * @param {Array} array2 - The second array.
     * @returns {Array|null} - An array containing the different elements, or null if there are no differences.
     */
    static findDifferentElements(array1, array2) {
        if (array1.length == 0) return array2.length > 0 ? array2 : null;
        if (array2.length == 0) return null;
        if (array2.length < 15 || array1.length < 15) {
            return array2.filter((x) => !array1.includes(x)).length > 0 ? array2.filter((x) => !array1.includes(x)) : null;
        }
    
        const diffArray = [];
        const newCharts = array2.filter(chart => !array1.includes(chart) && !array1.includes(chart - 1));
        if (newCharts.length > 0) {
            diffArray.push(...newCharts);
            const filteredDiffArray = diffArray.filter(chart => !array1.includes(chart) && !array1.includes(chart - 1));
            const finalDiffArray = filteredDiffArray.filter((chart, index, array) => {
                return array.indexOf(chart) == index;
            });
            return finalDiffArray.length > 0 ? finalDiffArray : null;
        } else {
            return null;
        }
    }
    
    /**
     * Returns an array of file names sorted by their last modified date in ascending order.
     * @param {string} directory - The directory path to search for files.
     * @returns {string[]} - An array of file names sorted by their last modified date.
     */
    static getFilesSortedByDate(directory) {
        const fileStats = fs.readdirSync(directory).map(file => ({
            name: file,
            stat: fs.statSync(path.join(directory, file))
        }));
        fileStats.sort((a, b) => a.stat.mtime.getTime() - b.stat.mtime.getTime());
        return fileStats.map(fileStat => fileStat.name);
    }

    /**
     * Converts a rank into its corresponding emoji representation.
     * @param {string} rank - The rank to be converted.
     * @returns {string} - The emoji representation of the rank.
     */
    static rankconverter(rank) {
        switch (rank) {
            case "F":
                return "<:rankingF:1198994687445442701>";
            case "D":
                return "<:rankingD:1198994691123847270>";
            case "C":
                return "<:rankingC:1198994693275529329>";
            case "B":
                return "<:rankingB:1198994696299630602>";
            case "A":
                return "<:rankingA:1198994699298553906>";
            case "S":
                return "<:rankingS:1198994677433643008>";
            case "X":
                return "<:rankingX:1198994685595750453>";
            case "SH":
                return "<:rankingSH:1198994680617111612>";
            case "XH":
                return "<:rankingXH:1198994682731040870>";
            default:
                return "";
        }
    }

    /**
     * Converts a rank into its corresponding emoji representation for casino.
     * @param {number} rank - The rank to be converted.
     * @returns {string} - The emoji representation of the rank.
     */
    static rankConverterForCasino(rank) {
        switch (rank) {
            case 1:
                return "<:VIP:1258297231929376768> ";
            case 2:
                return "<:VIPplus:1258297739909922857> ";
            case 3:
                return "<:MVP:1258297787213156363> ";
            case 4:
                return "<:MVPplus:1258297719454175273> ";
            case 5:
                return "<:MVPplusplus:1258297802354589777> ";
            default:
                return "";
        }
    }

    /**
     * Converts a rank into its corresponding letter representation.
     * @param {string} rank - The rank to be converted.
     * @returns {Number} - The numeric representation of the rank.
     */
    static getRankFromValue(value) {
        switch (value) {
            case "VIP":
                return 1;
            case "VIP+":
                return 2;
            case "MVP":
                return 3;
            case "MVP+":
                return 4;
            case "MVP++":
                return 5;
        }
    }

    /**
     * Checks if a value is NaN and returns 0 if it is.
     * @param {number} num - The value to check.
     * @returns {number} - The original value if it is not NaN, otherwise 0.
     */
    static isNaNwithNumber(num) {
        return isNaN(num) ? 0 : num;
    }

    /**
     * Formats a number by adding a leading zero if it is less than 10.
     * @param {number} num - The number to be formatted.
     * @returns {string} The formatted number.
     */
    static formatNumber(num) {
        return num < 10 ? "0" + num : num.toString();
    }

    /**
     * Converts a mode string to its corresponding numeric value.
     * @param {string} str - The mode string to be converted.
     * @returns {number} The numeric value representing the mode.
     */
    static modeConvertMap(str) {
        switch (str) {
            case "osu":
                return 0;
            case "taiko":
                return 1;
            case "catch":
                return 2;
            case "mania":
                return 3;
            default:
                return 0;
        }
    }

    /**
     * Converts a mode string to its corresponding search string.
     * @param {string} str - The mode string to be converted.
     * @returns {string} The search string representing the mode.
     */
    static modeConvertSearch(str) {
        if (str == "catch") return "fruits";
        return str;
    }

    /**
     * Converts a number representing a game mode to its corresponding string representation.
     * @param {number} num - The number representing the game mode.
     * @returns {string} The string representation of the game mode.
     */
    static modeConvertAcc(num) {
        switch (Number(num)) {
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

    /**
     * Creates a progress bar based on the given percentage.
     * @param {number} percent - The percentage value of the progress bar.
     * @returns {string} The progress bar string.
     */
    static createProgressBar(percent) {
        const progress = Math.round(20 * percent / 100);
        const emptyProgress = Math.round(20 * (100 - percent) / 100);
        const progressText = "#".repeat(progress);
        const emptyProgressText = "-".repeat(emptyProgress);
        return `[${progressText}${emptyProgressText}]`;
    }

    /**
     * Calculates the match percentage between two strings.
     *
     * @param {string} current - The current string.
     * @param {string} total - The total string.
     * @returns {number} The match percentage between the two strings.
     */
    static matchPercentage(current, total) {
        let data = current.split("").map((_, index) => current.slice(0, index + 1));
        for (let i = 0; i < current.length; i++) {
            data.push(current.slice(i));
        }
        data = data.flat().filter((x, i, self) => self.indexOf(x) === i);
        let matchPercentage = 0;
        for (const element of data) {
            const matchdata = total.replace(element, "");
            if ((total.length - matchdata.length) / total.length * 100 >= matchPercentage) {
                matchPercentage = (total.length - matchdata.length) / total.length * 100;
            }
        }
        return matchPercentage;
    }

    /**
     * Fetches data from the specified API endpoint.
     * @param {string} url - The URL of the API endpoint.
     * @param {object} options - The request options.
     * @returns {Promise} The response data from the API.
     */
    static async getAPIResponse(url, options = {}) {
        try {
            const response = await axios.get(url, options);
            return response.data;
        } catch (error) {
            throw new Error(`An error occurred while fetching data from the API: ${error}`);
        }
    }

    /**
     * Calculates the passed objects based on the given score and mode.
     * @param {object} score - The score object containing hit counts.
     * @param {number} mode - The mode to determine the calculation.
     * @returns {number} The number of passed objects.
     */
    static calcPassedObject(score, mode) {
        let passedObjects = 0;
        switch (mode) {
            case 0:
                passedObjects = Number(score.count300) + Number(score.count100) + Number(score.count50) + Number(score.countmiss);
                break;

            case 1:
                passedObjects = Number(score.count300) + Number(score.count100) + Number(score.countmiss);
                break;

            case 2:
                passedObjects = Number(score.count300) + Number(score.count100) + Number(score.countmiss);
                break;

            case 3:
                passedObjects = Number(score.countgeki) + Number(score.count300) + Number(score.countkatu) + Number(score.count100) + Number(score.count50) + Number(score.countmiss);
                break;
                
            default:
                passedObjects = Number(score.count300) + Number(score.count100) + Number(score.count50) + Number(score.countmiss);
                break;
        }
        return passedObjects;
    }
}


class Juggler {
    constructor(user, name, setting=6, big_single=172, big_cherry=72, reg_single=172, reg_cherry=72, grape=10600, cherry_single=1840, replay=8978, bell=60, pierrot=60) {
        this.name = name;
        this.setting = setting;
        this.rotation = user.rotation;
        this.rotation_total = user.rotation_total;
        this.medal = user.medal;
        this.counter = user.counter;
        this.flag_big = user.flag_big;
        this.flag_reg = user.flag_reg;

        this.big_single = big_single;
        this.big_cherry = big_cherry;
        this.reg_single = reg_single;
        this.reg_cherry = reg_cherry;
        this.grape = grape;
        this.cherry_single = cherry_single;
        this.replay = replay;
        this.pierrot = pierrot;
        this.bell = bell;

        this.big_total = big_single + big_cherry;
        this.reg_total = reg_single + reg_cherry;
        this.bonus_total = this.big_total + this.reg_total;
        this.cherry_total = big_cherry + reg_cherry + cherry_single;

        this.th_big_single = big_single;
        this.th_big_cherry = this.th_big_single + big_cherry;
        this.th_reg_single = this.th_big_cherry + reg_single;
        this.th_reg_cherry = this.th_reg_single + reg_cherry;
        this.th_grape = this.th_reg_cherry + grape;
        this.th_cherry_single = this.th_grape + cherry_single;
        this.th_replay = this.th_cherry_single + replay;
        this.th_bell = this.th_replay + bell;
        this.th_pierrot = this.th_bell + pierrot;
    }

    showSpec() {
        return `設定:${this.setting}\nBIG確率:1/${Math.round(65536 / this.big_total * 100) / 100}\nREG確率:1/${Math.round(65536 / this.reg_total * 100) / 100}\nボーナス合算:1/${Math.round(65536 / this.bonus_total * 100) / 100}\nブドウ確率:1/${Math.round(65536 / this.grape * 100) / 100}\nチェリー確率:1/${Math.round(65536 / this.cherry_total * 100) / 100}\nリプレイ確率:1/${Math.round(65536 / this.replay * 100) / 100}\nピエロ確率:1/${Math.round(65536 / this.pierrot * 100) / 100}\nベル確率:1/${Math.round(65536 / this.bell * 100) / 100}`;
    }

    showStatus() {
        const p_big = this.counter[0] === 0 ? `BIG確率:0/${this.rotation_total}, ` : `BIG確率:1/${this.rotation_total / this.counter[0]}, `;
        const p_reg = this.counter[1] === 0 ? `REG確率:0/${this.rotation_total}, ` : `REG確率:1/${this.rotation_total / this.counter[1]}, `;
        const p_total = (this.counter[0] + this.counter[1]) === 0 ? `ボーナス合算確率:0/${this.rotation_total}` : `ボーナス合算確率:1/${this.rotation_total / (this.counter[0] + this.counter[1])}`;
        return `現在の回転数:${this.rotation}\n現在のメダル数:${this.medal}\n総回転数:${this.rotation_total}\nBIG:${this.counter[0]}回\nREG:${this.counter[1]}回\n${p_big}\n${p_reg}\n${p_total}`

    }

    showCounter() {
        const n_koyaku = this.counter.slice(2).map((count, _) => count === 0 ? 0 : this.rotation_total / count);
        return `ブドウ確率:1/${Math.round(n_koyaku[0] * 100) / 100}\nチェリー確率:1/${Math.round(n_koyaku[1] * 100) / 100}\nリプレイ確率:1/${Math.round(n_koyaku[2] * 100) / 100}\nベル確率:1/${Math.round(n_koyaku[3] * 100) / 100}\nピエロ確率:1/${Math.round(n_koyaku[4] * 100) / 100}`;
    }

    draw() {
        let result = "ハズレ";
        if (this.medal < 3) {
            result =  "メダルが足りません";
            return {
                result: result,
                user: {
                    rotation: this.rotation,
                    rotation_total: this.rotation_total,
                    medal: this.medal,
                    counter: this.counter,
                    flag_big: this.flag_big,
                    flag_reg: this.flag_reg
                }
            };
        }
        this.medal -= 3;
        this.rotation += 1;
        this.rotation_total += 1;

        if (this.flag_big || this.flag_reg) {
            if (this.flag_big) {
                this.medal += 325;
                this.flag_big = false;
                this.counter[0] += 1;
                this.rotation = 0;
                result = "BIG";
            }

            if (this.flag_reg) {
                this.medal += 104;
                this.flag_reg = false;
                this.counter[1] += 1;
                this.rotation = 0;
                result = "REG";
            }

            return {
                result: result,
                user: {
                    rotation: this.rotation,
                    rotation_total: this.rotation_total,
                    medal: this.medal,
                    counter: this.counter,
                    flag_big: this.flag_big,
                    flag_reg: this.flag_reg
                }
            };
        }

        const table = Math.floor(Math.random() * 65536);

        if (table < this.th_big_single) {
            this.flag_big = true;
            result = "ハズレ(ペカッ)";
        } else if (table < this.th_big_cherry) {
            this.flag_big = true;
            this.medal += 2;
            this.counter[3] += 1;
            result = "チェリー(ペカッ)";
        } else if (table < this.th_reg_single) {
            this.flag_reg = true;
            result = "ハズレ(ペカッ)";
        } else if (table < this.th_reg_cherry) {
            this.flag_reg = true;
            this.medal += 2;
            this.counter[3] += 1;
            result = "チェリー(ペカッ)";
        } else if (table < this.th_grape) {
            this.medal += 7;
            this.counter[2] += 1;
            result = "ブドウ";
        } else if (table < this.th_cherry_single) {
            this.medal += 2;
            this.counter[3] += 1;
            result = "チェリー";
        } else if (table < this.th_replay) {
            this.medal += 3;
            this.counter[4] += 1;
            result = "リプレイ";
        } else if (table < this.th_bell) {
            this.medal += 14;
            this.counter[5] += 1;
            result = "ベル";
        } else if (table < this.th_pierrot) {
            this.medal += 10;
            this.counter[6] += 1;
            result = "ピエロ";
        }

        return {
            result: result,
            user: {
                rotation: this.rotation,
                rotation_total: this.rotation_total,
                medal: this.medal,
                counter: this.counter,
                flag_big: this.flag_big,
                flag_reg: this.flag_reg
            }
        };
    }

    generateResultString(result) {
        const Emoji = {
            "pierrot": "<:pierrot:1257570705902538763>",
            "cherry": "<:cherry:1257570637736706078>",
            "bar": "<:bar:1257570563669622865>",
            "bell": "<:slotbell:1257569636485173310>",
            "big": "<:big:1257569774704263228>",
            "grape": "<:grape:1257570492639088692>",
            "replay": "<:replay:1257570384484765779>",
            "GOGO":"<:GOGO:1257572076613795872>"
        };

        switch (result) {
            case "BIG":
                return `${Emoji.big} ${Emoji.big} ${Emoji.big}`;
            case "REG":
                return `${Emoji.big} ${Emoji.big} ${Emoji.bar}`;
            case "ハズレ(ペカッ)": {
                const symbols = [Emoji.bar, Emoji.bell, Emoji.big, Emoji.grape, Emoji.replay];
                const result = [];
                while (result.length < 3) {
                    const randomIndex = Math.floor(Math.random() * symbols.length);
                    if (result.length == 2 && result[0] == symbols[randomIndex]) {
                        continue;
                    }
                    result.push(symbols[randomIndex]);
                }

                return `${result[0]} ${result[1]} ${result[2]}\n${Emoji.GOGO}`;
            }
            case "チェリー(ペカッ)":
                return `${Emoji.cherry} ${Emoji.cherry} ${Emoji.cherry}\n${Emoji.GOGO}`;
            case "ブドウ":
                return `${Emoji.grape} ${Emoji.grape} ${Emoji.grape}`;
            case "チェリー":
                return `${Emoji.cherry} ${Emoji.cherry} ${Emoji.cherry}`;
            case "リプレイ":
                return `${Emoji.replay} ${Emoji.replay} ${Emoji.replay}`;
            case "ベル":
                return `${Emoji.bell} ${Emoji.bell} ${Emoji.bell}`;
            case "ピエロ":
                return `${Emoji.pierrot} ${Emoji.pierrot} ${Emoji.pierrot}`;
            default: {
                const symbols = [Emoji.bar, Emoji.bell, Emoji.big, Emoji.grape, Emoji.replay];
                const result = [];
                while (result.length < 3) {
                    const randomIndex = Math.floor(Math.random() * symbols.length);
                    if (result.length == 2 && result[0] == symbols[randomIndex]) {
                        continue;
                    }
                    result.push(symbols[randomIndex]);
                }

                return `${result[0]} ${result[1]} ${result[2]}`;
            }
        }
    }
}

class ImJugglerEX extends Juggler {
    constructor(settei, user) {
        const big_single_prob = [160, 164, 164, 168, 168, 172];
        const big_cherry_prob = [68, 68, 68, 72, 72, 72];
        const reg_single_prob = [100, 104, 132, 144, 172, 172];
        const reg_cherry_prob = [44, 44, 56, 60, 72, 72];
        const grape_prob = [10100, 10100, 10100, 10100, 10100, 10600];

        const big_single = big_single_prob[settei - 1];
        const big_cherry = big_cherry_prob[settei - 1];
        const reg_single = reg_single_prob[settei - 1];
        const reg_cherry = reg_cherry_prob[settei - 1];
        const grape = grape_prob[settei - 1];

        super(user, "アイムジャグラーEXAE", settei, big_single, big_cherry, reg_single, reg_cherry, grape);
    }
}

module.exports = {
    Tools,
    ImJugglerEX
};
