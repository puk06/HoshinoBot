const path = require("node:path");
const fs = require("../node_modules/fs-extra");
const axios = require("../node_modules/axios");
const cheerio = require("../node_modules/cheerio");
const ytdl = require("../node_modules/@distube/ytdl-core");
const ffmpeg = require("../node_modules/fluent-ffmpeg");
const readline = require("node:readline");

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

    static async getBoothItemInfo(url) {
        const ItemData = await this.getAPIResponse(url)
            .then(res => {
                const $ = cheerio.load(res);
                const title = $('title').text();
                const author = $('a[data-product-list="from market_show via market_item_detail to shop_index"]').text();
                const authorUrl = $().attr('href');
                const authorIcon = $(`img[alt=${author}]`).attr('src');
                const imageUrl = $('meta[name="twitter:image"]').attr('content');
                let priceString = $('.variation-price.u-text-right').text();
                priceString = priceString
                    .split('¥')
                    .filter((price) => price !== '')
                    .map((price) => Number(price.trim().replace(/,/g, '')).toLocaleString() + "円\n")
                    .join("");
                return { title, author, authorUrl, authorIcon, imageUrl, priceString };
            });
        return ItemData;
    }
}

/**
 * A class that checks for malicious code in files.
 */
class RatChecker{
    constructor() {
        this.conditions = [
            { regex: /eval\(/, message: "eval関数が使用されています" },
            { regex: /.{500,}/, message: "1行に大量の文字列が含まれています" },
            { regex: /\b(?:var|let|const)\s+\w+/g, countThreshold: 3, message: "1行に大量の変数が含まれています" },
            { regex: /(\bfunction\b|\b\w+\s*=\s*function\b|\b\w+\s*=>\s*{|\b\w+\s*=>\s*\w+)/g, countThreshold: 5, message: "1行に大量の関数が含まれています" },
            { regex: /[+\-*/]{5,}/, message: "1行に大量の演算子が含まれています" },
            { regex: /\brequest\b/, message: "request文が使用されています" },
            { regex: /webhook/g, message: "webhookの文字列が含まれています" },
            { regex: /\\x[0-9A-Fa-f]{2}/, message: "\\xXX形式のエスケープ文字が含まれています" }
        ];
    }

    searchDirectory(dir) {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) {
                    console.error(`❌ ディレクトリの読み取りに失敗しました: ${dir}`);
                    return reject(err);
                }
    
                let fileChecks = files.map(file => {
                    const filePath = path.join(dir, file);
                    return new Promise((resolve, reject) => {
                        fs.stat(filePath, (err, stats) => {
                            if (err) {
                                console.error(`❌ ファイルの情報取得に失敗しました: ${filePath}`);
                                return reject(err);
                            }
    
                            if (stats.isDirectory()) {
                                this.searchDirectory(filePath).then(resolve).catch(reject);
                            } else if (stats.isFile()) {
                                this.check(filePath).then(resolve).catch(reject);
                            }
                        });
                    });
                });
    
                Promise.all(fileChecks).then(results => {
                    resolve(results.flat());
                }).catch(reject);
            });
        });
    }

    check(filePath) {
        return new Promise((resolve, reject) => {
            const fileStream = fs.createReadStream(filePath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });
    
            let lineNumber = 0;
            let results = [];
    
            rl.on("line", (line) => {
                lineNumber++;
                let reasons = [];
                let reasonCount = 0;
                this.conditions.forEach(condition => {
                    const matches = line.match(condition.regex);
                    if (matches && (!condition.countThreshold || matches.length >= condition.countThreshold)) {
                        reasonCount++;
                        reasons.push(condition.message);
                    }
                });
                if (reasonCount > 0) {
                    results.push({
                        file: filePath,
                        line: lineNumber,
                        content: line.trim(),
                        reasons: reasons
                    });
                }
            });
    
            rl.on("close", () => {
                resolve(results);
            });
    
            rl.on("error", (err) => {
                reject(err);
            });
        });
    }
}

/**
 * A class that provides methods to download videos from Twitter.
 */
class TwitterDownloader {
    constructor() {
        const script_dir = __dirname;
        this.request_details_file = path.join(script_dir, "RequestDetails.json");
        const request_details = JSON.parse(
            fs.readFileSync(this.request_details_file, "utf-8")
        );
        const { features, variables } = request_details;
        this.features = features;
        this.variables = variables;
    }

    async get_tokens(tweet_url) {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "TE": "trailers",
        };
    
        const session = axios.create({ headers });
        let response = await session.get(tweet_url);
    
        if (response.status !== 200) {
            throw new Error(
                `Failed to get tweet page. Status code: ${response.status}. Tweet url: ${tweet_url}`
            );
        }
    
        const redirect_url_match = response.data.match(/content="0; url = (https:\/\/twitter\.com\/[^"]+)"/);
    
        if (!redirect_url_match) {
            throw new Error(
                `Failed to find redirect URL. Tweet url: ${tweet_url}`
            );
        }
    
        const redirect_url = redirect_url_match[1];
    
        const tok_match = redirect_url.match(/tok=([^&"]+)/);
    
        if (!tok_match) {
            throw new Error(
                `Failed to find 'tok' parameter in redirect URL. Redirect URL: ${redirect_url}`
            );
        }
    
        const tok = tok_match[1];
    
        response = await session.get(redirect_url);
    
        if (response.status !== 200) {
            throw new Error(
                `Failed to get redirect page. Status code: ${response.status}. Redirect URL: ${redirect_url}`
            );
        }
    
        const data_match = response.data.match(/<input type="hidden" name="data" value="([^"]+)"/);
    
        if (!data_match) {
            throw new Error(
                `Failed to find 'data' parameter in redirect page. Redirect URL: ${redirect_url}`
            );
        }
    
        const data = data_match[1];
    
        const auth_url = "https://x.com/x/migrate";
        const auth_params = { tok, data };
    
        response = await session.post(auth_url, auth_params);
    
        if (response.status !== 200) {
            throw new Error(
                `Failed to authenticate. Status code: ${response.status}. Auth URL: ${auth_url}`
            );
        }
    
        const mainjs_url = response.data.match(/https:\/\/abs\.twimg\.com\/responsive-web\/client-web-legacy\/main\.[^\.]+\.js/g);
    
        if (!mainjs_url || mainjs_url.length === 0) {
            throw new Error(
                `Failed to find main.js file. If you are using the correct Twitter URL this suggests a bug in the script. Please open a GitHub issue and copy and paste this message. Tweet url: ${tweet_url}`
            );
        }
    
        const mainjs = await session.get(mainjs_url[0]);
    
        if (mainjs.status !== 200) {
            throw new Error(
                `Failed to get main.js file. If you are using the correct Twitter URL this suggests a bug in the script. Please open a GitHub issue and copy and paste this message. Status code: ${mainjs.status}. Tweet url: ${tweet_url}`
            );
        }
    
        const bearer_token = mainjs.data.match(/AAAAAAAAA[^"]+/g);
    
        if (!bearer_token || bearer_token.length === 0) {
            throw new Error(
                `Failed to find bearer token. If you are using the correct Twitter URL this suggests a bug in the script. Please open a GitHub issue and copy and paste this message. Tweet url: ${tweet_url}, main.js url: ${mainjs_url[0]}`
            );
        }
    
        session.defaults.headers.common["authorization"] = `Bearer ${bearer_token[0]}`;
        const guest_token_response = await session.post("https://api.twitter.com/1.1/guest/activate.json");
    
        if (guest_token_response.status !== 200) {
            throw new Error(
                `Failed to activate guest token. Status code: ${guest_token_response.status}. Tweet url: ${tweet_url}`
            );
        }
    
        const guest_token = guest_token_response.data.guest_token;
    
        if (!guest_token) {
            throw new Error(
                `Failed to find guest token. If you are using the correct Twitter URL this suggests a bug in the script. Please open a GitHub issue and copy and paste this message. Tweet url: ${tweet_url}, main.js url: ${mainjs_url[0]}`
            );
        }
    
        return [bearer_token[0], guest_token];
    }

    get_details_url(tweet_id, features, variables) {
        const variablesCopy = { ...variables };
        variablesCopy.tweetId = tweet_id;
    
        return `https://twitter.com/i/api/graphql/0hWvDhmW8YQ-S_ib3azIrw/TweetResultByRestId?variables=${encodeURIComponent(
            JSON.stringify(variablesCopy)
        )}&features=${encodeURIComponent(JSON.stringify(features))}`;
    }

    async get_tweet_details(tweet_url, guest_token, bearer_token) {
        const tweet_id = tweet_url.match(/(?<=status\/)\d+/);
        if (!tweet_id || tweet_id.length !== 1) {
            throw new Error(
                `Could not parse tweet id from your url. Make sure you are using the correct url. If you are, then file a GitHub issue and copy and paste this message. Tweet url: ${tweet_url}`
            );
        }
    
        const url = this.get_details_url(tweet_id[0], this.features, this.variables);
    
        const details = await axios.get(url, {
            headers: {
                authorization: `Bearer ${bearer_token}`,
                "x-guest-token": guest_token,
            },
        });
    
        let max_retries = 10;
        let cur_retry = 0;
        while (details.status === 400 && cur_retry < max_retries) {
            let error_json;
            try {
                error_json = JSON.parse(details.data);
            } catch (e) {
                throw new Error(
                    `Failed to parse json from details error. details text: ${details.data} If you are using the correct Twitter URL this suggests a bug in the script. Please open a GitHub issue and copy and paste this message. Status code: ${details.status}. Tweet url: ${tweet_url}`
                );
            }
    
            if (!("errors" in error_json)) {
                throw new Error(
                    `Failed to find errors in details error json. If you are using the correct Twitter URL this suggests a bug in the script. Please open a GitHub issue and copy and paste this message. Status code: ${details.status}. Tweet url: ${tweet_url}`
                );
            }
    
            const needed_variable_pattern = /Variable '([^']+)'/;
            const needed_features_pattern = /The following features cannot be null: ([^"]+)/;
    
            for (const error of error_json.errors) {
                const needed_vars = error.message.match(needed_variable_pattern);
                for (const needed_var of needed_vars) {
                    variables[needed_var] = true;
                }
    
                const needed_features = error.message.match(needed_features_pattern);
                for (const nf of needed_features) {
                    for (const feature of nf.split(",")) {
                        this.features[feature.trim()] = true;
                    }
                }
            }
    
            const url = this.get_details_url(tweet_id[0], this.features, this.variables);
    
            const details = await axios.get(url, {
                headers: {
                    authorization: `Bearer ${bearer_token}`,
                    "x-guest-token": guest_token,
                },
            });
    
            cur_retry += 1;
    
            if (details.status === 200) {
                request_details.variables = this.variables;
                request_details.features = this.features;
    
                fs.writeFileSync(
                    this.request_details_file,
                    JSON.stringify(request_details, null, 4)
                );
            }
        }
    
        if (details.status !== 200) {
            throw new Error(
                `Failed to get tweet details. If you are using the correct Twitter URL this suggests a bug in the script. Please open a GitHub issue and copy and paste this message. Status code: ${details.status}. Tweet url: ${tweet_url}`
            );
        }
    
        return details;
    }

    createVideoUrls(jsonData) {
        const mediaList = jsonData.data.tweetResult.result.legacy.extended_entities.media;
        const videoUrlList = [];
    
        if (mediaList) {
            for (const mediaItem of mediaList) {
                const videoInfo = mediaItem.video_info;
                if (!videoInfo) continue;
    
                const variants = videoInfo.variants;
                if (!variants) continue;
    
                let videoUrl = null;
                let maxBitrate = 0;
    
                for (const variant of variants) {
                    if (variant.bitrate && variant.bitrate > maxBitrate) {
                        maxBitrate = variant.bitrate;
                        videoUrl = variant.url;
                    } else if (variant.bitrate == 0) {
                        videoUrl = variant.url;
                    }
                }
    
                if (videoUrl) {
                    videoUrlList.push(videoUrl);
                }
            }
        }
        return videoUrlList;
    }

    async download_video(tweet_url, output_file, output_folder_path) {
        try {
            const [bearer_token, guest_token] = await this.get_tokens(tweet_url);
            const resp = await this.get_tweet_details(tweet_url, guest_token, bearer_token);
            const videoUrls = this.createVideoUrls(resp.data);
    
            let baseFileName = output_file ? output_file.replace(".mp4", "") : "output";
            if (!baseFileName) baseFileName = "output";
    
            if (!output_file.includes(".mp4")) {
                output_file += ".mp4";
            }
    
            if (!fs.existsSync(output_folder_path)) {
                fs.mkdirSync(output_folder_path, { recursive: true });
            }
    
            for (let i = 0; i < videoUrls.length; i++) {
                const videoUrl = videoUrls[i];
                let outputPath = "";
                if (videoUrls.length === 1) {
                    outputPath = output_file === ".mp4" || output_file === "" || output_file === undefined ? "output.mp4" : output_file;
                } else {
                    outputPath = `${baseFileName}-${i + 1}.mp4`;
                }
                const fullOutputPath = path.resolve(output_folder_path, outputPath);
                const response = await Tools.getAPIResponse(videoUrl, {
                    responseType: "stream"
                });
    
                response.pipe(fs.createWriteStream(fullOutputPath));
    
                await new Promise((resolve, reject) => {
                    response.on("end", () => {
                        resolve();
                    });
    
                    response.on("error", (error) => {
                        reject(error);
                    });
                });
            }
    
            console.log("All videos downloaded successfully.");
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

/**
 * A class that provides methods to download videos from YouTube.
 */
class YoutubeDownloader {
    constructor(url, output_folder_path) {
        this.url = url;
        this.output_folder_path = output_folder_path;
    }

    async download_video() {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(this.output_folder_path)) {
                fs.mkdirSync(this.output_folder_path, { recursive: true });
            }
            const videoPath = path.join(this.output_folder_path, "output-temp.mp4");
            const audioPath = path.join(this.output_folder_path, "output-temp.wav");
            const mergePath = path.join(this.output_folder_path, "output.mp4");
    
            const video = ytdl(this.url, { filter: format => format.container === "mp4", quality: "highestvideo" });
            const audio = ytdl(this.url, { quality: "highestaudio" });
    
            const videoStream = fs.createWriteStream(videoPath);
            const audioStream = fs.createWriteStream(audioPath);
    
            video.pipe(videoStream);
            audio.pipe(audioStream);
    
            let videoFinished = false;
            let audioFinished = false;
    
            const checkCompletion = () => {
                if (videoFinished && audioFinished) {
                    ffmpeg()
                        .input(videoPath)
                        .input(audioPath)
                        .outputOptions(["-c:v copy", "-c:a aac", "-map 0:v:0", "-map 1:a:0"])
                        .output(mergePath)
                        .on("end", () => {
                            fs.removeSync(videoPath);
                            fs.removeSync(audioPath);
                            resolve();
                        })
                        .on("error", (err) => {
                            reject(err);
                        })
                        .run();
                }
            };
    
            videoStream.on("finish", () => {
                videoFinished = true;
                checkCompletion();
            });
    
            videoStream.on("error", (err) => {
                reject(err);
            });
    
            audioStream.on("finish", () => {
                audioFinished = true;
                checkCompletion();
            });
    
            audioStream.on("error", (err) => {
                reject(err);
            });
        });
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
    ImJugglerEX,
    RatChecker,
    TwitterDownloader,
    YoutubeDownloader
};
