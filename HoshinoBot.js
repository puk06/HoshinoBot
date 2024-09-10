//必要となるライブラリ
const { Client, EmbedBuilder, Events, GatewayIntentBits, ActivityType } = require("./node_modules/discord.js");
require("./node_modules/dotenv").config();
const fs = require("./node_modules/fs-extra");
const { tools, auth, v2 } = require("./node_modules/osu-api-extended");
const rosu = require("./node_modules/rosu-pp-js");
const { Readable } = require("node:stream");
const path = require("node:path");
const asciify = require("node:util").promisify(require("./node_modules/asciify"));
const osuLibrary = require("./src/osuLibrary.js");
const { Tools, ImJugglerEX, RatChecker, TwitterDownloader, YoutubeDownloader } = require("./src/Utils.js");
const AdmZip = require("./node_modules/adm-zip");
const MathJS = require("./node_modules/mathjs");

const apikey = process.env.APIKEY;
const token = process.env.TOKEN;
const osuclientid = process.env.CLIENTID;
const osuclientsecret = process.env.CLIENTSECRET;
const BotadminId = process.env.BOTADMINID;
const Furrychannel = process.env.FURRYCHANNEL;
const SLOT_SETTING = Math.floor(Math.random() * 6) + 1;
const MAMESTAGRAMAPI_BASEURL = "https://api.mamesosu.net/v1/";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

const UpdateFiles = [
	"HoshinoBot.js",
	"./src/Utils.js",
	"./src/osuLibrary.js",
	"package.json",
	"All Files"
];

client.on(Events.ClientReady, async () =>
	{
		await asciify("Hoshino Bot", { font: "larry3d" })
			.then(msg => console.log(msg))
			.catch(err => console.log(err));

		client.user?.setPresence({
			activities: [{
				name: "ほしのBot Ver1.1.0を起動中",
				type: ActivityType.Playing
			}]
		});

		setInterval(checkMap, 60000);

		let lastDate = new Date().getDate();
		setInterval(async () => {
			const currentDate = new Date().getDate();
			if (currentDate !== lastDate) {
				lastDate = currentDate;
				await rankedintheday();
				process.exit(0);
			}
		}, 1000);

		setInterval(() => {
			let serverJSONdata = fs.readJsonSync("./ServerDatas/talkcount.json");
			let count = Object.keys(serverJSONdata).length;
			client.user?.setPresence({
				activities: [{
					name: `h!help | Ping: ${client.ws.ping} | Servers: ${count}`,
					type: ActivityType.Playing
				}]
			});
			serverJSONdata = null;
		}, 10000);
		setInterval(makeBackup, 3600000);

		let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
		for (const key in bankData) {
			for (let i = 0; i < 2; i++) {
				bankData[key].slot[i].rotation = 0;
				bankData[key].slot[i].rotation_total = 0;
				bankData[key].slot[i].counter = [
					0,
					0,
					0,
					0,
					0,
					0,
					0
				];
				bankData[key].slot[i].flag_big = false;
				bankData[key].slot[i].flag_reg = false;
			}
		}
		fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });
		bankData = null;
	}
);

client.on(Events.InteractionCreate, async (interaction) =>
	{
		try {
			if (interaction.isAutocomplete()) {
				switch (interaction.commandName) {
					case "send": {
						const focusedOption = interaction.options.getFocused(true);
						let choices = [];
						if (focusedOption.name === "username") {
							let users = fs.readJsonSync("./ServerDatas/UserBankData.json");
							for (const userData in users) choices.push(users[userData].username);
							users = null;
						}
						const filtered = choices
							.filter((choice) => choice.startsWith(focusedOption.value))
							.slice(0, 25);

						await interaction.respond(
							filtered.map((choice) => ({ name: choice, value: choice }))
						);
					}
					break;

					case "quotecount":
					case "quote": {
						const focusedOption = interaction.options.getFocused(true);
						let choices = [];
						if (focusedOption.name === "tag") {
							let allQuotes = fs.readJsonSync("./ServerDatas/Quotes.json");
							for (const tag in allQuotes) choices.push(tag);
							allQuotes = null;
						}
						const filtered = choices
							.filter((choice) => choice.startsWith(focusedOption.value))
							.slice(0, 25);

						await interaction.respond(
							filtered.map((choice) => ({ name: choice, value: choice }))
						);
					}
					break;

					case "piccount":
					case "pic": {
						const focusedOption = interaction.options.getFocused(true);
						let choices = [];
						if (focusedOption.name === "tag") {
							let allTags = fs.readdirSync("./Pictures/tag").filter(folder => fs.existsSync(`./Pictures/tag/${folder}/DataBase.json`));
							for (const tag of allTags) choices.push(tag);
							allTags = null;
						}
						const filtered = choices
							.filter((choice) => choice.startsWith(focusedOption.value))
							.slice(0, 25);

						await interaction.respond(
							filtered.map((choice) => ({ name: choice, value: choice }))
						);
					}
					break;

					case "update": {
						const focusedOption = interaction.options.getFocused(true);
						let choices = [];
						if (focusedOption.name === "file") {
							for (const file of UpdateFiles) choices.push(file);
						}

						const filtered = choices
							.filter((choice) => choice.startsWith(focusedOption.value))
							.slice(0, 25);

						await interaction.respond(
							filtered.map((choice) => ({ name: choice, value: choice }))
						);
					}
					break;
				}
			}
			if (!interaction.isCommand()) return;
			commandLogs(interaction, interaction.commandName, 0);

			if (interaction.commandName == "slotsetting") {
				if (interaction.user.id !== BotadminId) {
					await interaction.reply("このコマンドはBot管理者専用です。");
					return;
				}

				await interaction.reply({
					content: `現在のスロット設定は**${SLOT_SETTING}**です。`,
					ephemeral: true
				});
				return;
			}

			if (interaction.commandName == "coinflip") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (!bankData[interaction.user.id]) {
					await interaction.reply("このカジノにユーザー登録されていないようです。\`/regcasino\`で登録してください。");
					return;
				}

				let Rank = interaction.options.get("rank")?.value;
				if (!Rank) Rank = 0;
				if (bankData[interaction.user.id].rank < Rank) {
					await interaction.reply("あなたのランクが指定されたランク以下のため、このゲームを開始できません。");
					return;
				}

				let casinoData = fs.readJsonSync("./ServerDatas/CasinoStatus.json");

				if (casinoData[interaction.channel.id]) {
					await interaction.reply("このチャンネルで既にゲームが進行中です。");
					return;
				}

				const bet = interaction.options.get("bet").value;
				if (bet < 0) {
					await interaction.reply("0以上の金額を入力してください。");
					return;
				}

				if (bet > bankData[interaction.user.id].balance) {
					await interaction.reply("所持金以上の金額を入力しています。");
					return;
				}

				casinoData[interaction.channel.id] = {
					game: "コインフリップ",
					starter: interaction.user.id,
					bet: bet,
					rank: Rank,
					players: [
						{
							id: interaction.user.id,
							username: interaction.user.username
						}
					]
				};

				fs.writeJsonSync("./ServerDatas/CasinoStatus.json", casinoData, { spaces: 4, replacer: null });
				if (Rank == 0) {
					await interaction.reply(`${Tools.rankConverterForCasino(bankData[interaction.user.id].rank)}**${interaction.user.username}**さんがコインフリップゲーム(**${bet}**コイン)を開始しました。参加したい場合は\`/join\`を入力してください。`);
				} else {
					const RankString = Tools.getRankFromValue(Rank);
					await interaction.reply(`${Tools.rankConverterForCasino(bankData[interaction.user.id].rank)}**${interaction.user.username}**さんが${RankString}以上のランク向けコインフリップゲーム(**${bet}**コイン)を開始しました。参加したい場合は\`/join\`を入力してください。`);
				}
				bankData = null;
				casinoData = null;
				return;
			}

			if (interaction.commandName == "slot") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (!bankData[interaction.user.id]) {
					await interaction.reply("このカジノにユーザー登録されていないようです。\`/regcasino\`で登録してください。");
					return;
				}

				const Type = interaction.options.get("type").value;
				let Auto = interaction.options.get("auto")?.value;
				if (Auto) Auto = Math.ceil(Auto);
				if (Auto && Auto < 0) {
					await interaction.reply("Auto欄には0以上の回数を入力してください。");
					return;
				} else if (!Auto) Auto = 1;
				if (Auto > 30000) Auto = 30000;
				const USER_DATA = bankData[interaction.user.id].slot[Type == 5 ? 0 : 1];

				const Juggler = new ImJugglerEX(SLOT_SETTING, USER_DATA);
				let Result = null;
				let slotFail = false;
				let slotFailTimes = 0;
				for (let i = 0; i < Auto; i++) {
					Result = Juggler.draw();
					if (Result.result == "メダルが足りません") {
						slotFail = true;
						slotFailTimes = i;
						break;
					}
					USER_DATA.medal = Result.user.medal;
					USER_DATA.rotation = Result.user.rotation;
					USER_DATA.rotation_total = Result.user.rotation_total;
					USER_DATA.counter = Result.user.counter;
					USER_DATA.flag_big = Result.user.flag_big;
					USER_DATA.flag_reg = Result.user.flag_reg;
					bankData[interaction.user.id].slot[Type == 5 ? 0 : 1] = USER_DATA;
				}
				fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });

				const Status = Juggler.showStatus();
				const Counter = Juggler.showCounter();

				if (slotFail) {
					const Embed = new EmbedBuilder()
						.setTitle(`スロット(${slotFailTimes} / ${Auto}回)`)
						.setDescription(`データ元機種名: アイムジャグラーEXAE`)
						.setColor("Blue")
						.addFields({ name: "Result", value: Result.result, inline: true })
						.addFields({ name: "Status", value: Status, inline: true })
						.addFields({ name: "Counter", value: Counter, inline: true })
						.setTimestamp();

					await interaction.reply({
						content: "メダルが足りないため、スロットは中断されました。",
						embeds: [Embed]
					});
					return;
				}

				const Embed = new EmbedBuilder()
					.setTitle(`スロット(${Auto}回)`)
					.setDescription(`データ元機種名: アイムジャグラーEXAE`)
					.setColor("Blue")
					.addFields({ name: "Result", value: Result.result, inline: true })
					.addFields({ name: "Status", value: Status, inline: true })
					.addFields({ name: "Counter", value: Counter, inline: true })
					.setTimestamp();

				await interaction.reply({
					content: Juggler.generateResultString(Result.result),
					embeds: [Embed]
				});
				return;
			}

			if (interaction.commandName == "dice") {
				await interaction.reply(`サイコロを振った結果: **${Math.floor(Math.random() * 6) + 1}**`);
				return;
			}

			if (interaction.commandName == "medal") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (!bankData[interaction.user.id]) {
					await interaction.reply("このカジノにユーザー登録されていないようです。\`/regcasino\`で登録してください。");
					return;
				}

				const Coin = Math.ceil(interaction.options.get("coin").value);
				const Type = interaction.options.get("type").value;

				if (Coin <= 0) {
					await interaction.reply("0以上の金額を入力してください。");
					return;
				}

				if (Type == 5) {
					if (bankData[interaction.user.id].balance < Coin) {
						await interaction.reply("現在の所持金以上の金額を交換しようとしています。");
						return;
					}
					let medals = Math.floor(Coin / 5);
					bankData[interaction.user.id].balance -= medals * 5;
					bankData[interaction.user.id].slot[0].medal += medals;
					fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });
					await interaction.reply(`${medals * 5}コインを5コインスロット用のメダル${medals}枚に変換しました。`);
				} else if (Type == 20) {
					if (bankData[interaction.user.id].balance < Coin) {
						await interaction.reply("現在の所持金以上のお金を交換しようとしています。");
						return;
					}
					let medals = Math.floor(Coin / 20);
					bankData[interaction.user.id].balance -= medals * 20;
					bankData[interaction.user.id].slot[1].medal += medals;
					fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });
					await interaction.reply(`${medals * 20}コインを20コインスロット用のメダル${medals}枚に変換しました。`);
				}
				bankData = null;
				return;
			}

			if (interaction.commandName == "coin") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (!bankData[interaction.user.id]) {
					await interaction.reply("このカジノにユーザー登録されていないようです。\`/regcasino\`で登録してください。");
					return;
				}

				const Medal = Math.ceil(interaction.options.get("medal").value);
				const Type = interaction.options.get("type").value;

				if (Medal <= 0) {
					await interaction.reply("0以上の金額を入力してください。");
					return;
				}

				if (Type == 5) {
					if (bankData[interaction.user.id].slot[0].medal < Medal) {
						await interaction.reply("現在の所持メダル以上のメダルを交換しようとしています。");
						return;
					}
					let coins = Medal * 5;
					bankData[interaction.user.id].slot[0].medal -= Medal;
					bankData[interaction.user.id].balance += coins;
					fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });
					await interaction.reply(`5コインスロットメダル${Medal}枚を${coins}コインに変換しました。`);
				} else if (Type == 20) {
					if (bankData[interaction.user.id].slot[1].medal < Medal) {
						await interaction.reply("現在の所持メダル以上のメダルを交換しようとしています。");
						return;
					}
					let coins = Medal * 20;
					bankData[interaction.user.id].slot[1].medal -= Medal;
					bankData[interaction.user.id].balance += coins;
					fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });
					await interaction.reply(`20コインスロットメダル${Medal}枚を${coins}コインに変換しました。`);
				}
				bankData = null;
				return;
			}

			if (interaction.commandName == "join" || interaction.commandName == "addbot") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (!bankData[interaction.user.id] && interaction.commandName != "addbot") {
					await interaction.reply("このカジノにユーザー登録されていないようです。\`/regcasino\`で登録してください。");
					return;
				}

				let casinoData = fs.readJsonSync("./ServerDatas/CasinoStatus.json");
				if (!casinoData[interaction.channel.id]) {
					await interaction.reply("このチャンネルでゲームが開始されていません。");
					return;
				}

				if (casinoData[interaction.channel.id].bet > bankData[interaction.user.id].balance && interaction.commandName != "addbot") {
					await interaction.reply("所持金以上の金額が賭けられているため、参加できません。");
					return;
				}

				switch (casinoData[interaction.channel.id].game) {
					case "コインフリップ": {
						if (bankData[interaction.user.id].rank < casinoData[interaction.channel.id].rank) {
							await interaction.reply("あなたのランクが指定されたランク以下のため、このゲームに参加できません。");
							return;
						}

						if (casinoData[interaction.channel.id].players.length == 2) {
							await interaction.reply("このゲームは既に2人揃っています。");
							return;
						}
					}
				}

				if (casinoData[interaction.channel.id].players.find(player => player.id == interaction.user.id) && interaction.commandName != "addbot") {
					await interaction.reply("既にゲームに参加しています。");
					return;
				}

				if (interaction.commandName == "addbot") {
					casinoData[interaction.channel.id].players.push({
						id: 0,
						username: "BOT"
					});
				} else {
					casinoData[interaction.channel.id].players.push({
						id: interaction.user.id,
						username: interaction.user.username
					});
				}
				fs.writeJsonSync("./ServerDatas/CasinoStatus.json", casinoData, { spaces: 4, replacer: null });

				if (interaction.commandName == "addbot") {
					await interaction.reply(`BOTが${casinoData[interaction.channel.id].game}ゲームに参加しました。`);
				} else {
					await interaction.reply(`${casinoData[interaction.channel.id].game}ゲームに参加しました。`);
				}

				switch (casinoData[interaction.channel.id].game) {
					case "コインフリップ": {
						if (casinoData[interaction.channel.id].players.length == 2) {
							await interaction.followUp("コインを投げています...");
							setTimeout(async () => {
								const result = Math.floor(Math.random() * 2);
								const winner = casinoData[interaction.channel.id].players[result];
								const loser = casinoData[interaction.channel.id].players[result == 0 ? 1 : 0];
								const bet = casinoData[interaction.channel.id].bet;
								if (winner.id != 0) bankData[winner.id].balance += bet;
								if (loser.id != 0) bankData[loser.id].balance -= bet;
								fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });
								const Embed = new EmbedBuilder()
									.setTitle("コインフリップ")
									.setDescription(`賭け金: **${bet}**コイン`)
									.setColor("Blue")
									.addFields({ name: "Winner", value: `${Tools.rankConverterForCasino(bankData[winner.id]?.rank)}**${winner.username}**`, inline: true })
									.addFields({ name: "Loser", value: `**${Tools.rankConverterForCasino(bankData[loser.id]?.rank)}${loser.username}**`, inline: true })
									.addFields({ name: "Result", value: `${Tools.rankConverterForCasino(bankData[winner.id]?.rank)}**${winner.username}**さんが勝利しました。(+ ${bet * 2}コイン)`, inline: false })
									.setTimestamp();
								await interaction.followUp({ embeds: [Embed] });
								delete casinoData[interaction.channel.id];
								fs.writeJsonSync("./ServerDatas/CasinoStatus.json", casinoData, { spaces: 4, replacer: null });
								bankData = null;
								casinoData = null;
							}, 2000);
						} else {
							await interaction.followUp(`他のプレイヤーを待っています...(${casinoData[interaction.channel.id].players.length}/2)`);
							bankData = null;
							casinoData = null;
						}
					}
				}

				return;
			}

			if (interaction.commandName == "leave") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (!bankData[interaction.user.id]) {
					await interaction.reply("このカジノにユーザー登録されていないようです。\`/regcasino\`で登録してください。");
					return;
				}

				let casinoData = fs.readJsonSync("./ServerDatas/CasinoStatus.json");
				if (!casinoData[interaction.channel.id]) {
					await interaction.reply("このチャンネルでゲームが開始されていません。");
					return;
				}

				if (!casinoData[interaction.channel.id].players.find(player => player.id == interaction.user.id)) {
					await interaction.reply("このゲームに参加していません。");
					return;
				}

				casinoData[interaction.channel.id].players = casinoData[interaction.channel.id].players.filter(player => player.id != interaction.user.id);
				fs.writeJsonSync("./ServerDatas/CasinoStatus.json", casinoData, { spaces: 4, replacer: null });
				await interaction.reply("ゲームから退出しました。");
				bankData = null;
				casinoData = null;
				return;
			}

			if (interaction.commandName == "cancel") {
				let casinoData = fs.readJsonSync("ServerDatas/CasinoStatus.json");
				if (!casinoData[interaction.channel.id]) {
					await interaction.reply("このチャンネルでゲームが開始されていません。");
					return;
				}

				if (casinoData[interaction.channel.id].starter != interaction.user.id) {
					await interaction.reply("このゲームはあなたが開始したものではありません。");
					return;
				}

				await interaction.reply("ゲームをキャンセルしました。");
				delete casinoData[interaction.channel.id];
				fs.writeJsonSync("./ServerDatas/CasinoStatus.json", casinoData, { spaces: 4, replacer: null });
				casinoData = null;
				return;
			}

			if (interaction.commandName == "bankranking") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				let bankDataArray = [];
				for (const key in bankData) {
					bankDataArray.push(bankData[key]);
				}
				bankDataArray.sort((a, b) => b.balance - a.balance);
				let ranking = [];
				for (let i = 0; i < Math.min(bankDataArray.length, 10); i++) {
					ranking.push(`- __#**${i + 1}**__: **${bankDataArray[i].username}** (__**${bankDataArray[i].balance}コイン**__)`);
				}
				await interaction.reply(`__**Current Bank Ranking**__\n${ranking.join("\n")}`);
				bankData = null;
				return;
			}

			if (interaction.commandName == "bank") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (!bankData[interaction.user.id]) {
					await interaction.reply("このカジノにユーザー登録されていないようです。\`/regcasino\`で登録してください。");
					return;
				}

				const CurrentBalance = bankData[interaction.user.id].balance;
				const Medals = [
					bankData[interaction.user.id].slot[0].medal,
					bankData[interaction.user.id].slot[1].medal
				];
				const Embed = new EmbedBuilder()
					.setTitle("Bank")
					.setDescription("あなたの残高情報です。")
					.setColor("Blue")
					.addFields({ name: "User", value: `**${interaction.user.username}**`, inline: true })
					.addFields({ name: "Current Balance", value: `**${CurrentBalance}**コイン`, inline: true })
					.addFields({ name: "5コインスロット用メダル", value: `**${Medals[0]}**枚`, inline: false })
					.addFields({ name: "20コインスロット用メダル", value: `**${Medals[1]}**枚`, inline: false })
					.setTimestamp();

				await interaction.reply({ embeds: [Embed] });
				bankData = null;
				return;
			}

			if (interaction.commandName == "regcasino") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (bankData[interaction.user.id]) {
					await interaction.reply("あなたはもう既にこのカジノに登録されています。");
					return;
				}

				bankData[interaction.user.id] = {
					username: interaction.user.username,
					id: interaction.user.id,
					balance: 10000,
					rank: 0,
					slot: [
							{
								medal: 0,
								rotation: 0,
								rotation_total: 0,
								log: [],
								slump_value: 0,
								slump: [],
								counter: [
									0,
									0,
									0,
									0,
									0,
									0,
									0
								],
								flag_big: false,
								flag_reg: false
							},
							{
								medal: 0,
								rotation: 0,
								rotation_total: 0,
								log: [],
								slump_value: 0,
								slump: [],
								counter: [
									0,
									0,
									0,
									0,
									0,
									0,
									0
								],
								flag_big: false,
								flag_reg: false
							}
					]
				};

				fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });
				await interaction.reply(`カジノへようこそ ${interaction.user.username}! 初回なので10000コインを差し上げます。\n__**スロットの遊び方**__\n- \`/medal\`でコインからメダルに\n- \`/coin\`でメダルからコインに変えることができます。\n- \`/slot\`で遊ぶことができます。\n- \`/slotgraph\`でスランプのグラフが表示され\n- \`/slothistory\`で当たりの履歴を見ることができます。\n**Typeがレートで、5コイン1メダル、20コイン1メダルから選べます**\n\n__**コインフリップの遊び方**__\n- \`/coinflip\`でゲームを開始できます。\n- 参加したい人がいる場合、\`/join\`を入力することで参加できます。\n- BOTを追加したい場合、\`/addbot\`を入力することでBOTと戦うことができます。`);
				bankData = null;
				return;
			}

			if (interaction.commandName == "send") {
				const Amount = Math.ceil(interaction.options.get("amount").value);
				const OBJECTIVE_USERNAME = interaction.options.get("username").value;
				if (OBJECTIVE_USERNAME == interaction.user.username) {
					await interaction.reply("自分自身に送ることは許されていません！");
					return;
				}

				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (!bankData[interaction.user.id]) {
					await interaction.reply("このカジノにユーザー登録されていないようです。\`/regcasino\`で登録してください。");
					return;
				}

				let bankArray = Object.values(bankData);
				if (!bankArray.find(item => item.username == OBJECTIVE_USERNAME)) {
					await interaction.reply(`${OBJECTIVE_USERNAME} というユーザーはこのカジノに登録されていません。`);
					return;
				}

				if (Amount <= 0) {
					await interaction.reply("送る金額を0以下にすることは出来ません。");
					return;
				}

				const MESSAGER_USERDATA = bankData[interaction.user.id].balance;
				if (MESSAGER_USERDATA - Amount < 0) {
					await interaction.reply(`この金額を送ることは出来ません。この金額を送った場合、あなたの銀行口座残高が0を下回ってしまいます。(${MESSAGER_USERDATA - Amount})`);
					return;
				}

				bankData[interaction.user.id].balance = bankData[interaction.user.id].balance - Amount;
				bankData[bankArray.find(item => item.username == OBJECTIVE_USERNAME).id].balance = bankData[bankArray.find(item => item.username == OBJECTIVE_USERNAME).id].balance + Amount;

				fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });
				await interaction.reply("送金が完了しました。");
				bankData = null;
				bankArray = null;
				return;
			}

			if (interaction.commandName == "roulette") {
				const num = Math.floor(Math.random() * 2);
				switch (num) {
					case 0:
						await interaction.reply("ルーレットの結果: **赤**");
						break;

					case 1:
						await interaction.reply("ルーレットの結果: **黒**");
						break;
				}
				return;
			}

			if (interaction.commandName == "coinshop") {
				let bankData = fs.readJsonSync("./ServerDatas/UserBankData.json");
				if (!bankData[interaction.user.id]) {
					await interaction.reply("このカジノにユーザー登録されていないようです。\`/regcasino\`で登録してください。");
					return;
				}

				const RankValue = {
					"VIP": 50000,
					"VIP+": 80000,
					"MVP": 120000,
					"MVP+": 250000,
					"MVP++": 800000
				};

				const Rank = interaction.options.get("rank").value;
				const RankNumber = Tools.getRankFromValue(Rank);
				if (bankData[interaction.user.id].rank >= RankNumber) {
					await interaction.reply(`既に${Rank}、または${Rank}以上を購入しています。`);
					return;
				}
				if (bankData[interaction.user.id].balance < RankValue[Rank]) {
					await interaction.reply(`${Rank}を購入するためのコインが足りません。`);
					return;
				}
				bankData[interaction.user.id].balance -= RankValue[Rank];
				bankData[interaction.user.id].rank = RankNumber;
				fs.writeJsonSync("./ServerDatas/UserBankData.json", bankData, { spaces: 4, replacer: null });
				await interaction.reply(`${Rank}を購入しました。`);
				bankData = null;
				return;
			}

			//Casino

			if (interaction.commandName == "tweetdownloader") {
				const mediaLink = interaction.options.get("link").value;
				const tweetId = mediaLink.split("/")[mediaLink.split("/").length - 1].split("?")[0];
				const Interaction = await interaction.reply("動画のダウンロード中です...");
				const Downloader = new TwitterDownloader();
				await Downloader.download_video(mediaLink, "video", `./temp/${tweetId}`)
					.then(async () => {
						await Interaction.edit("動画のアップロード中です。");
						const videoFiles = fs.readdirSync(`./temp/${tweetId}`);
						const attachment = [];
						for (const videoFile of videoFiles) {
							attachment.push({ attachment: `./temp/${tweetId}/${videoFile}`, name: videoFile });
						}
						await Interaction.edit({
							content: "動画のアップロードが完了しました！こちらからダウンロードできます！",
							files: attachment
						});;
					})
					.catch(async () => {
						await Interaction.edit("動画のダウンロードに失敗しました。");
					});
				fs.removeSync(`./temp/${tweetId}`)
				return;
			}

			if (interaction.commandName == "youtubedownloader") {
				const mediaLink = interaction.options.get("link").value;
				const videoId = mediaLink.split("/")[mediaLink.split("/").length - 1].split("&")[0];
				const Interaction = await interaction.reply("動画のダウンロード中です...");
				const Downloader = new YoutubeDownloader(mediaLink, `./temp/${videoId}`);
				await Downloader.download_video()
					.then(async () => {
						await Interaction.edit("動画のアップロード中です。");
						await Interaction.edit({
							content: "動画のアップロードが完了しました！こちらからダウンロードできます！",
							files: [{ attachment: `./temp/${videoId}/output.mp4`, name: "video.mp4" }]
						});
					})
					.catch(async () => {
						await Interaction.edit("動画のダウンロードに失敗しました。");
					});
				fs.removeSync(`./temp/${videoId}`);
				return;
			}

			if (interaction.commandName == "kemo") {
				let dataBase = fs.readJsonSync("./Pictures/Furry/DataBase.json");
				if (dataBase.FileCount == 0) {
					await interaction.reply("ファイルが存在しません。");
					return;
				}

				const random = Math.floor(Math.random() * dataBase.FileCount);
				const file = dataBase.PhotoDataBase[random];
				const picData = fs.readFileSync(path.join("./Pictures/Furry", file));
				await interaction.reply({ files: [{ attachment: picData, name: file }] });
				dataBase = null;
				return;
			}

			if (interaction.commandName == "kemodelete") {
				let dataBase = fs.readJsonSync("./Pictures/Furry/DataBase.json");
				const usercount = interaction.options.get("count").value;
				let foundFlag = false;
				for (const fileName of dataBase.PhotoDataBase) {
					const file = fileName.split(".")[0];
					if (file == usercount) {
						foundFlag = true;
						fs.removeSync(`./Pictures/Furry/${fileName}`);
						dataBase.PhotoDataBase = dataBase.PhotoDataBase.filter(item => item !== fileName);
						dataBase.FileCount--;
						fs.writeJsonSync("./Pictures/Furry/DataBase.json", dataBase, { spaces: 4, replacer: null });
						await interaction.reply("ファイルが正常に削除されました。");
						break;
					}
				}
				if (!foundFlag) {
					await interaction.reply("そのファイルは存在しません。");
					dataBase = null;
					return;
				}
				dataBase = null;
				return;
			}

			if (interaction.commandName == "kemocount") {
				let dataBase = fs.readJsonSync("./Pictures/Furry/DataBase.json");
				const count = dataBase.FileCount;
				await interaction.reply(`今まで追加した画像や映像、gifの合計枚数は${count}枚です。`);
				dataBase = null;
				return;
			}

			if (interaction.commandName == "pic") {
				const tag = interaction.options.get("tag").value;
				if (!fs.existsSync(path.join("./Pictures/tag", tag, "DataBase.json"))) {
					await interaction.reply("このタグは存在しません。");
					return;
				}
				let dataBase = fs.readJsonSync(path.join("./Pictures/tag", tag, "DataBase.json"));
				const filecount = dataBase.FileCount;
				if (filecount == 0) {
					await interaction.reply("ファイルが存在しません。");
					return;
				};
				const random = Math.floor(Math.random() * filecount);
				const file = dataBase.PhotoDataBase[random];
				let picData = fs.readFileSync(path.join("./Pictures/tag", tag, file));
				await interaction.reply({ files: [{ attachment: picData, name: file }] });
				dataBase = null;
				picData = null;
				return;
			}

			if (interaction.commandName == "settag") {
				const tagName = interaction.options.get("name").value;
				if (fs.existsSync(`./Pictures/tag/${tagName}`)) {
					await interaction.reply("このタグ名は登録できません。");
					return;
				}

				if (fs.existsSync(`./Pictures/tag/${tagName}/DataBase.json`)) {
					await interaction.reply("このタグは既に存在しています。");
					return;
				}

				const currentDir = fs.readdirSync("./Pictures/tag").filter(folder => fs.existsSync(`./Pictures/tag/${folder}/DataBase.json`));
				for (const folder of currentDir) {
					let dataBase = fs.readJsonSync(`./Pictures/tag/${folder}/DataBase.json`);
					if (dataBase.id == interaction.channel.id) {
						fs.renameSync(`./Pictures/tag/${folder}`, `./Pictures/tag/${tagName}`);
						await interaction.reply("このチャンネルのタグ名を更新しました。");
						dataBase = null;
						return;
					}
					dataBase = null;
				}
				fs.mkdirSync(`./Pictures/tag/${tagName}`);
				fs.writeJsonSync(`./Pictures/tag/${tagName}/DataBase.json`, {
					id: interaction.channel.id,
					FileCount: 0,
					PhotoDataBase: []
				}, { spaces: 4, replacer: null });
				await interaction.reply("タグが正常に作成されました。");
				return;
			}

			if (interaction.commandName == "deltag") {
				const currentDir = fs.readdirSync("./Pictures/tag").filter(folder => fs.existsSync(`./Pictures/tag/${folder}/DataBase.json`));
				for (const folder of currentDir) {
					let dataBase = fs.readJsonSync(`./Pictures/tag/${folder}/DataBase.json`);
					if (dataBase.id == interaction.channel.id) {
						fs.removeSync(`./Pictures/tag/${folder}/DataBase.json`);
						await interaction.reply("タグの削除が正常に完了しました。");
						dataBase = null;
						return;
					}
					dataBase = null;
				}
				await interaction.reply("このチャンネルのタグは存在しません。");
				return;
			}

			if (interaction.commandName == "delpic") {
				const usercount = interaction.options.get("count").value;
				const currentDir = fs.readdirSync("./Pictures/tag").filter(folder => fs.existsSync(`./Pictures/tag/${folder}/DataBase.json`));
				for (const folder of currentDir) {
					let dataBase = fs.readJsonSync(`./Pictures/tag/${folder}/DataBase.json`);
					if (dataBase.id == interaction.channel.id) {
						for (const fileName of dataBase.PhotoDataBase) {
							const file = fileName.split(".")[0];
							if (file == usercount) {
								fs.removeSync(`./Pictures/tag/${folder}/${fileName}`);
								dataBase.PhotoDataBase = dataBase.PhotoDataBase.filter(item => item !== fileName);
								dataBase.FileCount--;
								fs.writeJsonSync(`./Pictures/tag/${folder}/DataBase.json`, dataBase, { spaces: 4, replacer: null });
								await interaction.reply("ファイルが正常に削除されました。");
								dataBase = null;
								return;
							}
						}
						await interaction.reply("そのファイルは存在しません。");
						dataBase = null;
						return;
					}
					dataBase = null;
				}
				await interaction.reply("このチャンネルのタグは存在しません。");
				return;
			}

			if (interaction.commandName == "piccount") {
				const tagName = interaction.options.get("tag").value;
				if (!fs.existsSync(`./Pictures/tag/${tagName}/DataBase.json`)) {
					await interaction.reply("このタグは登録されていません。");
					return;
				}
				let dataBase = fs.readJsonSync(`./Pictures/tag/${tagName}/DataBase.json`);
				const filecount = dataBase.FileCount;
				await interaction.reply(`今まで${tagName}タグに追加した画像や映像、gifの合計枚数は${filecount}枚です。`);
				dataBase = null;
				return;
			}

			if (interaction.commandName == "alltags") {
				let tagList = [];
				const allTags = fs.readdirSync("./Pictures/tag").filter(folder => fs.existsSync(`./Pictures/tag/${folder}/DataBase.json`));
				for (let i = 0; i < allTags.length; i++) tagList.push(`${i + 1}: ${allTags[i]}\n`);
				await interaction.reply(`現在登録されているタグは以下の通りです。\n${tagList.join("")}`);
				return;
			}

			if (interaction.commandName == "quote") {
				const tag = interaction.options.get("tag").value;
				let allQuotes = fs.readJsonSync("./ServerDatas/Quotes.json");
				if (!allQuotes[tag]) {
					await interaction.reply("このタグは存在しません。");
					return;
				}
				if (allQuotes[tag].quotes.length == 0) {
					await interaction.reply("このタグには名言がないみたいです。");
					return;
				}
				const lineCount = allQuotes[tag].quotes.length;
				const randomLineNumber = Math.floor(Math.random() * lineCount);
				const randomLine = allQuotes[tag].quotes[randomLineNumber];
				await interaction.reply(`**${randomLine}** - ${tag}`);
				allQuotes = null;
				return;
			}

			if (interaction.commandName == "setquotetag") {
				const tagName = interaction.options.get("tag").value;
				let allQuotes = fs.readJsonSync("./ServerDatas/Quotes.json");
				if (allQuotes[tagName]) {
					await interaction.reply("このタグ名は既に存在しています。");
					return;
				}
				for (const key in allQuotes) {
					if (allQuotes[key].id == interaction.channel.id) {
						allQuotes[tagName] = allQuotes[key];
						delete allQuotes[key];
						await interaction.reply("このチャンネルのタグ名を更新しました。");
						fs.writeJsonSync("./ServerDatas/Quotes.json", allQuotes, { spaces: 4, replacer: null });
						return;
					}
				}
				allQuotes[tagName] = {
					"id": interaction.channel.id,
					"quotes": []
				};
				fs.writeJsonSync("./ServerDatas/Quotes.json", allQuotes, { spaces: 4, replacer: null });
				await interaction.reply("タグが正常に作成されました。");
				allQuotes = null;
				return;
			}

			if (interaction.commandName == "delquotetag") {
				let allQuotes = fs.readJsonSync("./ServerDatas/Quotes.json");
				for (const key in allQuotes) {
					if (allQuotes[key].id == interaction.channel.id) {
						delete allQuotes[key];
						fs.writeJsonSync("./ServerDatas/Quotes.json", allQuotes, { spaces: 4, replacer: null });
						await interaction.reply("タグが正常に削除されました。");
						return;
					}
				}
				await interaction.reply("このチャンネルにタグは存在しません。");
				allQuotes = null;
				return;
			}

			if (interaction.commandName == "delquote") {
				let allQuotes = fs.readJsonSync("./ServerDatas/Quotes.json");
				for (const key in allQuotes) {
					if (allQuotes[key].id == interaction.channel.id) {
						const wannadelete = interaction.options.get("quote").value;
						if (!allQuotes[key].quotes.includes(wannadelete)) {
							await interaction.reply("その名言は存在しません。");
							return;
						}
						allQuotes[key].quotes = allQuotes[key].quotes.filter(item => item !== wannadelete );
						fs.writeJsonSync("./ServerDatas/Quotes.json", allQuotes, { spaces: 4, replacer: null });
						await interaction.reply("名言の削除が完了しました。");
						return;
					}
				}
				await interaction.reply("このチャンネルにはタグが存在しません。");
				allQuotes = null;
				return;
			}

			if (interaction.commandName == "quotecount") {
				const tagName = interaction.options.get("tag").value;
				let allQuotes = fs.readJsonSync("./ServerDatas/Quotes.json");
				if (!allQuotes[tagName]) {
					await interaction.reply("このタグは存在しません。");
					return;
				}
				if (allQuotes[tagName].quotes.length == 0) {
					await interaction.reply("このタグには名言がないみたいです。");
					return;
				}
				await interaction.reply(`今まで${tagName}タグに追加した名言の数は${allQuotes[tagName].quotes.length}個です。`);
				allQuotes = null;
				return;
			}

			if (interaction.commandName == "allquotetags") {
				let allQuotes = fs.readJsonSync("./ServerDatas/Quotes.json");
				let taglist = [];
				let i = 0;
				for (const key in allQuotes) {
					taglist.push(`${i + 1}: ${key}\n`);
					i++;
				}
				allQuotes = null;
				if (taglist.length == 0) {
					await interaction.reply("まだ１つもタグが存在しません。");
					return;
				}
				await interaction.reply(`現在登録されているタグは以下の通りです。\n${taglist.join("")}`);
				return;
			}

			if (interaction.commandName == "link") {
				const channelid = interaction.channel.id;
				let allchannels = fs.readJsonSync("./ServerDatas/BeatmapLinkChannels.json");
				if (allchannels.Channels.includes(channelid)) {
					allchannels.Channels = allchannels.Channels.filter(item => item !== channelid);
					fs.writeJsonSync("./ServerDatas/BeatmapLinkChannels.json", allchannels, { spaces: 4, replacer: null });
					await interaction.reply(`このチャンネルにマップリンクが送信されてもマップ情報が表示されないようになりました。再度表示したい場合は/linkコマンドを使用してください。`);
				} else {
					allchannels.Channels.push(channelid);
					fs.writeJsonSync("./ServerDatas/BeatmapLinkChannels.json", allchannels, { spaces: 4, replacer: null });
					await interaction.reply(`このチャンネルにマップリンクが送信されたら自動的にマップ情報が表示されるようになりました。解除したい場合は/linkコマンドをもう一度使用してください。`);
				}
				allchannels = null;
				return;
			}

			if (interaction.commandName == "check") {
				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				const maplink = interaction.options.get("beatmaplink").value;
				if (!(regex.test(maplink) || regex2.test(maplink) || regex3.test(maplink))) {
					await interaction.reply("ビートマップリンクの形式が間違っています。");
					return;
				}

				await interaction.reply("計算中です...");
				await new osuLibrary.CheckMapData(maplink).check()
					.then(async data => {
						const mapData = await new osuLibrary.GetMapData(maplink, apikey).getDataWithoutMode();
						const mapperData = await new osuLibrary.GetUserData(mapData.creator, apikey).getData();
						const mapperIconURL = osuLibrary.URLBuilder.iconURL(mapperData?.user_id);
						const mapperUserURL = osuLibrary.URLBuilder.userURL(mapperData?.user_id);
						const backgroundURL = osuLibrary.URLBuilder.backgroundURL(mapData.beatmapset_id);
						const bpmMin = Tools.isNaNwithNumber(Math.min(...data.BPMarray));
						const bpmMax = Tools.isNaNwithNumber(Math.max(...data.BPMarray));
						const bpmStr = bpmMin == bpmMax ? bpmMax.toFixed(1) : `${bpmMin.toFixed(1)} ~ ${bpmMax.toFixed(1)}`;
						const hitTotal = data["1/3 times"] + data["1/4 times"] + data["1/6 times"] + data["1/8 times"];
						const hitPercentData = [Tools.isNaNwithNumber(Math.round(data["1/3 times"] / hitTotal * 100)), Tools.isNaNwithNumber(Math.round(data["1/4 times"] / hitTotal * 100)), Tools.isNaNwithNumber(Math.round(data["1/6 times"] / hitTotal * 100)), Tools.isNaNwithNumber(Math.round(data["1/8 times"] / hitTotal * 100))] ;
						const mapUrl = osuLibrary.URLBuilder.beatmapURL(mapData.beatmapset_id, Number(mapData.mode), mapData.beatmap_id);
						const embed = new EmbedBuilder()
							.setColor("Blue")
							.setTitle(`${mapData.artist} - ${mapData.title} [${mapData.version}]`)
							.setURL(mapUrl)
							.setAuthor({ name: `Mapped by ${mapData.creator}`, iconURL: mapperIconURL, url: mapperUserURL })
							.addFields({ name: "**BPM**", value: `**${bpmStr}** (最頻値: **${data.BPMMode.toFixed(1)}**)`, inline: false })
							.addFields({ name: "**Streams**", value: `**1/4 Streams**: **${data.streamCount}**回 [最大**${data.maxStream}**コンボ / 平均**${Tools.isNaNwithNumber(Math.floor(data.over100ComboAverageStreamLength))}**コンボ]`, inline: false })
							.addFields({ name: "**Hit Objects**", value: `**1/3**: **${data["1/3 times"]}**回 [最大**${data["max1/3Length"]}**コンボ] (${hitPercentData[0]}%)\n**1/4**: **${data["1/4 times"]}**回 [最大**${data["max1/4Length"]}**コンボ] (${hitPercentData[1]}%)\n**1/6**: **${data["1/6 times"]}**回 [最大**${data["max1/6Length"]}**コンボ] (${hitPercentData[2]}%)\n**1/8**: **${data["1/8 times"]}**回 [最大**${data["max1/8Length"]}**コンボ] (${hitPercentData[3]}%)`, inline: false })
							.setImage(backgroundURL);
						await interaction.channel.send({ embeds: [embed] });
					});
				return;
			}

			if (interaction.commandName == "lb") {
				let maplink = interaction.options.get("beatmaplink").value;
				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				if (!(regex.test(maplink) || regex2.test(maplink) || regex3.test(maplink))) {
					await interaction.reply(`ビートマップリンクの形式が間違っています。`);
					return;
				}

				const beatmapid = maplink.split("/")[maplink.split("/").length - 1];
				const modsText = interaction.options?.get("mods")?.value;
				const mods = new osuLibrary.Mod(modsText).get();
				if (!mods) {
					await interaction.reply("入力されたModは存在しないか、指定できないModです。存在するMod、AutoなどのMod以外を指定するようにしてください。");
					return;
				}

				let mode;
				let Mapinfo;
				if (regex.test(maplink)) {
					switch (maplink.split("/")[4].split("#")[1]) {
						case "osu":
							mode = 0;
							break;

						case "taiko":
							mode = 1;
							break;

						case "fruits":
							mode = 2;
							break;

						case "mania":
							mode = 3;
							break;

						default:
							await interaction.reply("リンク内のモードが不正です。");
							return;
					}
					Mapinfo = await new osuLibrary.GetMapData(maplink, apikey, mode).getData();
				} else {
					Mapinfo = await new osuLibrary.GetMapData(maplink, apikey).getDataWithoutMode();
					mode = Number(Mapinfo.mode);
					maplink = osuLibrary.URLBuilder.beatmapURL(Mapinfo.beatmapset_id, mode, Mapinfo.beatmap_id);
				}

				const mapperinfo = await new osuLibrary.GetUserData(Mapinfo.creator, apikey, mode).getData();

				const srData = new osuLibrary.CalculatePPSR(maplink, mods.calc, mode);
				const sr = await srData.calculateSR();
				let BPM = Number(Mapinfo.bpm);

				if (mods.array.includes("NC") || mods.array.includes("DT")) {
					BPM *= 1.5;
				} else if (mods.array.includes("HT")) {
					BPM *= 0.75;
				}

				await interaction.reply("ランキングの作成中です...");
				const resulttop5 = await Tools.getAPIResponse(`https://osu.ppy.sh/api/get_scores?k=${apikey}&b=${beatmapid}&m=${mode}&mods=${mods.num}&limit=5`);

				if (resulttop5.length == 0) {
					await interaction.channel.send("このマップ、Modsにはランキングが存在しません。");
					return;
				}

				const mapperIconURL = osuLibrary.URLBuilder.iconURL(mapperinfo?.user_id);
				const mapperUserURL = osuLibrary.URLBuilder.userURL(mapperinfo?.user_id);
				const backgroundURL = osuLibrary.URLBuilder.backgroundURL(Mapinfo.beatmapset_id);

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`Map leaderboard: ${Mapinfo.artist} - ${Mapinfo.title} [${Mapinfo.version}]`)
					.setURL(maplink)
					.setAuthor({ name: `Mapped by ${Mapinfo.creator}`, iconURL: mapperIconURL, url: mapperUserURL })
					.addFields({ name: "**MapInfo**", value: `\`Mods\`: **${mods.str}** \`SR\`: **${sr.sr.toFixed(2)}** \`BPM\`: **${BPM}**`, inline: true })
					.setImage(backgroundURL);
				const rankingdata = [];
				for (let i = 0; i < Math.min(resulttop5.length, 5); i++) {
					const acc = Math.round(tools.accuracy({
						300: resulttop5[i].count300,
						100: resulttop5[i].count100,
						50: resulttop5[i].count50,
						0: resulttop5[i].countmiss,
						geki:  resulttop5[i].countgeki,
						katu: resulttop5[i].countkatu
					}, Tools.modeConvertAcc(mode)) * 100) / 100;

					const score = {
						n300: Number(resulttop5[i].count300),
						n100: Number(resulttop5[i].count100),
						n50: Number(resulttop5[i].count50),
						misses: Number(resulttop5[i].countmiss),
						nGeki: Number(resulttop5[i].countgeki),
						nKatu: Number(resulttop5[i].countkatu),
						combo: Number(resulttop5[i].maxcombo)
					};
					const pp = await srData.calculateScorePP(score);
					rankingdata.push({ name: `\`#${i + 1}\``, value: `**Rank**: ${Tools.rankconverter(resulttop5[i].rank)}　Player: **${resulttop5[i].username}**　Score: **${Number(resulttop5[i].score).toLocaleString()}** \n Combo: **${resulttop5[i].maxcombo}**　**Acc**: **${acc}**%　PP: **${pp.toFixed(2)}**pp　Miss:${resulttop5[i].countmiss}`, inline: false });
				}
				embed.addFields(rankingdata);
				await interaction.channel.send({ embeds: [embed] });
				return;
			}

			if (interaction.commandName == "qf" || interaction.commandName == "loved") {
				const mode = interaction.options.get("mode").value;
				const channelid = interaction.channel.id;
				let allchannels = fs.readJsonSync(`./ServerDatas/MapcheckChannels.json`);
				switch (interaction.commandName) {
					case "qf": {
						if (allchannels["Qualified"][mode].includes(channelid)) {
							const newchannels = allchannels["Qualified"][mode].filter(item => item !== channelid);
							allchannels["Qualified"][mode] = newchannels;
							fs.writeJsonSync(`./ServerDatas/MapcheckChannels.json`, allchannels, { spaces: 4, replacer: null });
							await interaction.reply(`このチャンネルを${mode}のQualified、Rankedチェックチャンネルから削除しました。`);
						} else {
							allchannels["Qualified"][mode].push(channelid);
							fs.writeJsonSync(`./ServerDatas/MapcheckChannels.json`, allchannels, { spaces: 4, replacer: null });
							await interaction.reply(`このチャンネルを${mode}のQualified、Rankedチェックチャンネルとして登録しました。`);
						}
						allchannels = null;
						return;
					}

					case "loved": {
						if (allchannels["Loved"][mode].includes(channelid)) {
							const newchannels = allchannels["Loved"][mode].filter(item => item !== channelid);
							allchannels["Loved"][mode] = newchannels;
							fs.writeJsonSync(`./ServerDatas/MapcheckChannels.json`, allchannels, { spaces: 4, replacer: null });
							await interaction.reply(`このチャンネルを${mode}のLovedチェックチャンネルから削除しました。`);
						} else {
							allchannels["Loved"][mode].push(channelid);
							fs.writeJsonSync(`./ServerDatas/MapcheckChannels.json`, allchannels, { spaces: 4, replacer: null });
							await interaction.reply(`このチャンネルを${mode}のLovedチェックチャンネルとして登録しました。`);
						}
						allchannels = null;
						return;
					}
				}
			}

			if (interaction.commandName == "qfmention" || interaction.commandName == "lovedmention" || interaction.commandName == "rankedmention") {
				const selectedMode = interaction.options.get("mode").value;
				const userId = interaction.user.id;
				const guildId = interaction.guild.id;
				let mentionUserList = fs.readJsonSync(`./ServerDatas/MentionUser.json`);
				switch (interaction.commandName) {
					case "qfmention": {
						if (mentionUserList["Qualified"][guildId]?.[selectedMode].includes(userId)) {
							const updatedUserList = mentionUserList["Qualified"][guildId][selectedMode].filter(item => item !== userId);
							mentionUserList["Qualified"][guildId][selectedMode] = updatedUserList;
							fs.writeJsonSync(`./ServerDatas/MentionUser.json`, mentionUserList, { spaces: 4, replacer: null });
							await interaction.reply(`今度から${selectedMode}でQualified検出されても、メンションが飛ばないようになりました。`);
						} else {
							if (!mentionUserList["Qualified"][guildId]) mentionUserList["Qualified"][guildId] = {
								"osu": [],
								"taiko": [],
								"catch": [],
								"mania": []
							};

							mentionUserList["Qualified"][guildId][selectedMode].push(userId);
							fs.writeJsonSync(`./ServerDatas/MentionUser.json`, mentionUserList, { spaces: 4, replacer: null });
							await interaction.reply(`今度から${selectedMode}でQualifiedが検出されたらメンションが飛ぶようになりました.`);
						}
						mentionUserList = null;
						return;
					}

					case "lovedmention": {
						if (mentionUserList["Loved"][guildId]?.[selectedMode].includes(userId)) {
							const updatedUserList = mentionUserList["Loved"][guildId][selectedMode].filter(item => item !== userId);
							mentionUserList["Loved"][guildId][selectedMode] = updatedUserList;
							fs.writeJsonSync(`./ServerDatas/MentionUser.json`, mentionUserList, { spaces: 4, replacer: null });
							await interaction.reply(`今度から${selectedMode}でLoved検出されても、メンションが飛ばないようになりました。`);
						} else {
							if (!mentionUserList["Loved"][guildId]) mentionUserList["Loved"][guildId] = {
								"osu": [],
								"taiko": [],
								"catch": [],
								"mania": []
							};

							mentionUserList["Loved"][guildId][selectedMode].push(userId);
							fs.writeJsonSync(`./ServerDatas/MentionUser.json`, mentionUserList, { spaces: 4, replacer: null });
							await interaction.reply(`今度から${selectedMode}でlovedが検出されたらメンションが飛ぶようになりました。`);
						}
						mentionUserList = null;
						return;
					}

					case "rankedmention": {
						if (mentionUserList["Ranked"][guildId]?.[selectedMode].includes(userId)) {
							const updatedUserList = mentionUserList["Ranked"][guildId][selectedMode].filter(item => item !== userId);
							mentionUserList["Ranked"][guildId][selectedMode] = updatedUserList;
							fs.writeJsonSync(`./ServerDatas/MentionUser.json`, mentionUserList, { spaces: 4, replacer: null });
							await interaction.reply(`今度から${selectedMode}でRanked検出されても、メンションが飛ばないようになりました。`);
						} else {
							if (!mentionUserList["Ranked"][guildId]) mentionUserList["Ranked"][guildId] = {
								"osu": [],
								"taiko": [],
								"catch": [],
								"mania": []
							};

							mentionUserList["Ranked"][guildId][selectedMode].push(userId);
							fs.writeJsonSync(`./ServerDatas/MentionUser.json`, mentionUserList, { spaces: 4, replacer: null });
							await interaction.reply(`今度から${selectedMode}でRankedが検出されたらメンションが飛ぶようになりました。`);
						}
						mentionUserList = null;
						return;
					}
				}
			}

			if (interaction.commandName == "bg") {
				const maplink = interaction.options.get("beatmaplink").value;
				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				const regex4 = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+$/;
				let BeatmapsetId
				switch (true) {
					case regex.test(maplink): {
						BeatmapsetId = maplink.split("/")[4].split("#")[0];
						break;
					}
					case regex3.test(maplink) || regex2.test(maplink): {
						const mapInfo = await new osuLibrary.GetMapData(maplink, apikey).getDataWithoutMode();
						BeatmapsetId = mapInfo.beatmapset_id;
						break;
					}
					case regex4.test(maplink): {
						BeatmapsetId = maplink.split("/")[maplink.split("/").length - 1];
						break;
					}
					default: {
						await interaction.reply(`ビートマップリンクの形式が間違っています。`);
						return;
					}
				}
				await interaction.reply(`https://assets.ppy.sh/beatmaps/${BeatmapsetId}/covers/raw.jpg`);
				return;
			}

			if (interaction.commandName == "ifmod") {
				let playername = interaction.options.get("username")?.value;
				if (playername == undefined) {
					let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
					const username = allUser["Bancho"][interaction.user.id]?.name;
					if (username == undefined) {
						await interaction.reply("ユーザー名が登録されていません。/osureg、!osuregで登録するか、ユーザー名を入力してください。");
						allUser = null;
						return;
					}
					playername = username;
					allUser = null;
				}

				const maplink = interaction.options.get("beatmaplink")?.value;
				let scoreSearchMode = interaction.options.get("score")?.value;
				scoreSearchMode = !scoreSearchMode ? 1 : Number(scoreSearchMode);

				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				if (!(regex.test(maplink) || regex2.test(maplink) || regex3.test(maplink))) {
					await interaction.reply(`ビートマップリンクの形式が間違っています。`);
					return;
				}

				const mods = new osuLibrary.Mod(interaction.options?.get("mods")?.value).get();

				if (!mods) {
					await interaction.reply("Modが存在しないか、指定できないModです。");
					return;
				}

				let mode;
				let mapInfo;
				let mapUrl;
				if (!regex.test(maplink)) {
					switch (maplink.split("/")[4].split("#")[1]) {
						case "osu":
							mode = 0;
							break;
						case "taiko":
							mode = 1;
							break;

						case "fruits":
							mode = 2;
							break;

						case "mania":
							mode = 3;
							break;

						default:
							await interaction.reply("リンク内のモードが不正です。");
							return;
					}
					mapInfo = await new osuLibrary.GetMapData(maplink, apikey, mode).getData();
					mapUrl = maplink;
				} else {
					mapInfo = await new osuLibrary.GetMapData(maplink, apikey).getDataWithoutMode();
					mode = Number(mapInfo.mode);
					mapUrl = osuLibrary.URLBuilder.beatmapURL(mapInfo.beatmapset_id, mode, mapInfo.beatmap_id);
				}

				let playersScore = await new osuLibrary.GetUserScore(playername, apikey, mode).getScoreDataWithoutMods(mapInfo.beatmap_id);

				if (playersScore.length == 0) {
					await interaction.reply(`${playername}さんのスコアが見つかりませんでした。`);
					return;
				}

				if (scoreSearchMode == 1) {
					let maxPP = 0;
					let maxPPIndex = 0;
					for (let i = 0; i < playersScore.length; i++) {
						if (Number(playersScore[i].pp) > maxPP) {
							maxPP = Number(playersScore[i].pp);
							maxPPIndex = i;
						}
					}
					playersScore = playersScore[maxPPIndex];
				} else {
					playersScore = playersScore[0];
				}

				const playersInfo = await new osuLibrary.GetUserData(playername, apikey, mode).getData();
				const mappersInfo = await new osuLibrary.GetUserData(mapInfo.creator, apikey, mode).getData();

				const acc = Math.round(tools.accuracy({
					300: playersScore.count300,
					100: playersScore.count100,
					50: playersScore.count50,
					0: playersScore.countmiss,
					geki : playersScore.countgeki,
					katu: playersScore.countkatu
				}, Tools.modeConvertAcc(mode)) * 100) / 100;

				const modsBefore = new osuLibrary.Mod(playersScore.enabled_mods).get();

				let score = {
					n300: Number(playersScore.count300),
					n100: Number(playersScore.count100),
					n50: Number(playersScore.count50),
					misses: Number(playersScore.countmiss),
					nGeki: Number(playersScore.countgeki),
					nKatu: Number(playersScore.countkatu),
					combo: Number(playersScore.maxcombo)
				};

				const calculator = new osuLibrary.CalculatePPSR(maplink, modsBefore.calc, mode);
				const PPbefore = await calculator.calculateScorePP(score);
				const SSPPbefore = await calculator.calculateSR();
				calculator.setMods(mods.calc);
				const PPafter = await calculator.calculateScorePP(score);
				const SSPPafter = await calculator.calculateSR();
				const userplays = await Tools.getAPIResponse(
					`https://osu.ppy.sh/api/get_user_best?k=${apikey}&type=string&m=${mode}&u=${playername}&limit=100`
				);
				await interaction.reply("GlobalPPの計算中です...");
				let pp = [];
				let ppForBonusPP = [];
				for (const element of userplays) {
					ppForBonusPP.push(Number(element.pp));
					if (mapInfo.beatmap_id == element.beatmap_id && PPafter > Number(userplays[userplays.length - 1].pp)) {
						pp.push(Math.round(PPafter * 100) / 100);
						continue;
					}
					pp.push(Number(element.pp));
				}
				pp.sort((a, b) => b - a);
				ppForBonusPP.sort((a, b) => b - a);

				const playcount = Number(playersInfo.playcount);
				const globalPPOld = osuLibrary.CalculateGlobalPP.calculate(ppForBonusPP, playcount);
				const globalPPwithoutBonusPP = osuLibrary.CalculateGlobalPP.calculate(pp, playcount);
				const bonusPP = Number(playersInfo.pp_raw) - globalPPOld;
				const globalPP = globalPPwithoutBonusPP + bonusPP;
				const globalPPDiff = globalPP - Number(playersInfo.pp_raw);
				const globalPPDiffPrefix = globalPPDiff > 0 ? "+" : "";

				const rankData = await osuLibrary.GetRank.get(globalPP, mode);
				const rankDataBefore = playersInfo.pp_rank;
				const rankDiff = rankData.rank - rankDataBefore;
				const rankDiffPrefix = rankDiff > 0 ? "+" : "";

				let rankMessage = `**#${rankDataBefore}** → **#${rankData.rank}** (${rankDiffPrefix + rankDiff})`;
				if (rankDiff == 0) {
					rankMessage = "ランクに変動はありません。";
				}

				const playerUserURL = osuLibrary.URLBuilder.userURL(playersInfo?.user_id);
				const mapperUserURL = osuLibrary.URLBuilder.userURL(mappersInfo?.user_id);
				const mapperIconURL = osuLibrary.URLBuilder.iconURL(mappersInfo?.user_id);
				const backgroundURL = osuLibrary.URLBuilder.backgroundURL(maplink);

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`${mapInfo.artist} - ${mapInfo.title} [${mapInfo.version}]`)
					.setDescription(`Played by [${playersInfo.username}](${playerUserURL})`)
					.addFields({ name: `Mods: ${modsBefore.str} → ${mods.str} Acc: ${acc}% Miss: ${playersScore.countmiss}`, value: `**PP:** **${PPbefore.toFixed(2)}**/${SSPPbefore.pp.toFixed(2)}pp → **${PPafter.toFixed(2)}**/${SSPPafter.pp.toFixed(2)}pp`, inline: true })
					.addFields({ name: `GlobalPP`, value: `**${Number(playersInfo.pp_raw).toLocaleString()}**pp → **${(Math.round(globalPP * 10) / 10).toLocaleString()}**pp (${globalPPDiffPrefix + (globalPPDiff).toFixed(1)})`, inline: false })
					.addFields({ name: `Rank`, value: rankMessage, inline: false })
					.setURL(mapUrl)
					.setAuthor({ name: `Mapped by ${mapInfo.creator}`, iconURL: mapperIconURL, url: mapperUserURL })
					.setImage(backgroundURL);
				await interaction.channel.send({ embeds: [embed] });
				return;
			}

			if (interaction.commandName == "iffc") {
				let playername = interaction.options.get("username")?.value;
				if (playername == undefined) {
					let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
					const username = allUser["Bancho"][interaction.user.id]?.name;
					if (username == undefined) {
						await interaction.reply("ユーザー名が登録されていません。/osureg、!osuregで登録するか、ユーザー名を入力してください。");
						allUser = null;
						return;
					}
					playername = username;
					allUser = null;
				}

				const maplink = interaction.options.get("beatmaplink")?.value;
				let scoreSearchMode = interaction.options.get("score")?.value;
				scoreSearchMode = !scoreSearchMode ? 1 : Number(scoreSearchMode);

				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				if (!(regex.test(maplink) || regex2.test(maplink) || regex3.test(maplink))) {
					await interaction.reply(`ビートマップリンクの形式が間違っています。`);
					return;
				}

				let mode;
				let mapInfo;
				let mapUrl;
				if (!regex.test(maplink)) {
					switch (maplink.split("/")[4].split("#")[1]) {
						case "osu":
							mode = 0;
							break;
						case "taiko":
							mode = 1;
							break;

						case "fruits":
							mode = 2;
							break;

						case "mania":
							mode = 3;
							break;

						default:
							await interaction.reply("リンク内のモードが不正です。");
							return;
					}
					mapInfo = await new osuLibrary.GetMapData(maplink, apikey, mode).getData();
					mapUrl = maplink;
				} else {
					mapInfo = await new osuLibrary.GetMapData(maplink, apikey).getDataWithoutMode();
					mode = Number(mapInfo.mode);
					mapUrl = osuLibrary.URLBuilder.beatmapURL(mapInfo.beatmapset_id, mode, mapInfo.beatmap_id);
				}

				let playersScore = await new osuLibrary.GetUserScore(playername, apikey, mode).getScoreDataWithoutMods(mapInfo.beatmap_id);

				if (playersScore.length == 0) {
					await interaction.reply(`${playername}さんのスコアが見つかりませんでした。`);
					return;
				}

				if (scoreSearchMode == 1) {
					let maxPP = 0;
					let maxPPIndex = 0;
					for (let i = 0; i < playersScore.length; i++) {
						if (Number(playersScore[i].pp) > maxPP) {
							maxPP = Number(playersScore[i].pp);
							maxPPIndex = i;
						}
					}
					playersScore = playersScore[maxPPIndex];
				} else {
					playersScore = playersScore[0];
				}

				const playersInfo = await new osuLibrary.GetUserData(playername, apikey, mode).getData();
				const mappersInfo = await new osuLibrary.GetUserData(mapInfo.creator, apikey, mode).getData();

				const acc = Math.round(tools.accuracy({
					300: playersScore.count300,
					100: playersScore.count100,
					50: playersScore.count50,
					0: playersScore.countmiss,
					geki : playersScore.countgeki,
					katu: playersScore.countkatu
				}, Tools.modeConvertAcc(mode)) * 100) / 100;

				const mods = new osuLibrary.Mod(playersScore.enabled_mods).get();

				let score = {
					n300: Number(playersScore.count300),
					n100: Number(playersScore.count100),
					n50: Number(playersScore.count50),
					misses: Number(playersScore.countmiss),
					nGeki: Number(playersScore.countgeki),
					nKatu: Number(playersScore.countkatu),
					combo: Number(playersScore.maxcombo)
				};

				const calculator = new osuLibrary.CalculatePPSR(maplink, mods.calc, mode);
				const PPbefore = await calculator.calculateScorePP(score);
				const SSPPbefore = await calculator.calculateSR();
				
				const mapData = await calculator.getMap();
				const map = new rosu.Beatmap(mapData);
				const passedObjects = Tools.calcPassedObject(playersScore, mode);
				const IfFC = osuLibrary.CalculateIfFC.calculate(score, mode, passedObjects, mods.calc, map);
				const PPafter = IfFC.ifFCPP;

				const userplays = await Tools.getAPIResponse(
					`https://osu.ppy.sh/api/get_user_best?k=${apikey}&type=string&m=${mode}&u=${playername}&limit=100`
				);
				await interaction.reply("GlobalPPの計算中です...");
				let pp = [];
				let ppForBonusPP = [];
				for (const element of userplays) {
					ppForBonusPP.push(Number(element.pp));
					if (mapInfo.beatmap_id == element.beatmap_id && PPafter > Number(userplays[userplays.length - 1].pp)) {
						pp.push(Math.round(PPafter * 100) / 100);
						continue;
					}
					pp.push(Number(element.pp));
				}
				pp.sort((a, b) => b - a);
				ppForBonusPP.sort((a, b) => b - a);

				const playcount = Number(playersInfo.playcount);
				const globalPPOld = osuLibrary.CalculateGlobalPP.calculate(ppForBonusPP, playcount);
				const globalPPwithoutBonusPP = osuLibrary.CalculateGlobalPP.calculate(pp, playcount);
				const bonusPP = Number(playersInfo.pp_raw) - globalPPOld;
				const globalPP = globalPPwithoutBonusPP + bonusPP;
				const globalPPDiff = globalPP - Number(playersInfo.pp_raw);
				const globalPPDiffPrefix = globalPPDiff > 0 ? "+" : "";

				const rankData = await osuLibrary.GetRank.get(globalPP, mode);
				const rankDataBefore = playersInfo.pp_rank;
				const rankDiff = rankData.rank - rankDataBefore;
				const rankDiffPrefix = rankDiff > 0 ? "+" : "";

				let rankMessage = `**#${rankDataBefore}** → **#${rankData.rank}** (${rankDiffPrefix + rankDiff})`;
				if (rankDiff == 0) {
					rankMessage = "ランクに変動はありません。";
				}

				const playerUserURL = osuLibrary.URLBuilder.userURL(playersInfo?.user_id);
				const mapperUserURL = osuLibrary.URLBuilder.userURL(mappersInfo?.user_id);
				const mapperIconURL = osuLibrary.URLBuilder.iconURL(mappersInfo?.user_id);
				const backgroundURL = osuLibrary.URLBuilder.backgroundURL(maplink);

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`${mapInfo.artist} - ${mapInfo.title} [${mapInfo.version}]`)
					.setDescription(`Played by [${playersInfo.username}](${playerUserURL})`)
					.addFields({ name: `Mods: ${mods.str} Acc: ${acc}% Miss: ${playersScore.countmiss}`, value: `**PP:** **${PPbefore.toFixed(2)}**/${SSPPbefore.pp.toFixed(2)}pp → **${PPafter.toFixed(2)}**/${SSPPbefore.pp.toFixed(2)}pp`, inline: true })
					.addFields({ name: `GlobalPP`, value: `**${Number(playersInfo.pp_raw).toLocaleString()}**pp → **${(Math.round(globalPP * 10) / 10).toLocaleString()}**pp (${globalPPDiffPrefix + (globalPPDiff).toFixed(1)})`, inline: false })
					.addFields({ name: `Rank`, value: rankMessage, inline: false })
					.setURL(mapUrl)
					.setAuthor({ name: `Mapped by ${mapInfo.creator}`, iconURL: mapperIconURL, url: mapperUserURL })
					.setImage(backgroundURL);
				await interaction.channel.send({ embeds: [embed] });
				return;
			}

			if (interaction.commandName == "srchart") {
				const maplink = interaction.options.get("beatmaplink").value;
				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				if (!(regex.test(maplink) || regex2.test(maplink) || regex3.test(maplink))) {
					await interaction.reply(`ビートマップリンクの形式が間違っています。`);
					return;
				}

				let mode;
				let mapdata;
				if (regex.test(maplink)) {
					switch (maplink.split("/")[4].split("#")[1]) {
						case "osu":
							mode = 0;
							break;

						case "taiko":
							mode = 1;
							break;

						case "fruits":
							mode = 2;
							break;

						case "mania":
							mode = 3;
							break;

						default:
							await interaction.reply("リンク内のモードが不正です。");
							return;
					}
					mapdata = await new osuLibrary.GetMapData(maplink, apikey, mode).getData();
				} else {
					mapdata = await new osuLibrary.GetMapData(maplink, apikey).getDataWithoutMode();
					mode = Number(mapdata.mode);
				}
				const beatmapId = mapdata.beatmap_id;

				await interaction.reply("SRの計算中です。")
				await osuLibrary.SRChart.calculate(beatmapId, mode).then(async (res) => {
					const sr = await new osuLibrary.CalculatePPSR(beatmapId, 0, mode).calculateSR();
					await interaction.channel.send(`**${mapdata.artist} - ${mapdata.title} [${mapdata.version}]**のSRチャートです。最高は${sr.sr.toFixed(2)}★です。`);
					await interaction.channel.send({ files: [{ attachment: res, name: "SRchart.png" }] });
				}).catch(async (e) => {
					console.log(e);
					await interaction.channel.send("計算できませんでした。");
				});
				return;
			}

			if (interaction.commandName == "preview") {
				const maplink = interaction.options.get("beatmaplink").value;

				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				if (!(regex.test(maplink) || regex2.test(maplink) || regex3.test(maplink))) {
					await interaction.reply(`ビートマップリンクの形式が間違っています。`);
					return;
				}

				const mapInfo = await new osuLibrary.GetMapData(maplink, apikey).getDataWithoutMode();
				const mode = Number(mapInfo.mode);
				const beatmapid = mapInfo.beatmap_id;
				const previewlink = `https://osu-preview.jmir.xyz/preview#${beatmapid}`
				const calculator = new osuLibrary.CalculatePPSR(maplink, 0, mode);
				const sr = await calculator.calculateSR();
				const objectCount = await calculator.calcObject();

				const mapperdata = await new osuLibrary.GetUserData(mapInfo.creator, apikey).getData();
				const mapperUserURL = osuLibrary.URLBuilder.userURL(mapperdata?.user_id);
				const mapperIconURL = osuLibrary.URLBuilder.iconURL(mapperdata?.user_id);
				const backgroundURL = osuLibrary.URLBuilder.backgroundURL(maplink);
				const mapUrl = osuLibrary.URLBuilder.beatmapURL(mapInfo.beatmapset_id, mode, mapInfo.beatmap_id);

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`${mapInfo.artist} - ${mapInfo.title} [${mapInfo.version}]`)
					.setDescription(`Combo: \`${mapInfo.max_combo}x\` Stars: \`${sr.sr.toFixed(2)}★\` \n Length: \`${Tools.formatTime(Number(mapInfo.total_length))} (${Tools.formatTime(Number(mapInfo.hit_length))})\` BPM: \`${mapInfo.bpm}\` Objects: \`${objectCount}\` \n CS: \`${mapInfo.diff_size}\` AR: \`${mapInfo.diff_approach}\` OD: \`${mapInfo.diff_overall}\` HP: \`${mapInfo.diff_drain}\` Spinners: \`${mapInfo.count_spinner}\``)
					.setURL(mapUrl)
					.setAuthor({ name: `Mapped by ${mapInfo.creator}`, iconURL: mapperIconURL, url: mapperUserURL })
					.addFields({ name: "Preview link", value: `[Preview this map!](${previewlink})`, inline: true })
					.setImage(backgroundURL);
				await interaction.reply({ embeds: [embed] });
				return;
			}

			if (interaction.commandName == "calculatepp") {
				let mode = interaction.options.get("mode").value;
				const osufile = interaction.options.get("beatmapfile").attachment.attachment;

				if (!osufile.includes(".osu")) {
					await interaction.reply("ファイルの形式が間違っています。〇〇.osuファイルを送信してください。");
					return;
				}

				switch (mode) {
					case "osu":
						mode = 0;
						break;

					case "taiko":
						mode = 1;
						break;

					case "catch":
						mode = 2;
						break;

					case "mania":
						mode = 3;
						break;
				}

				let mod = new osuLibrary.Mod(interaction.options.get("mods")?.value).get();

				if (!mod) {
					await interaction.reply("Modが存在しないか、指定できないModです。");
					return;
				}

				const beatmapdata = await Tools.getAPIResponse(osufile, {
					responseType: "arraybuffer"
				});

				await interaction.reply("計算中です。");
				const map = new rosu.Beatmap(new Uint8Array(Buffer.from(beatmapdata)));
				const beatmapDataStream = Readable.from(Buffer.from(beatmapdata));
				const lineReader = require("readline").createInterface({ input: beatmapDataStream });
				let Mapinfo = {
					Mode: 0,
					Artist: "",
					Title: "",
					Creator: "",
					Version: "",
					HPDrainRate: 0,
					CircleSize: 0,
					OverallDifficulty: 0,
					ApproachRate: 0,
					BPM: "0",
					TotalLength: 0
				};

				let timingpointflag = false;
				let hitobjectflag = false;
				let BPM = [];

				lineReader.on("line", (line) => {
					if (timingpointflag && line.split(",")[6] == "1") {
						BPM.push(Math.round(1 / Number(line.split(",")[1]) * 1000 * 60 * 10) / 10);
					}

					if (line.startsWith("[TimingPoints]")) {
						timingpointflag = true;
					}

					if (line.startsWith("[Colours]")) {
						timingpointflag = false;
					}

					if (line.startsWith("[HitObjects]")) {
						timingpointflag = false;
						hitobjectflag = true;
					}

					if (hitobjectflag && !isNaN(Number(line.split(",")[2]))) {
						const ms = Number(line.split(",")[2]);
						const totalSeconds = Math.floor(ms / 1000);
						Mapinfo.TotalLength = Tools.formatTime(totalSeconds);
					}

					if (line.startsWith("[")) return;
					const key = line.split(":")[0];
					const value = line.split(":")?.slice(1)?.join(":");

					if (key === "Mode") Mapinfo.Mode = Number(value);
					if (key === "Artist") Mapinfo.Artist = value;
					if (key === "Title") Mapinfo.Title = value;
					if (key === "Creator") Mapinfo.Creator = value;
					if (key === "Version") Mapinfo.Version = value;
					if (key === "HPDrainRate") Mapinfo.HPDrainRate = Number(value);
					if (key === "CircleSize") Mapinfo.CircleSize = Number(value);
					if (key === "OverallDifficulty") Mapinfo.OverallDifficulty = Number(value);
					if (key === "ApproachRate") Mapinfo.ApproachRate = Number(value);
				});

				lineReader.on("close", async () => {
					if (Mapinfo.Mode != mode && Mapinfo.Mode != 0) mode = Mapinfo.Mode;
					map.convert(mode);

					let difficulty = new rosu.Difficulty({
						mods: mod.calc
					}).calculate(map);

					const PP98 = ppDigits(new rosu.Performance({
						accuracy: 98,
						mods: mod.calc
					}).calculate(difficulty).pp.toFixed(2));

					const PP99 = ppDigits(new rosu.Performance({
						accuracy: 99,
						mods: mod.calc
					}).calculate(difficulty).pp.toFixed(2));

					const PP995 = ppDigits(new rosu.Performance({
						accuracy: 99.5,
						mods: mod.calc
					}).calculate(difficulty).pp.toFixed(2));

					const PP100 = ppDigits(new rosu.Performance({
						accuracy: 100,
						mods: mod.calc
					})
					.calculate(difficulty).pp.toFixed(2));

					const maxcombo = new rosu.Difficulty({
						mods: mod.calc
					}).calculate(map).maxCombo;
					Mapinfo.BPM = Math.max(...BPM) == Math.min(...BPM) ? Math.max(...BPM).toString() : `${Math.min(...BPM)} - ${Math.max(...BPM)}`;
					function ppDigits(ppstring) {
						switch (ppstring.length) {
							case 7:
								return  `  ${ppstring} `;
							case 6:
								return  `  ${ppstring}  `;
							case 5:
								return  `  ${ppstring}   `;
							case 4:
								return  `   ${ppstring}   `;

							default:
								return ppstring;
						}
					}

					if (mod.array.includes("NC") || mod.array.includes("DT")) {
						Mapinfo.BPM *= 1.5;
						Mapinfo.TotalLength /= 1.5;
					} else if (mod.array.includes("HT")) {
						Mapinfo.BPM *= 0.75;
						Mapinfo.TotalLength /= 0.75;
					}

					if (mod.array.includes("HR")) {
						Mapinfo.OverallDifficulty *= 1.4;
						Mapinfo.ApproachRate *= 1.4;
						Mapinfo.CircleSize *= 1.3;
						Mapinfo.HPDrainRate *= 1.4;
					} else if (mod.array.includes("EZ")) {
						Mapinfo.OverallDifficulty *= 0.5;
						Mapinfo.ApproachRate *= 0.5;
						Mapinfo.CircleSize *= 0.5;
						Mapinfo.HPDrainRate *= 0.5;
					}

					Mapinfo.OverallDifficulty = Math.max(0, Math.min(10, Mapinfo.OverallDifficulty));
					Mapinfo.ApproachRate = Math.max(0, Math.min(10, Mapinfo.ApproachRate));
					Mapinfo.CircleSize = Math.max(0, Math.min(10, Mapinfo.CircleSize));
					Mapinfo.HPDrainRate = Math.max(0, Math.min(10, Mapinfo.HPDrainRate));
					Mapinfo.OverallDifficulty = Math.round(Mapinfo.OverallDifficulty * 10) / 10;
					Mapinfo.ApproachRate = Math.round(Mapinfo.ApproachRate * 10) / 10;
					Mapinfo.CircleSize = Math.round(Mapinfo.CircleSize * 10) / 10;
					Mapinfo.HPDrainRate = Math.round(Mapinfo.HPDrainRate * 10) / 10;

					const objectCount = map.nObjects;
					const embed = new EmbedBuilder()
						.setColor("Blue")
						.setAuthor({ name: `Mapped by ${Mapinfo.Creator}` })
						.setTitle(`${Mapinfo.Artist} - ${Mapinfo.Title}`)
						.setURL(osufile)
						.addFields({ name: `${osuLibrary.Tools.modeEmojiConvert(mode)} [**__${Mapinfo.Version}__**] **+ ${mod.str}**`, value: `Combo: \`${maxcombo}x\` Stars: \`${Calculated.difficulty.stars.toFixed(2)}★\` \n Length: \`${Mapinfo.TotalLength}\` BPM: \`${Mapinfo.BPM}\` Objects: \`${objectCount}\` \n CS: \`${Mapinfo.CircleSize}\` AR: \`${Mapinfo.ApproachRate}\` OD: \`${Mapinfo.OverallDifficulty}\`  HP: \`${Mapinfo.HPDrainRate}\` `, inline: false })
						.addFields({ name: `**__PP__**`, value: `\`\`\` Acc |    98%   |    99%   |   99.5%  |   100%   | \n ----+----------+----------+----------+----------+  \n  PP |${PP98}|${PP99}|${PP995}|${PP100}|\`\`\``, inline: true });
					await interaction.channel.send({ embeds: [embed] });
				});
				return;
			}

			if (interaction.commandName == "osubgquiz" || interaction.commandName == "osubgquizpf") {
				if (fs.existsSync(`./OsuPreviewquiz/${interaction.channel.id}.json`)) {
					await interaction.reply("既にクイズが開始されています。/quizendで終了するか回答してください。");
					return;
				}

				const username = interaction.options.get("username").value;
				let mode = interaction.options.get("mode").value;

				switch (mode) {
					case "osu":
						mode = 0;
						break;
					case "taiko":
						mode = 1;
						break;
					case "catch":
						mode = 2;
						break;
					case "mania":
						mode = 3;
						break;
				}

				const quizdata = await Tools.getAPIResponse(`https://osu.ppy.sh/api/get_user_best?k=${apikey}&u=${username}&type=string&m=${mode}&limit=100`);

				if (quizdata.length == 0) {
					await interaction.reply("記録が見つかりませんでした。");
					return;
				}

				if (quizdata.length < 10) {
					await interaction.reply("記録が10個以下であったためクイズの問題を取得できませんでした。");
					return;
				}

				await interaction.reply("クイズを開始します。問題は10問です。\n!skipでスキップ、!hintでヒントを表示します。");

				const randomnumber = [];
				while (randomnumber.length < 10) {
					const randomNumber = Math.floor(Math.random() * Math.min(quizdata.length, 100));
					if (!randomnumber.includes(randomNumber)) randomnumber.push(randomNumber);
				}

				const randommap = [];
				const randommaptitle = [];
				for (const element of randomnumber) {
					let errorFlag = false;
					const beatmapsetid = await new osuLibrary.GetMapData(quizdata[element].beatmap_id, apikey, mode).getData()
						.catch(() => {
							errorFlag = true;
						});
					if (errorFlag) continue;
					randommap.push(beatmapsetid.beatmapset_id);
					randommaptitle.push(beatmapsetid.title);
				}

				let randomjson = [];
				const ifPerferct = interaction.commandName == "osubgquizpf";
				for (let i = 0; i < randommap.length; i++) {
					randomjson.push({"mode": "BG", "number": i + 1, "id": randommap[i], "name": randommaptitle[i].replace(/\([^)]*\)/g, "").trimEnd(), "quizstatus": false, "Perfect": ifPerferct, "Answerer": "", "hint": false});
				}
				fs.writeJsonSync(`./OsuPreviewquiz/${interaction.channel.id}.json`, randomjson, { spaces: 4, replacer: null });
				let jsondata = fs.readJsonSync(`./OsuPreviewquiz/${interaction.channel.id}.json`);
				await interaction.channel.send(`問題1のBGを表示します。`);
				await Tools.getAPIResponse(`https://assets.ppy.sh/beatmaps/${jsondata[0].id}/covers/raw.jpg`, { responseType: "arraybuffer" })
					.then(async BGdata => {
						await interaction.channel.send({ files: [{ attachment: BGdata, name: "background.jpg" }] });
						BGdata = null;
					});
				jsondata = null;
				return;
			}

			if (interaction.commandName == "osuquiz" || interaction.commandName == "osuquizpf") {
				if (fs.existsSync(`./OsuPreviewquiz/${interaction.channel.id}.json`)) {
					await interaction.reply("既にクイズが開始されています。/quizendで終了するか回答してください。");
					return;
				}

				const username = interaction.options.get("username").value;
				let mode = interaction.options.get("mode").value;

				switch (mode) {
					case "osu":
						mode = 0;
						break;
					case "taiko":
						mode = 1;
						break;
					case "catch":
						mode = 2;
						break;
					case "mania":
						mode = 3;
						break;
				}

				const quizdata = await Tools.getAPIResponse(`https://osu.ppy.sh/api/get_user_best?k=${apikey}&u=${username}&type=string&m=${mode}&limit=100`);

				if (quizdata.length == 0) {
					await interaction.reply("記録が見つかりませんでした。");
					return;
				}

				if (quizdata.length < 10) {
					await interaction.reply("記録が10個以下であったためクイズの問題を取得できませんでした。");
					return;
				}

				await interaction.reply("クイズを開始します。問題は10問です。\n!skipでスキップ、!hintでヒントを表示します。");

				const randomnumber = [];
				while (randomnumber.length < 10) {
					const randomNumber = Math.floor(Math.random() * Math.min(quizdata.length, 100));
					if (!randomnumber.includes(randomNumber)) randomnumber.push(randomNumber);
				}

				const randommap = [];
				const randommaptitle = [];
				for (const element of randomnumber) {
					let errorFlag = false;
					const beatmapsetid = await new osuLibrary.GetMapData(quizdata[element].beatmap_id, apikey, mode).getData()
						.catch(() => {
							errorFlag = true;
						});
					if (errorFlag) continue;
					randommap.push(beatmapsetid.beatmapset_id);
					randommaptitle.push(beatmapsetid.title);
				}

				let randomjson = [];
				const ifPerferct = interaction.commandName == "osuquizpf";
				for (let i = 0; i < randommap.length; i++) {
					randomjson.push({"mode": "pre", "number": i + 1, "id": randommap[i], "name": randommaptitle[i].replace(/\([^)]*\)/g, "").trimEnd(), "quizstatus": false, "Perfect": ifPerferct, "Answerer": "", "hint": false});
				}
				fs.writeJsonSync(`./OsuPreviewquiz/${interaction.channel.id}.json`, randomjson, { spaces: 4, replacer: null });
				let jsondata = fs.readJsonSync(`./OsuPreviewquiz/${interaction.channel.id}.json`);
				await interaction.channel.send(`問題1のプレビューを再生します。`);
				await Tools.getAPIResponse(`https://b.ppy.sh/preview/${jsondata[0].id}.mp3`, { responseType: "arraybuffer" })
					.then(async audioData => {
						await interaction.channel.send({ files: [{ attachment: audioData, name: "audio.mp3" }] });
						audioData = null;
					});
				jsondata = null;
				return;
			}

			if (interaction.commandName == "quizend") {
				if (!fs.existsSync(`./OsuPreviewquiz/${interaction.channel.id}.json`)) {
					await interaction.reply("クイズが開始されていません。");
					return;
				}
				let answererarray = fs.readJsonSync(`./OsuPreviewquiz/${interaction.channel.id}.json`);
				let answererstring = "";
				for (let i = 0; i < answererarray.length; i++) {
					if (answererarray[i].Answerer == "") continue;
					if (answererarray[i].hint) {
						answererstring += `問題${i + 1}の回答者: **${answererarray[i].Answerer}** ※ヒント使用\n`;
					} else {
						answererstring += `問題${i + 1}の回答者: **${answererarray[i].Answerer}**\n`;
					}
				}
				await interaction.reply(`クイズが終了しました！お疲れ様でした！\n${answererstring}`);
				fs.removeSync(`./OsuPreviewquiz/${interaction.channel.id}.json`);
				answererarray = null;
				return;
			}

			if (interaction.commandName == "osusearch") {
				await interaction.reply("検索中です...");
				let seracheddata = await v2.beatmaps.search({
					query: interaction.options.get("query").value,
					mode: Tools.modeConvertSearch(interaction.options.get("mode").value)
				});

				if (seracheddata.beatmapsets.length == 0) {
					await interaction.channel.send("検索結果が見つかりませんでした。");
					return;
				}

				let embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`検索結果: ${interaction.options.get("query").value}`)
					.setImage(`https://assets.ppy.sh/beatmaps/${seracheddata.beatmapsets[0].beatmaps[0].beatmapset_id}/covers/cover.jpg`)
					.setTimestamp();

				let data = [];
				for (let i = 0; i < Math.min(seracheddata.beatmapsets.length, 5); i++) {
					let array = seracheddata.beatmapsets[i].beatmaps;
					array.sort((a, b) => a.difficulty_rating - b.difficulty_rating);
					const maxRatingObj = array[array.length - 1];
					const minRatingObj = array[0];
					let maxsrobj = maxRatingObj.id;
					let minsrobj = minRatingObj.id;
					const maxsrdata = new osuLibrary.CalculatePPSR(maxsrobj, 0, Tools.modeConvertMap(interaction.options.get("mode").value));
					const minsrdata = new osuLibrary.CalculatePPSR(minsrobj, 0, Tools.modeConvertMap(interaction.options.get("mode").value));
					const nmmaxppData = await maxsrdata.calculateSR();
					const nmminppData = await minsrdata.calculateSR();
					const dtmaxppData = await maxsrdata.calculateDT();
					const dtminppData = await minsrdata.calculateDT();
					const srstring = nmmaxppData.sr == nmminppData.sr ? `SR: ☆**${nmmaxppData.sr.toFixed(2)}** (DT ☆**${dtmaxppData.sr.toFixed(2)}**)` : `SR: ☆**${nmminppData.sr.toFixed(2)} ~ ${nmmaxppData.sr.toFixed(2)}** (DT ☆**${dtminppData.sr.toFixed(2)} ~ ${dtmaxppData.sr.toFixed(2)}**)`;
					const ppstring = nmmaxppData.pp == nmminppData.pp ? `PP: **${nmmaxppData.pp.toFixed(2)}**pp (DT **${dtmaxppData.pp.toFixed(2)}**pp)` : `PP: **${nmminppData.pp.toFixed(2)} ~ ${nmmaxppData.pp.toFixed(2)}**pp (DT **${dtminppData.pp.toFixed(2)} ~ ${dtmaxppData.pp.toFixed(2)}**pp)`;
					data.push({ name: `${i + 1}. ${seracheddata.beatmapsets[i].title} - ${seracheddata.beatmapsets[i].artist}`, value: `▸Mapped by **${seracheddata.beatmapsets[i].creator}**\n▸${srstring}\n▸${ppstring}\n▸**Download**: [Map](https://osu.ppy.sh/beatmapsets/${seracheddata.beatmapsets[i].id}) | [Nerinyan](https://api.nerinyan.moe/d/${seracheddata.beatmapsets[i].id}) | [Nerinyan (No Vid)](https://api.nerinyan.moe/d/${seracheddata.beatmapsets[i].id}?nv=1) | [Beatconnect](https://beatconnect.io/b/${seracheddata.beatmapsets[i].id})` })
				}
				embed.addFields(data);
				await interaction.channel.send({ embeds: [embed] });
				return;
			}

			if (interaction.commandName == "osureg") {
				const username = interaction.user.id;
				const osuid = interaction.options.get("username").value;
				const userData = await new osuLibrary.GetUserData(osuid, apikey).getDataWithoutMode();
				if (!userData) {
					await interaction.reply("ユーザーが見つかりませんでした。");
					return;
				}
				let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
				if (!allUser["Bancho"][username]) {
					allUser["Bancho"][username] = {
						"name": osuid
					};
				} else {
					allUser["Bancho"][username].name = osuid;
				}
				fs.writeJsonSync("./ServerDatas/PlayerData.json", allUser, { spaces: 4, replacer: null });
				await interaction.reply(`${interaction.user.displayName}さんは${osuid}として保存されました!`);
				allUser = null;
				return;
			}

			if (interaction.commandName == "ratchecker") {
				function removeExtentions(fileName) {
					return fileName.split(".").slice(0, -1).join(".");
				}
				const modulefile = interaction.options.get("file").attachment;
				let outputBoolean = interaction.options.get("output")?.value;
				if (!outputBoolean) outputBoolean = false;
				if (!modulefile.name.endsWith(".zip")) {
					await interaction.reply("ファイル形式が不正です。");
					return;
				}
				const message = await interaction.reply("ファイルの解析中です...");
				const modulefiledata = await Tools.getAPIResponse(modulefile.url, { responseType: "stream" });
				const moduleUnzippedName = `./temp/Unzipped ${removeExtentions(modulefile.name)}`;
				const stream = fs.createWriteStream(`./temp/${modulefile.name}`);
				modulefiledata.pipe(stream);
				await new Promise((resolve, reject) => {
					stream.on("finish", resolve);
					stream.on("error", reject);
				});
				const zip = new AdmZip(`./temp/${modulefile.name}`);
				await zip.extractAllToAsync(moduleUnzippedName, true);
				const ratChecker = new RatChecker();
				const result = await ratChecker.searchDirectory(moduleUnzippedName);
				if (result.length == 0) {
					const embed = new EmbedBuilder()
						.setColor("Green")
						.setTitle("RATチェッカー")
						.setDescription("このファイルに問題はありませんでした。")
						.setTimestamp();
					await message.edit({ embeds: [embed] });
				} else {
					const embed = new EmbedBuilder()
						.setColor("Red")
						.setTitle("RATチェッカー")
						.setTimestamp();
					let cautions = 0;
					let dangerous = 0;
					let added = 0
					if (outputBoolean) fs.writeFileSync(`./temp/Unzipped ${removeExtentions(modulefile.name)}/ratcheck.txt`, "");
					result.sort((a, b) => b.reasons.length - a.reasons.length);
					for (const element of result) {
						const fileName = element.file.replace(`temp/Unzipped ${removeExtentions(modulefile.name)}/`, "");
						let reasonStr = "";
						if (element.reasons.length == 1) {
							cautions++;
							for (const reason of element.reasons) {
								reasonStr += reason + "\n";
							}
							if (outputBoolean) fs.appendFileSync(`./temp/Unzipped ${removeExtentions(modulefile.name)}/ratcheck.txt`, `ファイル: ${fileName} (${element.line}行目)\n警告レベル: 注意\n理由: ${reasonStr}内容:\n${element.content}\n\n`);
						} else if (element.reasons.length > 2) {
							dangerous++;
							for (const reason of element.reasons) {
								reasonStr += `- **${reason}**\n`;
							}
							if (added < 5) {
								embed.addFields({
									name: `ファイル: ${fileName} (${element.line}行目)`,
									value: `**理由**:\n${reasonStr}`
								});
								added++;
							}
							if (outputBoolean) fs.appendFileSync(`./temp/Unzipped ${removeExtentions(modulefile.name)}/ratcheck.txt`, `ファイル: ${fileName} (${element.line}行目)\n警告レベル: 危険\n理由:\n${reasonStr}内容:\n${element.content}\n\n`);
						}
					}
					embed.setDescription(`このファイルには問題があります。\n危険: **${dangerous}**件\n注意: **${cautions}**件`);
					await message.edit({ embeds: [embed] });
					if (outputBoolean) await interaction.channel.send({ files: [{ attachment: `./temp/Unzipped ${removeExtentions(modulefile.name)}/ratcheck.txt`, name: "ratcheck.txt" }] });
				}
				fs.removeSync(`./temp/${modulefile.name}`);
				fs.removeSync(moduleUnzippedName);
				return;
			}

			if (interaction.commandName == "loc") {
				const username = interaction.options.get("username").value;
				const reponame = interaction.options.get("repository").value;
				await interaction.reply("LOCの計算中です...");
				const locdata = await Tools.getAPIResponse(`https://api.codetabs.com/v1/loc?github=${username}/${reponame}`);
				for (const element of locdata) {
					if (element.language === "Total") {
						const totalfilecount = element.files;
						const totalline = element.lines;
						const totalblanks = element.blanks;
						const comments = element.comments;
						const totalLOC = element.linesOfCode;
						await interaction.channel.send(`リポジトリ: **${username}/${reponame}**\nファイル数: **${totalfilecount}**\n総行数: **${totalline}**\n空白行数: **${totalblanks}**\nコメント行数: **${comments}**\n---------------\nコード行数: **${totalLOC}**`);
						break;
					}
				}
				return;
			}

			if (interaction.commandName == "backup") {
				if (interaction.user.id != BotadminId) {
					interaction.reply("このコマンドはBOT管理者のみ実行できます。");
					return;
				}

				const backuptime = interaction.options.get("backuptime").value;
				const directory = "./Backups";
				const sortedFiles = Tools.getFilesSortedByDate(directory).reverse();
				const wannabackuptime = backuptime - 1;
				const wannabackup = sortedFiles[wannabackuptime];

				if (wannabackup == undefined) {
					interaction.reply("その期間のバックアップファイルは存在しません。");
					return;
				}

				const allbackupfilescount = fs.readdirSync(`./Backups/${wannabackup}`).length;
				const message = await interaction.reply(`${wannabackup}のバックアップの復元中です。(${allbackupfilescount}ファイル)\n${Tools.createProgressBar(0)}`);
				const percentstep = 100 / allbackupfilescount;
				let backupfilescount = 0;
				for (const backupfiles of fs.readdirSync(`./Backups/${wannabackup}`)) {
					fs.copySync(`./Backups/${wannabackup}/${backupfiles}`,`./${backupfiles}`);
					backupfilescount++;
					await message.edit(`バックアップの復元中です。(${backupfilescount}ファイル)\n${Tools.createProgressBar(Math.floor(percentstep * backupfilescount))}(${Math.floor(percentstep * backupfilescount)}%)`);
				}
				await message.edit(`バックアップの復元が完了しました。(${allbackupfilescount}ファイル)`);
				return;
			}

			if (interaction.commandName == "backuplist") {
				if (interaction.user.id != BotadminId) {
					await interaction.reply("このコマンドはBOT管理者のみ実行できます。");
					return;
				}

				const directory = "./Backups";
				const sortedFiles = Tools.getFilesSortedByDate(directory).reverse();
				const backupfileslist = [];
				for (let i = 0; i < Math.min(10, sortedFiles.length); i++) {
					const inputString = sortedFiles[i];
					const [datePart, hour, minute] = inputString.split(" ");
					const [year, month, day] = datePart.split("-");
					const formattedMonth = month.length === 1 ? "0" + month : month;
					const formattedDay = day.length === 1 ? "0" + day : day;
					const formattedHour = hour.length === 1 ? "0" + hour : hour;
					const formattedMinute = minute.length === 1 ? "0" + minute : minute;
					const formattedString = `${year}年${formattedMonth}月${formattedDay}日 ${formattedHour}時${formattedMinute}分`;
					backupfileslist.push(`${i + 1} | ${formattedString}`);
				}

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`バックアップ一覧`)
					.setDescription(backupfileslist.join("\n"))
					.setFooter({ text: "バックアップ一覧" })
					.setTimestamp();
				await interaction.reply({ embeds: [embed], ephemeral: true });
				return;
			}

			if (interaction.commandName == "backupcreate") {
				if (interaction.user.id != BotadminId) {
					await interaction.reply("このコマンドはBOT管理者のみ実行できます。");
					return;
				}
				const message = await interaction.reply("バックアップの作成中です。");
				await makeBackup();
				await message.edit("バックアップの作成が完了しました。");
				return;
			}

			if (interaction.commandName == "echo") {
				const message = interaction.options.get("message").value;
				await interaction.reply({ content: "送信しますね！", ephemeral: true });
				await interaction.channel.send(message);
				return;
			}

			if (interaction.commandName == "talkcount") {
				const userid = interaction.user.id;
				let serverJSONdata = fs.readJsonSync(`./ServerDatas/talkcount.json`);
				if (serverJSONdata[interaction.guildId] == undefined) {
					await interaction.reply("このサーバーでは、まだ誰も喋っていないようです。");
					serverJSONdata = null;
					return;
				}

				if (serverJSONdata[interaction.guildId][userid] == undefined) {
					await interaction.reply("あなたはまだこのサーバーで喋ったことがないようです。");
					serverJSONdata = null;
					return;
				}

				await interaction.reply(`あなたはこのサーバーで**${serverJSONdata[interaction.guildId][userid]}**回喋りました。`);
				serverJSONdata = null;
				return;
			}

			if (interaction.commandName == "talkranking") {
				let serverJSONdata = fs.readJsonSync(`./ServerDatas/talkcount.json`);
				if (serverJSONdata[interaction.guildId] == undefined) {
					await interaction.reply("このサーバーでは、まだ誰も喋っていないようです。");
					serverJSONdata = null;
					return;
				}
				await interaction.reply("ランキングを取得中です...");
				let talkranking = [];
				for (const [key, value] of Object.entries(serverJSONdata[interaction.guildId])) {
					talkranking.push([key, value]);
				}
				talkranking.sort((a, b) => {
					return b[1] - a[1];
				});
				let talkrankingmessage = ["__**話した回数ランキング**__"];
				for (let i = 0; i < Math.min(talkranking.length, 10); i++) {
					const userdata = await client.users.fetch(talkranking[i][0]);
					const username = !userdata.globalName ? userdata.username : userdata.globalName;
					talkrankingmessage.push(`**${i + 1}位**: ${username} | ${talkranking[i][1]}回`);
				}
				await interaction.channel.send(talkrankingmessage.join("\n"));
				serverJSONdata = null;
				return;
			}

			if (interaction.commandName == "talklevel") {
				const userid = interaction.user.id;
				let serverJSONdata = fs.readJsonSync(`./ServerDatas/talkcount.json`);
				if (serverJSONdata[interaction.guildId] == undefined) {
					await interaction.reply("このサーバーでは、まだ誰も喋っていないようです。");
					serverJSONdata = null;
					return;
				}

				if (serverJSONdata[interaction.guildId][userid] == undefined) {
					await interaction.reply("あなたはまだこのサーバーで喋ったことがないようです。");
					serverJSONdata = null;
					return;
				}

				const talkcount = serverJSONdata[interaction.guildId][userid];
				let level = 0;
				let count;
				let nextlevelcount = 0;
				if (talkcount < 1 + Math.floor(Math.pow(1, 1.01))) {
					nextlevelcount = 1 + Math.floor(Math.pow(1, 1.01));
				} else {
					for (count = 1; count <= talkcount + 1; count += Math.floor(Math.pow(count, 1.01))) {
						if (count <= talkcount) {
							level++;
							nextlevelcount = count + Math.floor(Math.pow(count, 1.01));
						}
					}
				}
				await interaction.reply(`あなたのこのサーバーでのレベルは**Lv${level}**です。\n**${(talkcount / nextlevelcount * 100).toFixed(2)}**%${Tools.createProgressBar(talkcount / nextlevelcount * 100)}(次のレベル: **${talkcount} / ${nextlevelcount}**)`);
				serverJSONdata = null;
				return;
			}

			if (interaction.commandName == "talklevelranking") {
				let serverJSONdata = fs.readJsonSync(`./ServerDatas/talkcount.json`);
				if (serverJSONdata[interaction.guildId] == undefined) {
					await interaction.reply("このサーバーでは、まだ誰も喋っていないようです。");
					serverJSONdata = null;
					return;
				}

				await interaction.reply("ランキングを取得中です...");
				let talkranking = [];
				for (const [key, value] of Object.entries(serverJSONdata[interaction.guildId])) {
					talkranking.push([key, value]);
				}
				talkranking.sort(function(a, b) {
					return b[1] - a[1];
				});
				let talkrankingmessage = ["__**トークレベルランキング**__"];
				for (let i = 0; i < Math.min(talkranking.length, 10); i++) {
					const userdata = await client.users.fetch(talkranking[i][0]);
					const username = !userdata.globalName ? userdata.username : userdata.globalName;
					const talkcount = talkranking[i][1];
					let level = 0;
					let count;
					let nextlevelcount = 0;
					if (talkcount < 1 + Math.floor(Math.pow(1, 1.01))) {
						nextlevelcount = 1 + Math.floor(Math.pow(1, 1.01));
					} else {
						for (count = 1; count <= talkcount + 1; count += Math.floor(Math.pow(count, 1.01))) {
							if (count <= talkcount) {
								level++;
								nextlevelcount = count + Math.floor(Math.pow(count, 1.01));
							}
						}
					}
					talkrankingmessage.push(`**${i + 1}位**: ${username} | Lv. **${level}** | 次のレベル: **${talkcount} / ${nextlevelcount}** (**${(talkcount / nextlevelcount * 100).toFixed(2)}**%)`);
				}
				await interaction.channel.send(talkrankingmessage.join("\n"));
				serverJSONdata = null;
				return;
			}

			if (interaction.commandName == "update") {
				if (interaction.user.id != BotadminId) {
					await interaction.reply("このコマンドはBOT管理者のみ実行できます。");
					return;
				}

				const fileName = interaction.options.get("file").value;

				const Base_URL = "https://raw.githubusercontent.com/puk06/HoshinoBot/main/";

				switch (fileName) {
					case "HoshinoBot.js": {
						const data = await Tools.getAPIResponse(Base_URL + "HoshinoBot.js");
						fs.writeFileSync("./HoshinoBot.js", data);
						await interaction.reply("HoshinoBot.jsのアップデートが完了しました。");
						break;
					}

					case "./src/osuLibrary.js": {
						const data = await Tools.getAPIResponse(Base_URL + "src/osuLibrary.js");
						fs.writeFileSync("./src/osuLibrary.js", data);
						await interaction.reply("osuLibrary.jsのアップデートが完了しました。");
						break;
					}

					case "./src/Utils.js": {
						const data = await Tools.getAPIResponse(Base_URL + "src/Utils.js");
						fs.writeFileSync("./src/Utils.js", data);
						await interaction.reply("Utils.jsのアップデートが完了しました。");
						break;
					}

					case "package.json": {
						const data = await Tools.getAPIResponse(Base_URL + "package.json");
						fs.writeJsonSync("./package.json", data, { spaces: 4, replacer: null });
						await interaction.reply("package.jsonのアップデートが完了しました。");
						break;
					}

					case "All Files": {
						const data1 = await Tools.getAPIResponse(Base_URL + "HoshinoBot.js");
						fs.writeFileSync("./HoshinoBot.js", data1);
						const data2 = await Tools.getAPIResponse(Base_URL + "src/osuLibrary.js");
						fs.writeFileSync("./src/osuLibrary.js", data2);
						const data3 = await Tools.getAPIResponse(Base_URL + "src/Utils.js");
						fs.writeFileSync("./src/Utils.js", data3);
						const data4 = await Tools.getAPIResponse(Base_URL+ "package.json");
						fs.writeJsonSync("./package.json", data4, { spaces: 4, replacer: null });
						await interaction.reply("全てのアップデートが完了しました。");
						break;
					}
				}
			}

			if (interaction.commandName == "restart") {
				if (interaction.user.id != BotadminId) {
					await interaction.reply("このコマンドはBOT管理者のみ実行できます。");
					return;
				}
				await interaction.reply("再起動中です...");
				process.exit(0);
			}

			if (interaction.commandName == "kawaii") {
				let tag = interaction.options.get("tag").value;
				await interaction.reply("画像の取得中です...");
				const pictureUrl = await Tools.getAPIResponse(`https://t.alcy.cc/${tag}/?json`)
					.then(data => data.url);
				let pictureData = await Tools.getAPIResponse(pictureUrl, { responseType: "arraybuffer" });
				await interaction.channel.send({ files: [{ attachment: pictureData, name: "picture.jpg" }] });
				pictureData = null;
				return;
			}
		} catch (e) {
			if (e.message == "No data found") {
				await interaction.channel.send("マップが見つかりませんでした。")
					.catch(async () => {
						await client.users.cache.get(interaction.user.id).send("こんにちは！\nコマンドを送信したそうですが、権限がなかったため送信できませんでした。もう一度Botの権限について見てみてください！")
							.then(() => {
								console.log("DMに権限に関するメッセージを送信しました。");
							})
							.catch(() => {
								console.log("エラーメッセージの送信に失敗しました。");
							});
					});
			} else {
				await asciify("Error", { font: "larry3d" })
					.then(msg => console.log(msg))
					.catch(err => console.log(err));
				console.log(e);
				await interaction.channel.send(`${interaction.user.username}さんのコマンドの実行中にエラーが発生しました。`)
					.catch(async () => {
						await client.users.cache.get(interaction.user.id).send("こんにちは！\nコマンドを送信したそうですが、権限がなかったため送信できませんでした。もう一度Botの権限について見てみてください！")
							.then(() => {
								console.log("DMに権限に関するメッセージを送信しました。");
							})
							.catch(() => {
								console.log("エラーメッセージの送信に失敗しました。");
							});
					});
			}
		}
	}
);

client.on(Events.MessageCreate, async (message) =>
	{
		try {
			try {
				if (message.author.bot) return;
				let serverJSONdata = fs.readJsonSync("./ServerDatas/talkcount.json");
				if (serverJSONdata[message.guildId] == undefined) {
					serverJSONdata[message.guildId] = {};
				}
				if (serverJSONdata[message.guildId][message.author.id] == undefined) {
					serverJSONdata[message.guildId][message.author.id] = 1;
				} else if (!message.content.startsWith("!")) {
					serverJSONdata[message.guildId][message.author.id] += 1;
				}
				fs.writeJsonSync("./ServerDatas/talkcount.json", serverJSONdata, { spaces: 4, replacer: null });
				serverJSONdata = null;
			} catch (e) {
				console.log(e);
			}

			if (message.content.split(" ")[0] == "!tdw") {
				const mediaLink = message.content.split(" ")[1];
				const tweetId = mediaLink.split("/")[mediaLink.split("/").length - 1].split("?")[0];
				if (mediaLink == undefined) {
					await message.reply("使い方: !tdw [ツイートリンク]");
					return;
				}
				const Message = await message.reply("動画のダウンロード中です...");
				const Downloader = new TwitterDownloader();
				await Downloader.download_video(mediaLink, "video", `./temp/${tweetId}`)
					.then(async () => {
						await Message.edit("動画のアップロード中です。");
						const videoFiles = fs.readdirSync(`./temp/${tweetId}`);
						const attachment = [];
						for (const videoFile of videoFiles) {
							attachment.push({ attachment: `./temp/${tweetId}/${videoFile}`, name: videoFile });
						}
						await Message.edit({
							content: "動画のアップロードが完了しました！こちらからダウンロードできます！",
							files: attachment
						});
					})
					.catch(async () => {
						await Message.edit("動画のダウンロードに失敗しました。");
					});
				fs.removeSync(`./temp/${tweetId}`);
				return;
			}

			if (message.content.split(" ")[0] == "!chatbot") {
				const chatbotMessages = [
					"あなたが知らないでほしい、秘密のアプリ",
					"これはチャットボットAIで、何でも尋ねることができます",
					"だから私はそれに私の課題のために地球問題化についての戦後のエッセイを書いてもらいました",
					"またオンラインで月に1万ドルを稼ぐ方法を巡れたところ、ビーヤーなことを検定が終えてくれました",
					"だからチェツとボッツとAにすべての遠大を宮を断媒で決議させましょう",
					"ダウンロードして死してみてください"
				];

				function wait(ms) {
					return new Promise(resolve => setTimeout(resolve, ms));
				}

				for (const chatbotMessage of chatbotMessages) {
					await message.channel.send(chatbotMessage);
					await wait(1000);
				}
			}

			if (message.content.split(" ")[0] == "!ydw") {
				const mediaLink = message.content.split(" ")[1];
				const videoId = mediaLink.split("watch?v=")[1].split("&")[0];
				if (mediaLink == undefined) {
					await message.reply("使い方: !ydw [動画リンク]");
					return;
				}
				const Message = await message.reply("動画のダウンロード中です...");
				const Downloader = new YoutubeDownloader(mediaLink, `./temp/${videoId}`);
				await Downloader.download_video()
					.then(async () => {
						await Message.edit("動画のアップロード中です。");
						await Message.edit({
							content: "動画のアップロードが完了しました！こちらからダウンロードできます！",
							files: [{ attachment: `./temp/${videoId}/output.mp4`, name: "video.mp4" }]
						});
					})
					.catch(async () => {
						await Message.edit("動画のダウンロードに失敗しました。");
					});
				fs.removeSync(`./temp/${videoId}`);
				return;
			}

			if (message.content.split(" ")[0] == "!map") {
				commandLogs(message, "map", 1);
				if (message.content == "!map") {
					await message.reply("使い方: !map [マップリンク] (Mods) (Acc)");
					return;
				}

				const maplink = message.content.split(" ")[1];

				if (maplink == undefined) {
					await message.reply("マップリンクを入力してください。");
					return;
				}

				if (maplink == "") {
					await message.reply("マップリンクの前の空白が1つ多い可能性があります。");
					return;
				}

				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;

				if (!(regex.test(maplink) || regex2.test(maplink) || regex3.test(maplink))) {
					await message.reply(`ビートマップリンクの形式が間違っています。`);
					return;
				}

				let mode;
				let mapInfo;
				let mapUrl;
				if (regex.test(maplink)) {
					switch (maplink.split("/")[4].split("#")[1]) {
						case "osu":
							mode = 0;
							break;

						case "taiko":
							mode = 1;
							break;

						case "fruits":
							mode = 2;
							break;

						case "mania":
							mode = 3;
							break;

						default:
							await message.reply("リンク内のモードが不正です。");
							return;
					}
					mapInfo = await new osuLibrary.GetMapData(maplink, apikey, mode).getData();
					mapUrl = maplink;
				} else {
					mapInfo = await new osuLibrary.GetMapData(maplink, apikey, mode).getDataWithoutMode();
					mode = Number(mapInfo.mode);
					mapUrl = osuLibrary.URLBuilder.beatmapURL(mapInfo.beatmapset_id, mode, mapInfo.beatmap_id);
				}

				let arg2;
				let arg3;
				if (message.content.split(" ")[2] == undefined) {
					arg2 = "nothing";
				} else if (/^[a-zA-Z]+$/.test(message.content.split(" ")[2])) {
					arg2 = "mod";
				} else if (/^[\d.]+$/g.test(message.content.split(" ")[2]) || !isNaN(Number(message.content.split(" ")[2]))) {
					arg2 = "acc";
				} else if (message.content.split(" ")[2] == "") {
					await message.reply("Mods, Acc欄の前に空白が一つ多い可能性があります。");
					return;
				} else {
					await message.reply("Mods, Acc欄には数字かModのみを入力してください。");
					return;
				}

				if (message.content.split(" ")[3] == undefined) {
					arg3 = "nothing";
				} else if (/^[\d.]+$/g.test(message.content.split(" ")[3]) || !isNaN(Number(message.content.split(" ")[3]))) {
					arg3 = "acc";
				} else if (message.content.split(" ")[3] == "") {
					await message.reply("Acc欄の前に空白が一つ多い可能性があります。");
					return;
				} else {
					await message.reply("Acc欄には数字のみを入力してください。");
					return;
				}

				let Mods;
				if (arg2 == "nothing") {
					Mods = new osuLibrary.Mod().get();
				} else if (arg2 == "mod") {
					Mods = new osuLibrary.Mod(message.content.split(" ")[2]).get();
					if (!Mods) {
						await message.reply("入力されたModは存在しないか、指定できないModです。存在するMod、AutoなどのMod以外を指定するようにしてください。");
						return;
					}
				}

				let totalLength = Number(mapInfo.total_length);
				let totalHitLength = Number(mapInfo.hit_length);
				let BPM = Number(mapInfo.bpm);
				if (Mods.array.includes("DT") || Mods.array.includes("NC")) {
					BPM *= 1.5;
					totalLength /= 1.5;
					totalHitLength /= 1.5;
				} else if (Mods.array.includes("HT")) {
					BPM *= 0.75;
					totalLength /= 0.75;
					totalHitLength /= 0.75;
				}

				let Ar = Number(mapInfo.diff_approach);
				let Cs = Number(mapInfo.diff_size);
				let Od = Number(mapInfo.diff_overall);
				let Hp = Number(mapInfo.diff_drain);
				if (Mods.array.includes("HR")) {
					Ar *= 1.4;
					Cs *= 1.3;
					Od *= 1.4;
					Hp *= 1.4;
				} else if (Mods.array.includes("EZ")) {
					Ar *= 0.5;
					Cs *= 0.5;
					Od *= 0.5;
					Hp *= 0.5;
				}

				Od = Math.max(0, Math.min(10, Od));
				Cs = Math.max(0, Math.min(7, Cs));
				Hp = Math.max(0, Math.min(10, Hp));
				Ar = Math.max(0, Math.min(10, Ar));
				Od = Math.round(Od * 10) / 10;
				Cs = Math.round(Cs * 10) / 10;
				Hp = Math.round(Hp * 10) / 10;
				Ar = Math.round(Ar * 10) / 10;

				const mappersData = await new osuLibrary.GetUserData(mapInfo.creator, apikey, mode).getData();
				const calculator = new osuLibrary.CalculatePPSR(mapInfo.beatmap_id, Mods.calc, mode);
				const objectCount = await calculator.calcObject();

				let sr = {};
				for (const acc of [98, 99, 99.5, 100]) {
					calculator.acc = acc;
					sr[acc] = await calculator.calculateSR();
				}

				function formatPPStr(value) {
					switch (value.length) {
						case 3:
							return `   ${value}    `;

						case 4:
							return `   ${value}   `;

						case 5:
							return `   ${value}  `;

						case 6:
							return `  ${value}  `;

						case 7:
							return `  ${value} `;

						case 8:
							return ` ${value} `;

						case 9:
							return ` ${value}`;

						default:
							return `${value}`;
					}
				}

				const mapperUserURL = osuLibrary.URLBuilder.userURL(mappersData?.user_id);
				const mapperIconURL = osuLibrary.URLBuilder.iconURL(mappersData?.user_id);
				const backgroundURL = osuLibrary.URLBuilder.backgroundURL(mapInfo.beatmapset_id);

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`${mapInfo.artist} - ${mapInfo.title}`)
					.setURL(mapUrl)
					.addFields({ name: "Music and Backgroud", value: `:musical_note: [Song Preview](https://b.ppy.sh/preview/${mapInfo.beatmapset_id}.mp3)　:frame_photo: [Full background](https://assets.ppy.sh/beatmaps/${mapInfo.beatmapset_id}/covers/raw.jpg)` })
					.setAuthor({ name: `Created by ${mapInfo.creator}`, iconURL: mapperIconURL, url: mapperUserURL })
					.addFields({ name: `${osuLibrary.Tools.modeEmojiConvert(mode)} [**__${mapInfo.version}__**] **+${Mods.str}**`, value: `Combo: \`${mapInfo.max_combo}x\` Stars: \`${sr[100].sr.toFixed(2)}★\` \n Length: \`${Tools.formatTime(Number(totalLength))} (${Tools.formatTime(Number(totalHitLength))})\` BPM: \`${BPM}\` Objects: \`${objectCount}\` \n CS: \`${Cs}\` AR: \`${Ar}\` OD: \`${Od}\` HP: \`${Hp}\` Spinners: \`${mapInfo.count_spinner}\``, inline: true })
					.addFields({ name: "**Download**", value: `[Official](https://osu.ppy.sh/beatmapsets/${mapInfo.beatmapset_id}/download)\n[Nerinyan(no video)](https://api.nerinyan.moe/d/${mapInfo.beatmapset_id}?nv=1)\n[Beatconnect](https://beatconnect.io/b/${mapInfo.beatmapset_id})\n[chimu.moe](https://api.chimu.moe/v1/download/${mapInfo.beatmapset_id}?n=1)`, inline: true })
					.addFields({ name: `:heart: ${Number(mapInfo.favourite_count).toLocaleString()}　:play_pause: ${Number(mapInfo.playcount).toLocaleString()}`, value: `\`\`\` Acc |    98%   |    99%   |   99.5%  |   100%   | \n ----+----------+----------+----------+----------+  \n  PP |${formatPPStr(sr[98].pp.toFixed(2))}|${formatPPStr(sr[99].pp.toFixed(2))}|${formatPPStr(sr[99.5].pp.toFixed(2))}|${formatPPStr(sr[100].pp.toFixed(2))}|\`\`\``, inline: false })
					.setImage(backgroundURL)
					.setFooter({ text: `${osuLibrary.Tools.mapstatus(mapInfo.approved)} mapset of ${mapInfo.creator}` });
				await message.channel.send({ embeds: [embed] });

				if (arg2 == "acc") {
					calculator.acc = Number(message.content.split(" ")[2]);
					const accpp = await calculator.calculateSR();
					await message.reply(`**${Mods.str}**で**${message.content.split(" ")[2]}%**を取った時のPPは__**${accpp.pp.toFixed(2)}pp**__です。`);
				} else if (arg3 == "acc") {
					calculator.acc = Number(message.content.split(" ")[3]);
					const accpp = await calculator.calculateSR();
					await message.reply(`**${Mods.str}**で**${message.content.split(" ")[3]}%**を取った時のPPは__**${accpp.pp.toFixed(2)}pp**__です。`);
				}
				return;
			}

			if (message.content.split(" ")[0].startsWith("!r")) {
				commandLogs(message, "recent", 1);
				let playername;
				if (message.content.split(" ")[1] == undefined) {
					let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
					const username = allUser["Bancho"][message.author.id]?.name;
					if (username == undefined) {
						await message.reply("ユーザー名が登録されていません。/osureg、!osuregで登録するか、ユーザー名を入力してください。");
						allUser = null;
						return;
					}
					allUser = null;
					playername = username;
				} else {
					playername = message.content.split(" ")?.slice(1)?.join(" ");
					if (/^<@\d+>$/.test(playername)) {
						let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
						const userId = RegExp(/^<@(\d+)>$/).exec(playername)[1];
						if (!allUser["Bancho"][userId]?.name) {
							await message.reply("このDiscordのユーザーは登録されていません。/osureg、!osuregで登録してもらうか、osuのユーザー名を入力してください。");
							allUser = null;
							return;
						}
						playername = allUser["Bancho"][userId].name;
						allUser = null;
					}
				}

				if (playername == "") {
					await message.reply("ユーザー名の前の空白が1つ多い可能性があります。");
					return;
				}

				let currentMode;
				switch (message.content.split(" ")[0]) {
					case "!r":
					case "!ro":
						currentMode = 0;
						break;

					case "!rt":
						currentMode = 1;
						break;

					case "!rc":
						currentMode = 2;
						break;

					case "!rm":
						currentMode = 3;
						break;

					default:
						await message.reply("使い方: !r(o, t, c, m) (osu!ユーザーネーム)");
						return;
				}

				const userRecentData = await new osuLibrary.GetUserRecent(playername, apikey, currentMode).getData();
				if (userRecentData == undefined) {
					await message.reply(`${playername}さんには24時間以内にプレイした譜面がないようです。`);
					return;
				}

				const mapData = await new osuLibrary.GetMapData(userRecentData.beatmap_id, apikey, currentMode).getData()
				const playersdata = await new osuLibrary.GetUserData(playername, apikey, currentMode).getData();
				const mappersdata = await new osuLibrary.GetUserData(mapData.creator, apikey, currentMode).getData();
				const mods = new osuLibrary.Mod(userRecentData.enabled_mods).get();
				const recentAcc = Math.round(tools.accuracy({
					300: userRecentData.count300,
					100: userRecentData.count100,
					50: userRecentData.count50,
					0: userRecentData.countmiss,
					geki: userRecentData.countgeki,
					katu: userRecentData.countkatu
				}, Tools.modeConvertAcc(currentMode)) * 100) / 100;
				const recentPpData = new osuLibrary.CalculatePPSR(userRecentData.beatmap_id, mods.calc, currentMode);
				await recentPpData.getMapData();
				const passedObjects = Tools.calcPassedObject(userRecentData, currentMode);
				const recentScore = {
					n300: Number(userRecentData.count300),
					n100: Number(userRecentData.count100),
					n50: Number(userRecentData.count50),
					misses: Number(userRecentData.countmiss),
					nGeki: Number(userRecentData.countgeki),
					nKatu: Number(userRecentData.countkatu),
					combo: Number(userRecentData.maxcombo),
					mods: mods.calc
				};
				const ssPp = await recentPpData.calculateSR();
				let recentPp = await recentPpData.calculateScorePP(recentScore, passedObjects);
				recentPp = Math.round(recentPp * 100) / 100;
				const beatmap = await recentPpData.getMap();
				const map = new rosu.Beatmap(new Uint8Array(Buffer.from(beatmap)));
				const objectCount = await recentPpData.calcObject();
				const { ifFCPP, ifFCHits, ifFCAcc } = osuLibrary.CalculateIfFC.calculate(recentScore, currentMode, passedObjects, mods.calc, map);
				let totalLength = Number(mapData.total_length);
				let hitLength = Number(mapData.hit_length);
				let BPM = Number(mapData.bpm);

				if (mods.array.includes("DT") || mods.array.includes("NC")) {
					BPM *= 1.5;
					totalLength /= 1.5;
					hitLength /= 1.5;
				} else if (mods.array.includes("HT")) {
					BPM *= 0.75;
					totalLength /= 0.75;
					hitLength /= 0.75;
				}

				let Ar = Number(mapData.diff_approach);
				let Od = Number(mapData.diff_overall);
				let Cs = Number(mapData.diff_size);
				let Hp = Number(mapData.diff_drain);

				if (mods.array.includes("HR")) {
					Od *= 1.4;
					Cs *= 1.3;
					Hp *= 1.4;
					Ar *= 1.4;
				} else if (mods.array.includes("EZ")) {
					Od *= 0.5;
					Cs *= 0.5;
					Hp *= 0.5;
					Ar *= 0.5;
				}

				Od = Math.max(0, Math.min(10, Od));
				Cs = Math.max(0, Math.min(7, Cs));
				Hp = Math.max(0, Math.min(10, Hp));
				Ar = Math.max(0, Math.min(10, Ar));
				Od = Math.round(Od * 10) / 10;
				Cs = Math.round(Cs * 10) / 10;
				Hp = Math.round(Hp * 10) / 10;
				Ar = Math.round(Ar * 10) / 10;
				const formattedLength = Tools.formatTime(totalLength);
				const formattedHitLength = Tools.formatTime(hitLength);
				const formattedHits = Tools.formatHits(recentScore, currentMode);
				const formattedIfFCHits = Tools.formatHits(ifFCHits, currentMode);

				const mapRankingData = await Tools.getAPIResponse(`https://osu.ppy.sh/api/get_scores?k=${apikey}&b=${mapData.beatmap_id}&m=${currentMode}&limit=50`);

				let mapScores = [];
				for (const element of mapRankingData) {
					mapScores.push(Number(element.score));
				}
				let mapRanking = mapScores.length + 1;

				if (Number(userRecentData.score) >= mapScores[mapScores.length - 1]) {
					mapScores.sort((a, b) => a - b);
					const score = Number(userRecentData.score);
					for (const element of mapScores) {
						if (score >= element) {
							mapRanking--;
						} else {
							break;
						}
					}
				}

				const userplays = await Tools.getAPIResponse(
					`https://osu.ppy.sh/api/get_user_best?k=${apikey}&type=string&m=${currentMode}&u=${playername}&limit=100`
				);
				let BPranking = 1;
				let foundFlag = false;
				for (const element of userplays) {
					if (element.beatmap_id == userRecentData.beatmap_id && element.score == userRecentData.score) {
						foundFlag = true;
						break;
					}
					BPranking++;
				}

				if (!foundFlag) {
					userplays.reverse();
					BPranking = userplays.length + 1;
					for (const element of userplays) {
						if (recentPp > Number(element.pp)) {
							BPranking--;
						} else {
							break;
						}
					}
				}

				let rankingString = "";
				const mapStatus = osuLibrary.Tools.mapstatus(mapData.approved);
				if (mapRanking <= 50 && BPranking <= 50 && userRecentData.rank != "F" && (mapStatus == "Ranked" || mapStatus == "Qualified" || mapStatus == "Loved" || mapStatus == "Approved")) {
					if (mapStatus == "Ranked" || mapStatus == "Approved") {
						rankingString = `**__Personal Best #${BPranking} and Global Top #${mapRanking}__**`;
					} else {
						rankingString = `**__Personal Best #${BPranking} (No Rank) and Global Top #${mapRanking}__**`;
					}
				} else if (mapRanking == 51 && BPranking <= 50 && userRecentData.rank != "F") {
					if (mapStatus == "Ranked" || mapStatus == "Approved") {
						rankingString = `**__Personal Best #${BPranking}__**`;
					} else {
						rankingString = `**__Personal Best #${BPranking} (No Rank)__**`;
					}
				} else if (mapRanking <= 50 && BPranking > 50 && userRecentData.rank != "F" && (mapStatus == "Ranked" || mapStatus == "Qualified" || mapStatus == "Loved" || mapStatus == "Approved")) {
					rankingString = `**__Global Top #${mapRanking}__**`;
				} else {
					rankingString = "`Result`";
				}

				const maplink = osuLibrary.URLBuilder.beatmapURL(mapData.beatmapset_id, currentMode, mapData.beatmap_id);
				const playerIconUrl = osuLibrary.URLBuilder.iconURL(playersdata?.user_id);
				const playerUrl = osuLibrary.URLBuilder.userURL(playersdata?.user_id);
				const mapperIconUrl = osuLibrary.URLBuilder.iconURL(mappersdata?.user_id);
				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`${mapData.artist} - ${mapData.title} [${mapData.version}]`)
					.setURL(maplink)
					.setAuthor({ name: `${playersdata.username}: ${Number(playersdata.pp_raw).toLocaleString()}pp (#${Number(playersdata.pp_rank).toLocaleString()} ${playersdata.country}${Number(playersdata.pp_country_rank).toLocaleString()})`, iconURL: playerIconUrl, url: playerUrl })
					.addFields({ name: "`Grade`", value: `${Tools.rankconverter(userRecentData.rank)} + ${mods.str}`, inline: true })
					.addFields({ name: "`Score`", value: `${Number(userRecentData.score).toLocaleString()}`, inline: true })
					.addFields({ name: "`Acc`", value: `${recentAcc}%`, inline: true })
					.addFields({ name: "`PP`", value: `**${recentPp}** / ${ssPp.pp.toFixed(2)}PP`, inline: true })
					.addFields({ name: "`Combo`", value: `**${userRecentData.maxcombo}**x / ${mapData.max_combo}x`,inline: true })
					.addFields({ name: "`Hits`", value: formattedHits, inline: true });

				if (currentMode == 3 || userRecentData.maxcombo == mapData.max_combo) {
					embed
						.addFields({ name: "`Map Info`", value: `Length:\`${formattedLength} (${formattedHitLength})\` BPM:\`${BPM}\` Objects:\`${objectCount}\` \n  CS:\`${Cs}\` AR:\`${Ar}\` OD:\`${Od}\` HP:\`${Hp}\` Stars:\`${ssPp.sr.toFixed(2)}\``, inline: true })
						.setImage(osuLibrary.URLBuilder.backgroundURL(mapData.beatmapset_id))
						.setTimestamp()
						.setFooter({ text: `${mapStatus} mapset of ${mapData.creator}`, iconURL: mapperIconUrl });
				} else {
					embed
						.addFields({ name: "`If FC`", value: `**${ifFCPP.toFixed(2)}** / ${ssPp.pp.toFixed(2)}PP`, inline: true })
						.addFields({ name: "`Acc`", value: `${ifFCAcc}%`, inline: true })
						.addFields({ name: "`Hits`", value: formattedIfFCHits, inline: true })
						.addFields({ name: "`Map Info`", value: `Length:\`${formattedLength} (${formattedHitLength})\` BPM:\`${BPM}\` Objects:\`${objectCount}\` \n  CS:\`${Cs}\` AR:\`${Ar}\` OD:\`${Od}\` HP:\`${Hp}\` Stars:\`${ssPp.sr.toFixed(2)}\``, inline: true })
						.setImage(osuLibrary.URLBuilder.backgroundURL(mapData.beatmapset_id))
						.setTimestamp()
						.setFooter({ text: `${mapStatus} mapset of ${mapData.creator}`, iconURL: mapperIconUrl });
				}

				let ifFCMessage = `(**${ifFCPP.toFixed(2)}**pp for ${ifFCAcc}% FC)`;
				if (currentMode == 3) ifFCMessage = "";
				if (userRecentData.maxcombo == mapData.max_combo) ifFCMessage = "**Full Combo!! Congrats!!**";
				if (recentPp.toString().replace(".", "").includes("727")) ifFCMessage = "**WYSI!! WYFSI!!!!!**";

				await message.channel.send({ embeds: [embed] }).then((sentMessage) => {
					setTimeout(async () => {
						const embednew = new EmbedBuilder()
							.setColor("Blue")
							.setTitle(`${mapData.artist} - ${mapData.title} [${mapData.version}] [${ssPp.sr.toFixed(2)}★]`)
							.setThumbnail(osuLibrary.URLBuilder.thumbnailURL(mapData.beatmapset_id))
							.setURL(maplink)
							.setAuthor({ name: `${playersdata.username}: ${Number(playersdata.pp_raw).toLocaleString()}pp (#${Number(playersdata.pp_rank).toLocaleString()} ${playersdata.country}${Number(playersdata.pp_country_rank).toLocaleString()})`, iconURL: playerIconUrl, url: playerUrl })
							.addFields({ name: rankingString, value: `${Tools.rankconverter(userRecentData.rank)} + **${mods.str}**　**Score**: ${Number(userRecentData.score).toLocaleString()}　**Acc**: ${recentAcc}% \n **PP**: **${recentPp}** / ${ssPp.pp.toFixed(2)}pp　${ifFCMessage} \n **Combo**: **${userRecentData.maxcombo}**x / ${mapData.max_combo}x　**Hits**: ${formattedHits}`, inline: true });
						await sentMessage.edit({ embeds: [embednew] });
					}, 20000);
				});
				return;
			}

			if (message.content.split(" ")[0].startsWith("m!r")) {
				commandLogs(message, "recent mamestagram", 1);
				let playerid;
				if (message.content.split(" ")[1] == undefined) {
					let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
					const userId = allUser["Mamestagram"][message.author.id]?.id;
					if (userId == undefined) {
						await message.reply("ユーザーIDが登録されていません。m!osuregで登録するか、Memestagram IDを入力してください。");
						allUser = null;
						return;
					}
					allUser = null;
					playerid = userId;
				} else {
					playerid = message.content.split(" ")?.slice(1)?.join(" ");
					if (/^<@\d+>$/.test(playerid)) {
						let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
						const userId = RegExp(/^<@(\d+)>$/).exec(playerid)[1];
						if (!allUser["Mamestagram"][userId]?.id) {
							await message.reply("このDiscordのユーザーは登録されていません。m!osuregで登録してもらうか、Memestagram IDを入力してください。");
							allUser = null;
							return;
						}
						playerid = allUser["Mamestagram"][userId].id;
						allUser = null;
					}
				}

				if (playerid == "") {
					await message.reply("ユーザーIDの前の空白が1つ多い可能性があります。");
					return;
				}

				let currentMode;
				switch (message.content.split(" ")[0]) {
					case "m!r":
					case "m!ro":
						currentMode = 0;
						break;

					case "m!rt":
						currentMode = 1;
						break;

					case "m!rc":
						currentMode = 2;
						break;

					case "m!rm":
						currentMode = 3;
						break;

					default:
						await message.reply("使い方: m!r(o, t, c, m) (Mamestagram ID)");
						return;
				}

				const userRecentData = await Tools.getAPIResponse(
					MAMESTAGRAMAPI_BASEURL + `get_player_scores?id=${playerid}&scope=recent&mode=${currentMode}`
				).then((data) => data.scores[0]);

				if (userRecentData == undefined) {
					await message.reply(`ID: ${playerid}に該当するユーザーには24時間以内にプレイした譜面がないようです。`);
					return;
				}

				const mapData = await new osuLibrary.GetMapData(userRecentData.beatmap.id, apikey, currentMode).getData()
				const playersdata = await Tools.getAPIResponse(
					MAMESTAGRAMAPI_BASEURL + `get_player_info?id=${playerid}&scope=all`
				).then((data) => data.player);
				const mappersdata = await new osuLibrary.GetUserData(mapData.creator, apikey, currentMode).getData();
				const mods = new osuLibrary.Mod(userRecentData.mods).get();
				const recentAcc = Math.round(tools.accuracy({
					300: userRecentData.n300,
					100: userRecentData.n100,
					50: userRecentData.n50,
					0: userRecentData.nmiss,
					geki: userRecentData.ngeki,
					katu: userRecentData.nkatu
				}, Tools.modeConvertAcc(currentMode)) * 100) / 100;
				const recentPpData = new osuLibrary.CalculatePPSR(userRecentData.beatmap.id, mods.calc, currentMode);
				await recentPpData.getMapData();
				const passedObjects = Tools.calcPassedObjectMamesta(userRecentData, currentMode);
				const recentScore = {
					n300: Number(userRecentData.n300),
					n100: Number(userRecentData.n100),
					n50: Number(userRecentData.n50),
					misses: Number(userRecentData.nmiss),
					nGeki: Number(userRecentData.ngeki),
					nKatu: Number(userRecentData.nkatu),
					combo: Number(userRecentData.max_combo),
					mods: mods.calc
				};
				const ssPp = await recentPpData.calculateSR();
				let recentPp = await recentPpData.calculateScorePP(recentScore, passedObjects);
				recentPp = Math.round(recentPp * 100) / 100;
				const beatmap = await recentPpData.getMap();
				const map = new rosu.Beatmap(new Uint8Array(Buffer.from(beatmap)));
				const objectCount = await recentPpData.calcObject();
				const { ifFCPP, ifFCHits, ifFCAcc } = osuLibrary.CalculateIfFC.calculate(recentScore, currentMode, passedObjects, mods.calc, map);
				let totalLength = Number(mapData.total_length);
				let hitLength = Number(mapData.hit_length);
				let BPM = Number(mapData.bpm);

				if (mods.array.includes("DT") || mods.array.includes("NC")) {
					BPM *= 1.5;
					totalLength /= 1.5;
					hitLength /= 1.5;
				} else if (mods.array.includes("HT")) {
					BPM *= 0.75;
					totalLength /= 0.75;
					hitLength /= 0.75;
				}

				let Ar = Number(mapData.diff_approach);
				let Od = Number(mapData.diff_overall);
				let Cs = Number(mapData.diff_size);
				let Hp = Number(mapData.diff_drain);

				if (mods.array.includes("HR")) {
					Od *= 1.4;
					Cs *= 1.3;
					Hp *= 1.4;
					Ar *= 1.4;
				} else if (mods.array.includes("EZ")) {
					Od *= 0.5;
					Cs *= 0.5;
					Hp *= 0.5;
					Ar *= 0.5;
				}

				Od = Math.max(0, Math.min(10, Od));
				Cs = Math.max(0, Math.min(7, Cs));
				Hp = Math.max(0, Math.min(10, Hp));
				Ar = Math.max(0, Math.min(10, Ar));
				Od = Math.round(Od * 10) / 10;
				Cs = Math.round(Cs * 10) / 10;
				Hp = Math.round(Hp * 10) / 10;
				Ar = Math.round(Ar * 10) / 10;
				const formattedLength = Tools.formatTime(totalLength);
				const formattedHitLength = Tools.formatTime(hitLength);
				const formattedHits = Tools.formatHits(recentScore, currentMode);
				const formattedIfFCHits = Tools.formatHits(ifFCHits, currentMode);

				const mapRankingData = await Tools.getAPIResponse(
					MAMESTAGRAMAPI_BASEURL + `get_map_scores?id=${userRecentData.beatmap.id}&mode=${currentMode}&limit=50&scope=best`
				).then((data) => data.scores);

				let mapScores = [];
				for (const element of mapRankingData) {
					mapScores.push(Number(element.score));
				}
				let mapRanking = mapScores.length + 1;

				if (Number(userRecentData.score) >= mapScores[mapScores.length - 1]) {
					mapScores.sort((a, b) => a - b);
					const score = Number(userRecentData.score);
					for (const element of mapScores) {
						if (score >= element) {
							mapRanking--;
						} else {
							break;
						}
					}
				}

				const userplays = await Tools.getAPIResponse(
					MAMESTAGRAMAPI_BASEURL + `get_player_scores?scope=best&mode=${currentMode}&id=${playerid}&limit=50`
				).then((data) => data.scores);

				let BPranking = 1;
				let foundFlag = false;
				for (const element of userplays) {
					if (element.beatmap_id == userRecentData.beatmap_id && element.score == userRecentData.score) {
						foundFlag = true;
						break;
					}
					BPranking++;
				}

				if (!foundFlag) {
					userplays.reverse();
					BPranking = userplays.length + 1;
					for (const element of userplays) {
						if (recentPp > Number(element.pp)) {
							BPranking--;
						} else {
							break;
						}
					}
				}

				let rankingString = "";
				const mapStatus = osuLibrary.Tools.mapstatus(mapData.approved);
				if (mapRanking <= 50 && BPranking <= 50 && userRecentData.grade != "F") {
					rankingString = `**__Personal Best #${BPranking} and Global Top #${mapRanking}__**`;
				} else if (mapRanking == 51 && BPranking <= 50 && userRecentData.grade != "F") {
					rankingString = `**__Personal Best #${BPranking}__**`;
				} else if (mapRanking <= 50 && BPranking > 50 && userRecentData.grade != "F") {
					rankingString = `**__Global Top #${mapRanking}__**`;
				} else {
					rankingString = "`Result`";
				}

				const maplink = osuLibrary.URLBuilder.beatmapURL(mapData.beatmapset_id, currentMode, mapData.beatmap_id);
				const playerIconUrl = osuLibrary.URLBuilder.mamestagramIconURL(playersdata?.info.id);
				const playerUrl = osuLibrary.URLBuilder.mamestagramUserURL(playersdata?.info.id);
				const mapperIconUrl = osuLibrary.URLBuilder.iconURL(mappersdata?.user_id);
				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`${mapData.artist} - ${mapData.title} [${mapData.version}]`)
					.setURL(maplink)
					.setAuthor({ name: `${playersdata.info.name}: ${Number(playersdata.stats[currentMode].pp).toLocaleString()}pp (#${Number(playersdata.stats[currentMode].rank).toLocaleString()} ${playersdata.info.country.toUpperCase()}${Number(playersdata.stats[currentMode].country_rank).toLocaleString()})`, iconURL: playerIconUrl, url: playerUrl })
					.addFields({ name: "`Grade`", value: `${Tools.rankconverter(userRecentData.grade)} + ${mods.str}`, inline: true })
					.addFields({ name: "`Score`", value: `${Number(userRecentData.score).toLocaleString()}`, inline: true })
					.addFields({ name: "`Acc`", value: `${recentAcc}%`, inline: true })
					.addFields({ name: "`PP`", value: `**${recentPp}** / ${ssPp.pp.toFixed(2)}PP`, inline: true })
					.addFields({ name: "`Combo`", value: `**${userRecentData.max_combo}**x / ${mapData.max_combo}x`,inline: true })
					.addFields({ name: "`Hits`", value: formattedHits, inline: true });

				if (currentMode == 3 || userRecentData.max_combo == mapData.max_combo) {
					embed
						.addFields({ name: "`Map Info`", value: `Length:\`${formattedLength} (${formattedHitLength})\` BPM:\`${BPM}\` Objects:\`${objectCount}\` \n  CS:\`${Cs}\` AR:\`${Ar}\` OD:\`${Od}\` HP:\`${Hp}\` Stars:\`${ssPp.sr.toFixed(2)}\``, inline: true })
						.setImage(osuLibrary.URLBuilder.backgroundURL(mapData.beatmapset_id))
						.setTimestamp()
						.setFooter({ text: `${mapStatus} mapset of ${mapData.creator} (Bancho)`, iconURL: mapperIconUrl });
				} else {
					embed
						.addFields({ name: "`If FC`", value: `**${ifFCPP.toFixed(2)}** / ${ssPp.pp.toFixed(2)}PP`, inline: true })
						.addFields({ name: "`Acc`", value: `${ifFCAcc}%`, inline: true })
						.addFields({ name: "`Hits`", value: formattedIfFCHits, inline: true })
						.addFields({ name: "`Map Info`", value: `Length:\`${formattedLength} (${formattedHitLength})\` BPM:\`${BPM}\` Objects:\`${objectCount}\` \n  CS:\`${Cs}\` AR:\`${Ar}\` OD:\`${Od}\` HP:\`${Hp}\` Stars:\`${ssPp.sr.toFixed(2)}\``, inline: true })
						.setImage(osuLibrary.URLBuilder.backgroundURL(mapData.beatmapset_id))
						.setTimestamp()
						.setFooter({ text: `${mapStatus} mapset of ${mapData.creator}`, iconURL: mapperIconUrl });
				}

				let ifFCMessage = `(**${ifFCPP.toFixed(2)}**pp for ${ifFCAcc}% FC)`;
				if (currentMode == 3) ifFCMessage = "";
				if (userRecentData.max_combo == mapData.max_combo) ifFCMessage = "**Full Combo!! Congrats!!**";
				if (recentPp.toString().replace(".", "").includes("727")) ifFCMessage = "**WYSI!! WYFSI!!!!!**";

				await message.channel.send({ embeds: [embed] }).then((sentMessage) => {
					setTimeout(async () => {
						const embednew = new EmbedBuilder()
							.setColor("Blue")
							.setTitle(`${mapData.artist} - ${mapData.title} [${mapData.version}] [${ssPp.sr.toFixed(2)}★]`)
							.setThumbnail(osuLibrary.URLBuilder.thumbnailURL(mapData.beatmapset_id))
							.setURL(maplink)
							.setAuthor({ name: `${playersdata.info.name}: ${Number(playersdata.stats[currentMode].pp).toLocaleString()}pp (#${Number(playersdata.stats[currentMode].rank).toLocaleString()} ${playersdata.info.country.toUpperCase()}${Number(playersdata.stats[currentMode].country_rank).toLocaleString()})`, iconURL: playerIconUrl, url: playerUrl })
							.addFields({ name: rankingString, value: `${Tools.rankconverter(userRecentData.grade)} + **${mods.str}**　**Score**: ${Number(userRecentData.score).toLocaleString()}　**Acc**: ${recentAcc}% \n **PP**: **${recentPp}** / ${ssPp.pp.toFixed(2)}pp　${ifFCMessage} \n **Combo**: **${userRecentData.max_combo}**x / ${mapData.max_combo}x　**Hits**: ${formattedHits}`, inline: true });
						await sentMessage.edit({ embeds: [embednew] });
					}, 20000);
				});
				return;
			}

			if (/^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/.test(message.content) || /^https:\/\/osu\.ppy\.sh\/b\/\d+$/.test(message.content) || /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/.test(message.content)) {
				const channelid = message.channel.id;
				let allchannels = fs.readJsonSync("./ServerDatas/BeatmapLinkChannels.json");
				if (!allchannels.Channels.includes(channelid)) return;
				allchannels = null;
				commandLogs(message, "マップリンク", 1);
				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				if (!(regex.test(message.content) || regex2.test(message.content) || regex3.test(message.content))) {
					await message.reply(`ビートマップリンクの形式が間違っています。`);
					return;
				}

				let mode;
				let mapData;
				let mapUrl;
				if (regex.test(message.content)) {
					switch (message.content.split("#")[1].split("/")[0]) {
						case "osu":
							mode = 0;
							break;

						case "taiko":
							mode = 1;
							break;

						case "fruits":
							mode = 2;
							break;

						case "mania":
							mode = 3;
							break;

						default:
							return;
					}
					mapData = await new osuLibrary.GetMapData(message.content, apikey, mode).getData();
					mapUrl = message.content;
				} else {
					mapData = await new osuLibrary.GetMapData(message.content, apikey).getDataWithoutMode();
					mode = Number(mapData.mode);
					mapUrl = osuLibrary.URLBuilder.beatmapURL(mapData.beatmapset_id, mode, mapData.beatmap_id);
				}

				const mapperData = await new osuLibrary.GetUserData(mapData.creator, apikey, mode).getData();
				const mapperIconURL = osuLibrary.URLBuilder.iconURL(mapperData?.user_id);

				const calculator = new osuLibrary.CalculatePPSR(mapData.beatmap_id, 0, mode);
				let sr = {};
				for (const element of [95, 99, 100]) {
					calculator.acc = element;
					sr[element] = await calculator.calculateSR();
				}

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setAuthor({ name: `${mapData.artist} - ${mapData.title} by ${mapData.creator}`, iconURL: mapperIconURL, url: mapUrl })
					.setDescription(`**Length**: ${Tools.formatTime(Number(mapData.total_length))} (${Tools.formatTime(Number(mapData.hit_length))}) **BPM**: ${mapData.bpm} **Mods**: -\n**Download**: [Map](https://osu.ppy.sh/beatmapsets/${mapData.beatmapset_id}) | [Nerinyan](https://api.nerinyan.moe/d/${mapData.beatmapset_id}) | [Nerinyan (No Vid)](https://api.nerinyan.moe/d/${mapData.beatmapset_id}?nv=1) | [Beatconnect](https://beatconnect.io/b/${mapData.beatmapset_id})`)
					.addFields({ name: `${osuLibrary.Tools.modeEmojiConvert(mode)} [**__${mapData.version}__**]`, value: `▸**Difficulty:** ${sr[100].sr.toFixed(2)}★ ▸**Max Combo:** ${mapData.max_combo}x\n▸**OD:** ${mapData.diff_overall} ▸**CS:** ${mapData.diff_size} ▸**AR:** ${mapData.diff_approach} ▸**HP:** ${mapData.diff_drain}\n▸**PP**: ○ **95**%-${sr[95].pp.toFixed(2)} ○ **99**%-${sr[99].pp.toFixed(2)} ○ **100**%-${sr[100].pp.toFixed(2)}`, inline: false })
					.setTimestamp()
					.setImage(osuLibrary.URLBuilder.backgroundURL(mapData.beatmapset_id))
					.setFooter({ text: `${osuLibrary.Tools.mapstatus(mapData.approved)} mapset of ${mapData.creator}` });
				await message.channel.send({ embeds: [embed] });
				return;
			}

			if (/^https:\/\/booth\.pm\/ja\/items\/\d+$/.test(message.content)) {
				const ItemData = await Tools.getBoothItemInfo(message.content)
					.catch(() => null);

				if (ItemData == null) {
					await message.reply("商品情報が取得できませんでした。");
					return;
				}

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(ItemData.title)
					.setURL(message.content)
					.setAuthor({ name: ItemData.author, iconURL: ItemData.authorIcon, url: ItemData.authorUrl })
					.addFields({ name: "価格", value: `${ItemData.priceString}`, inline: true })
					.addFields({ name: "購入ページ", value: `[Booth](${message.content})`, inline: true })
					.setImage(ItemData.imageUrl)
					.setFooter({ text: `Booth item by ${ItemData.author}` });

				await message.channel.send({ embeds: [embed] });
				return;
			}

			if (message.content.split(" ")[0] == "!m") {
				commandLogs(message, "mods", 1);
				if (message.content == "!m") {
					await message.reply("使い方: !m [Mods]");
					return;
				}

				const messageData = await message.channel.messages.fetch();
				const messages = Array.from(messageData.values());
				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				let maplinks = messages.map(message => {
					if (regex.test(message.content) || regex2.test(message.content) || regex3.test(message.content)) return message.content;
					if (regex.test(message.embeds[0]?.data?.url) || regex2.test(message.embeds[0]?.data?.url) || regex3.test(message.embeds[0]?.data?.url)) return message.embeds[0].data.url;
					if (regex.test(message.embeds[0]?.author?.url) || regex2.test(message.embeds[0]?.author?.url) || regex3.test(message.embeds[0]?.author?.url)) return message.embeds[0].data.author.url;
				});
				maplinks = maplinks.filter(link => link != undefined);
				if (maplinks[0] == undefined) {
					await message.reply("直近50件のメッセージからマップリンクが見つかりませんでした。");
					return;
				}
				let recentmaplink = maplinks[0];

				if (message.content.split(" ")[1] == undefined) {
					await message.reply("Modsを入力してください。");
					return;
				}

				if (message.content.split(" ")[1] == "") {
					await message.reply("Modsの前の空白が1つ多い可能性があります。");
					return;
				}

				const Mods = new osuLibrary.Mod(message.content.split(" ")[1]).get();

				if (!Mods) {
					await message.reply("Modが存在しないか、指定できないModです。");
					return;
				}

				let mode;
				let mapData;
				let mapUrl;
				if (regex.test(recentmaplink)) {
					switch (recentmaplink.split("#")[1].split("/")[0]) {
						case "osu":
							mode = 0;
							break;

						case "taiko":
							mode = 1;
							break;

						case "fruits":
							mode = 2;
							break;

						case "mania":
							mode = 3;
							break;

						default:
							await message.reply("リンク内のモードが不正です。");
							return;
					}
					mapData = await new osuLibrary.GetMapData(recentmaplink, apikey, mode).getData();
					mapUrl = recentmaplink;
				} else {
					mapData = await new osuLibrary.GetMapData(recentmaplink, apikey).getDataWithoutMode();
					mode = Number(mapData.mode);
					mapUrl = osuLibrary.URLBuilder.beatmapURL(mapData.beatmapset_id, mode, mapData.beatmap_id);
				}

				const mapperData = await new osuLibrary.GetUserData(mapData.creator, apikey, mode).getData();
				const mapperIconURL = osuLibrary.URLBuilder.iconURL(mapperData?.user_id);

				const calculator = new osuLibrary.CalculatePPSR(mapData.beatmap_id, Mods.calc, mode);
				let sr = {};
				for (const element of [95, 99, 100]) {
					calculator.acc = element;
					sr[element] = await calculator.calculateSR();
				}

				let totalLength = Number(mapData.total_length);
				let totalHitLength = Number(mapData.hit_length);
				let BPM = Number(mapData.bpm);
				if (Mods.array.includes("NC") || Mods.array.includes("DT")) {
					BPM *= 1.5;
					totalLength /= 1.5;
					totalHitLength /= 1.5;
				} else if (Mods.array.includes("HT")) {
					BPM *= 0.75;
					totalLength /= 0.75;
					totalHitLength /= 0.75;
				}

				let Ar = Number(mapData.diff_approach);
				let Od = Number(mapData.diff_overall);
				let Cs = Number(mapData.diff_size);
				let Hp = Number(mapData.diff_drain);

				if (Mods.array.includes("HR")) {
					Od *= 1.4;
					Ar *= 1.4;
					Cs *= 1.3;
					Hp *= 1.4;
				} else if (Mods.array.includes("EZ")) {
					Od *= 0.5;
					Ar *= 0.5;
					Cs *= 0.5;
					Hp *= 0.5;
				}
				Od = Math.max(0, Math.min(10, Od));
				Cs = Math.max(0, Math.min(7, Cs));
				Hp = Math.max(0, Math.min(10, Hp));
				Ar = Math.max(0, Math.min(10, Ar));
				Od = Math.round(Od * 10) / 10;
				Cs = Math.round(Cs * 10) / 10;
				Hp = Math.round(Hp * 10) / 10;
				Ar = Math.round(Ar * 10) / 10;

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setAuthor({ name: `${mapData.artist} - ${mapData.title} by ${mapData.creator}`, iconURL: mapperIconURL, url: mapUrl })
					.setDescription(`**Length**: ${Tools.formatTime(totalLength)} (${Tools.formatTime(totalHitLength)}) **BPM**: ${BPM} **Mods**: ${Mods.str}\n**Download**: [Map](https://osu.ppy.sh/beatmapsets/${mapData.beatmapset_id}) | [Nerinyan](https://api.nerinyan.moe/d/${mapData.beatmapset_id}) | [Nerinyan (No Vid)](https://api.nerinyan.moe/d/${mapData.beatmapset_id}?nv=1) | [Beatconnect](https://beatconnect.io/b/${mapData.beatmapset_id})`)
					.addFields({ name: `${osuLibrary.Tools.modeEmojiConvert(mode)} [**__${mapData.version}__**]`, value: `▸**Difficulty:** ${sr[100].sr.toFixed(2)}★ ▸**Max Combo:** ${mapData.max_combo}x\n▸**OD:** ${Od} ▸**CS:** ${Cs} ▸**AR:** ${Ar} ▸**HP:** ${Hp}\n▸**PP**: ○ **95**%-${sr[95].pp.toFixed(2)} ○ **99**%-${sr[99].pp.toFixed(2)} ○ **100**%-${sr[100].pp.toFixed(2)}`, inline: false })
					.setTimestamp()
					.setImage(osuLibrary.URLBuilder.backgroundURL(mapData.beatmapset_id))
					.setFooter({ text: `${osuLibrary.Tools.mapstatus(mapData.approved)} mapset of ${mapData.creator}` });
				await message.channel.send({ embeds: [embed] });
				return;
			}

			if (message.content.split(" ")[0] == "!c") {
				commandLogs(message, "compare", 1);
				const regex = /^https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#[a-z]+\/\d+$/;
				const regex2 = /^https:\/\/osu\.ppy\.sh\/b\/\d+$/;
				const regex3 = /^https:\/\/osu\.ppy\.sh\/beatmaps\/\d+$/;
				let playername;
				let maplink;
				if (regex.test(message.content.split(" ")[1]) || regex2.test(message.content.split(" ")[1]) || regex3.test(message.content.split(" ")[1])) {
					maplink = message.content.split(" ")[1];
					if (message.content.split(" ")[2] == undefined) {
						let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
						const username = allUser["Bancho"][message.author.id]?.name;
						if (username == undefined) {
							await message.reply("ユーザー名が登録されていません。/osureg、!osuregで登録するか、ユーザー名を入力してください。");
							allUser = null;
							return;
						}
						allUser = null;
						playername = username;
					} else {
						playername = message.content.split(" ")?.slice(2)?.join(" ");
						if (/^<@\d+>$/.test(playername)) {
							let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
							const userId = RegExp(/^<@(\d+)>$/).exec(playername)[1];
							if (!allUser["Bancho"][userId]?.name) {
								await message.reply("このDiscordのユーザーは登録されていません。/osureg、!osuregで登録してもらうか、osuのユーザー名を入力してください。");
								allUser = null;
								return;
							}
							playername = allUser["Bancho"][userId].name;
							allUser = null;
						}
					}
				} else if (message.content.split(" ")[1] == undefined) {
					let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
					const username = allUser["Bancho"][message.author.id]?.name;
					if (username == undefined) {
						await message.reply("ユーザー名が登録されていません。/osureg、!osuregで登録するか、ユーザー名を入力してください。");
						allUser = null;
						return;
					}
					allUser = null;
					playername = username;
					if (message.reference == null) {
						const messageData = await message.channel.messages.fetch();
						const messages = Array.from(messageData.values());
						let maplinks = messages.map(message => {
							if (regex.test(message.content) || regex2.test(message.content) || regex3.test(message.content)) return message.content;
							if (regex.test(message.embeds[0]?.data?.url) || regex2.test(message.embeds[0]?.data?.url) || regex3.test(message.embeds[0]?.data?.url)) return message.embeds[0].data.url;
							if (regex.test(message.embeds[0]?.author?.url) || regex2.test(message.embeds[0]?.author?.url) || regex3.test(message.embeds[0]?.data?.url)) return message.embeds[0].data.author.url;
						});
						maplinks = maplinks.filter(link => link != undefined);
						if (maplinks[0] == undefined) {
							await message.reply("直近50件のメッセージからマップリンクが見つかりませんでした。");
							return;
						}
						maplink = maplinks[0];
					} else {
						const messageData = await client.channels.cache.get(message.reference.channelId)?.messages.fetch(message.reference.messageId);
						if (messageData == undefined) {
							await message.reply("メッセージの取得に失敗しました。");
							return;
						}

						maplink = ((messageData) => {
							if (regex.test(messageData.content) || regex2.test(messageData.content) || regex3.test(messageData.content)) return messageData.content;
							if (regex.test(messageData.embeds[0]?.data?.url) || regex2.test(messageData.embeds[0]?.data?.url) || regex3.test(messageData.embeds[0]?.data?.url)) return messageData.embeds[0].data.url;
							if (regex.test(messageData.embeds[0]?.author?.url) || regex2.test(messageData.embeds[0]?.author?.url) || regex3.test(messageData.embeds[0]?.data?.url)) return messageData.embeds[0].data.author.url;
							return undefined;
						})(messageData);

						if (maplink == undefined) {
							await message.reply("メッセージからマップリンクが見つかりませんでした。");
							return;
						}
					}
				} else {
					playername = message.content.split(" ")?.slice(1)?.join(" ");
					if (/^<@\d+>$/.test(playername)) {
						let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
						const userId = RegExp(/^<@(\d+)>$/).exec(playername)[1];
						if (!allUser["Bancho"][userId]?.name) {
							await message.reply("このDiscordのユーザーは登録されていません。/osureg、!osuregで登録してもらうか、osuのユーザー名を入力してください。");
							allUser = null;
							return;
						}
						playername = allUser["Bancho"][userId].name;
						allUser = null;
					}
					if (message.reference == null) {
						const messageData = await message.channel.messages.fetch();
						const messages = Array.from(messageData.values());
						let maplinks = messages.map(message => {
							if (regex.test(message.content) || regex2.test(message.content) || regex3.test(message.content)) return message.content;
							if (regex.test(message.embeds[0]?.data?.url) || regex2.test(message.embeds[0]?.data?.url) || regex3.test(message.embeds[0]?.data?.url)) return message.embeds[0].data.url;
							if (regex.test(message.embeds[0]?.author?.url) || regex2.test(message.embeds[0]?.author?.url) || regex3.test(message.embeds[0]?.data?.url)) return message.embeds[0].data.author.url;
						});
						maplinks = maplinks.filter(link => link != undefined);
						if (maplinks[0] == undefined) {
							await message.reply("直近50件のメッセージからマップリンクが見つかりませんでした。");
							return;
						}
						maplink = maplinks[0];
					} else {
						const messageData = await client.channels.cache.get(message.reference.channelId)?.messages.fetch(message.reference.messageId);
						if (messageData == undefined) {
							await message.reply("メッセージの取得に失敗しました。");
							return;
						}

						maplink = ((messageData) => {
							if (regex.test(messageData.content) || regex2.test(messageData.content) || regex3.test(messageData.content)) return messageData.content;
							if (regex.test(messageData.embeds[0]?.data?.url) || regex2.test(messageData.embeds[0]?.data?.url) || regex3.test(messageData.embeds[0]?.data?.url)) return messageData.embeds[0].data.url;
							if (regex.test(messageData.embeds[0]?.author?.url) || regex2.test(messageData.embeds[0]?.author?.url) || regex3.test(messageData.embeds[0]?.data?.url)) return messageData.embeds[0].data.author.url;
							return undefined;
						})(messageData);

						if (maplink == undefined) {
							await message.reply("メッセージからマップリンクが見つかりませんでした。");
							return;
						}
					}
				}

				if (playername == "") {
					await message.reply("ユーザー名の前の空白が1つ多い可能性があります。");
					return;
				}

				let mapData;
				let mode;
				let mapUrl;
				if (regex.test(maplink)) {
					switch (maplink.split("#")[1].split("/")[0]) {
						case "osu":
							mode = 0;
							break;

						case "taiko":
							mode = 1;
							break;

						case "fruits":
							mode = 2;
							break;

						case "mania":
							mode = 3;
							break;

						default:
							await message.reply("リンク内のモードが不正です。");
							return;
					}
					mapData = await new osuLibrary.GetMapData(maplink, apikey, mode).getData();
					mapUrl = maplink;
				} else {
					mapData = await new osuLibrary.GetMapData(maplink, apikey).getDataWithoutMode();
					mode = Number(mapData.mode);
					mapUrl = osuLibrary.URLBuilder.beatmapURL(mapData.beatmapset_id, mode, mapData.beatmap_id);
				}

				const userPlays = await new osuLibrary.GetUserScore(playername, apikey, mode).getScoreDataWithoutMods(mapData.beatmap_id);
				if (userPlays.length == 0) {
					await message.reply("スコアデータが見つかりませんでした。");
					return;
				}

				const mapRankingData = await Tools.getAPIResponse(`https://osu.ppy.sh/api/get_scores?k=${apikey}&b=${mapData.beatmap_id}&m=${mode}&limit=50`);

				let mapScores = [];
				for (const element of mapRankingData) {
					mapScores.push(Number(element.score));
				}
				let mapRanking = mapScores.length + 1;

				if (Number(userPlays[0].score) >= mapScores[mapScores.length - 1]) {
					mapScores.sort((a, b) => a - b);
					const score = Number(userPlays[0].score);
					for (const element of mapScores) {
						if (score >= element) {
							mapRanking--;
						} else {
							break;
						}
					}
				}

				const userplays = await Tools.getAPIResponse(
					`https://osu.ppy.sh/api/get_user_best?k=${apikey}&type=string&m=${mode}&u=${playername}&limit=100`
				);
				let BPranking = 1;
				let foundFlag = false;
				for (const element of userplays) {
					if (element.beatmap_id == mapData.beatmap_id && element.score == userPlays[0].score) {
						foundFlag = true;
						break;
					}
					BPranking++;
				}

				if (!foundFlag) {
					userplays.reverse();
					BPranking = userplays.length + 1;
					for (const element of userplays) {
						if (Number(userPlays[0].pp) > Number(element.pp)) {
							BPranking--;
						} else {
							break;
						}
					}
				}

				let rankingString = "";
				const mapStatus = osuLibrary.Tools.mapstatus(mapData.approved);
				if (mapRanking <= 50 && BPranking <= 50 && userPlays[0].rank != "F" && (mapStatus == "Ranked" || mapStatus == "Qualified" || mapStatus == "Loved" || mapStatus == "Approved")) {
					if (mapStatus == "Ranked" || mapStatus == "Approved") {
						rankingString = `**__Personal Best #${BPranking} and Global Top #${mapRanking}__**`;
					} else {
						rankingString = `**__Personal Best #${BPranking} (No Rank) and Global Top #${mapRanking}__**`;
					}
				} else if (mapRanking == 51 && BPranking <= 50 && userPlays[0].rank != "F") {
					if (mapStatus == "Ranked" || mapStatus == "Approved") {
						rankingString = `**__Personal Best #${BPranking}__**`;
					} else {
						rankingString = `**__Personal Best #${BPranking} (No Rank)__**`;
					}
				} else if (mapRanking <= 50 && BPranking > 50 && userPlays[0].rank != "F" && (mapStatus == "Ranked" || mapStatus == "Qualified" || mapStatus == "Loved" || mapStatus == "Approved")) {
					rankingString = `**__Global Top #${mapRanking}__**`;
				} else {
					rankingString = "`Result`";
				}

				const bestMods = new osuLibrary.Mod(userPlays[0].enabled_mods).get();
				const calculator = new osuLibrary.CalculatePPSR(mapData.beatmap_id, bestMods.calc, mode);
				const srppData = await calculator.calculateSR();

				const playersdata = await new osuLibrary.GetUserData(playername, apikey, mode).getData();
				const mappersdata = await new osuLibrary.GetUserData(mapData.creator, apikey, mode).getData();
				const playerIconUrl = osuLibrary.URLBuilder.iconURL(playersdata?.user_id);
				const playerUrl = osuLibrary.URLBuilder.userURL(playersdata?.user_id);
				const mapperIconUrl = osuLibrary.URLBuilder.iconURL(mappersdata?.user_id);

				const mods = new osuLibrary.Mod(userPlays[0].enabled_mods).get();
				const userBestPlays = {
					n300: Number(userPlays[0].count300),
					n100: Number(userPlays[0].count100),
					n50: Number(userPlays[0].count50),
					misses: Number(userPlays[0].countmiss),
					nGeki: Number(userPlays[0].countgeki),
					nKatu: Number(userPlays[0].countkatu),
					combo: Number(userPlays[0].maxcombo),
					mods: mods.calc
				};

				const beatmap = await calculator.getMap();
				const map = new rosu.Beatmap(new Uint8Array(Buffer.from(beatmap)));
				const passedObjects = Tools.calcPassedObject(userPlays[0], mode);
				const recentPp = await calculator.calculateScorePP(userBestPlays, passedObjects);
				const { ifFCPP, ifFCAcc } = osuLibrary.CalculateIfFC.calculate(userBestPlays, mode, passedObjects, mods.calc, map);

				const recentAcc = Math.round(tools.accuracy({
					300: userPlays[0].count300,
					100: userPlays[0].count100,
					50: userPlays[0].count50,
					0: userPlays[0].countmiss,
					geki : userPlays[0].countgeki,
					katu: userPlays[0].countkatu
				}, Tools.modeConvertAcc(mode)) * 100) / 100;
				const userPlaysHit = Tools.formatHits(userBestPlays, mode);

				let ifFCMessage = `(**${ifFCPP.toFixed(2)}**pp for ${ifFCAcc}% FC)`;
				if (mode == 3) ifFCMessage = "";
				if (userPlays[0].maxcombo == mapData.max_combo) ifFCMessage = "**Full Combo!! Congrats!!**";
				if (recentPp.toString().replace(".", "").includes("727")) ifFCMessage = "**WYSI!! WYFSI!!!!!**";

				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`${mapData.artist} - ${mapData.title} [${mapData.version}]`)
					.setThumbnail(osuLibrary.URLBuilder.thumbnailURL(mapData.beatmapset_id))
					.setURL(mapUrl)
					.setAuthor({ name: `${playersdata.username}: ${Number(playersdata.pp_raw).toLocaleString()}pp (#${Number(playersdata.pp_rank).toLocaleString()} ${playersdata.country}${Number(playersdata.pp_country_rank).toLocaleString()})`, iconURL: playerIconUrl, url: playerUrl })
					.addFields({ name: rankingString, value: `${Tools.rankconverter(userPlays[0].rank)} **+ ${bestMods.str}** [**${srppData.sr.toFixed(2)}**★]　**Score**: ${Number(userPlays[0].score).toLocaleString()}　**Acc**: ${recentAcc}% \n **PP**: **${recentPp.toFixed(2)}** / ${srppData.pp.toFixed(2)}PP　${ifFCMessage} \n **Combo**: **${userPlays[0].maxcombo}x** / ${mapData.max_combo}x　**Hits**: ${userPlaysHit}`, inline: false })
				if (userPlays.length > 1) {
					let valueString = "";
					for (let i = 1; i < Math.min(userPlays.length, 5); i++) {
						const Mods = new osuLibrary.Mod(userPlays[i].enabled_mods).get();
						calculator.mods = Mods.calc;
						const srppData = await calculator.calculateSR();
						const userScore = {
							n300: Number(userPlays[i].count300),
							n100: Number(userPlays[i].count100),
							n50: Number(userPlays[i].count50),
							misses: Number(userPlays[i].countmiss),
							nGeki: Number(userPlays[i].countgeki),
							nKatu: Number(userPlays[i].countkatu),
							combo: Number(userPlays[i].maxcombo),
							mods: Mods.calc
						};
						const passedObjects = Tools.calcPassedObject(userPlays[i], mode);
						const scorePp = await calculator.calculateScorePP(userScore, passedObjects);
						const acc = Math.round(tools.accuracy({
							300: userPlays[i].count300,
							100: userPlays[i].count100,
							50: userPlays[i].count50,
							0: userPlays[i].countmiss,
							geki : userPlays[i].countgeki,
							katu: userPlays[i].countkatu
						}, Tools.modeConvertAcc(mode)) * 100) / 100;
						valueString += `${Tools.rankconverter(userPlays[i].rank)} + **${Mods.str}** [**${srppData.sr.toFixed(2)}**★] **${scorePp.toFixed(2)}**pp (**${acc}**%) ${userPlays[i].maxcombo}x **Miss**: ${userPlays[i].countmiss}\n`;
					}
					embed
						.addFields({ name: "__Other scores on the beatmap:__", value: valueString, inline: false });
				}
				embed
					.setTimestamp()
					.setFooter({ text: `${mapStatus} mapset of ${mapData.creator}`, iconURL: mapperIconUrl });
				await message.channel.send({ embeds: [embed] });
			}

			if (message.content.split(" ")[0] == "!osureg") {
				const username = message.author.id;
				const osuid = message.content.split(" ")?.slice(1)?.join(" ");

				if (osuid == "" || osuid == undefined) {
					await message.reply("使い方: !osureg [osu! Username]");
					return;
				}

				const userData = await new osuLibrary.GetUserData(osuid, apikey).getDataWithoutMode();
				if (!userData) {
					await message.reply("ユーザーが見つかりませんでした。");
					return;
				}
				let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
				if (!allUser["Bancho"][username]) {
					allUser["Bancho"][username] = {
						"name": osuid
					};
				} else {
					allUser["Bancho"][username].name = osuid;
				}
				fs.writeJsonSync("./ServerDatas/PlayerData.json", allUser, { spaces: 4, replacer: null });
				await message.reply(`${message.author.username}さんは${osuid}として保存されました!`);
				allUser = null;
				return;
			}

			if (message.content.split(" ")[0] == "m!osureg") {
				const username = message.author.id;
				const osuid = message.content.split(" ")?.slice(1)?.join(" ");

				if (osuid == "" || osuid == undefined) {
					await message.reply("使い方: m!osureg [Mamestagram ID]");
					return;
				}

				if (!RegExp(/^\d+$/).exec(osuid)) {
					await message.reply("IDは数字のみで構成されている必要があります。");
					return;
				}

				let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
				if (!allUser["Mamestagram"][username]) {
					allUser["Mamestagram"][username] = {
						"id": osuid
					};
				} else {
					allUser["Mamestagram"][username].id = osuid
				}
				fs.writeJsonSync("./ServerDatas/PlayerData.json", allUser, { spaces: 4, replacer: null });
				await message.reply(`${message.author.username}さんはMamestagram ID: ${osuid}として保存されました!`);
				allUser = null;
				return;
			}

			if (message.content.split(" ")[0].startsWith("!wi")) {
				if (message.content == "!wi") {
					await message.reply("使い方: !wi[o, t, c, m] [PP] (osu!ユーザーネーム)");
					return;
				}
				commandLogs(message, "what if", 1);

				let enteredpp;
				if (message.content.split(" ")[1] == undefined) {
					await message.reply("ppを入力してください。");
					return;
				}

				if (message.content.split(" ")[1] == "") {
					await message.reply("ppの前の空白が1つ多い可能性があります。");
					return;
				}

				if (!RegExp(/^[\d.]+$/).exec(message.content.split(" ")[1]) || isNaN(Number(message.content.split(" ")[1]))) {
					await message.reply("ppは数字のみで構成されている必要があります。");
					return;
				}

				enteredpp = Number(message.content.split(" ")[1]);

				let playername;
				if (message.content.split(" ")[2] == undefined) {
					let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
					const username = allUser["Bancho"][message.author.id]?.name;
					if (username == undefined) {
						await message.reply("ユーザー名が登録されていません。/osureg、!osuregで登録するか、ユーザー名を入力してください。");
						allUser = null;
						return;
					}
					allUser = null;
					playername = username;
				} else {
					playername = message.content.split(" ")?.slice(2)?.join(" ");
					if (/^<@\d+>$/.test(playername)) {
						let allUser = fs.readJsonSync("./ServerDatas/PlayerData.json");
						const userId = RegExp(/^<@(\d+)>$/).exec(playername)[1];
						if (!allUser["Bancho"][userId]?.name) {
							await message.reply("このDiscordのユーザーは登録されていません。/osureg、!osuregで登録してもらうか、osuのユーザー名を入力してください。");
							allUser = null;
							return;
						}
						playername = allUser["Bancho"][userId].name;
						allUser = null;
					}
				}

				if (playername == "") {
					await message.reply("ユーザー名の前の空白が1つ多い可能性があります。");
					return;
				}

				let mode = "";
				switch (message.content.split(" ")[0]) {
					case "!wi":
					case "!wio":
						mode = "0";
						break;

					case "!wit":
						mode = "1";
						break;

					case "!wic":
						mode = "2";
						break;

					case "!wim":
						mode = "3";
						break;

					default:
						await message.reply("モードの指定方法が間違っています。ちゃんと存在するモードを選択してください。");
						return;
				}

				const userplays = await Tools.getAPIResponse(
					`https://osu.ppy.sh/api/get_user_best?k=${apikey}&type=string&m=${mode}&u=${playername}&limit=100`
				);
				const oldpp = [];
				const pp = [];
				for (const element of userplays) {
					oldpp.push(Number(element.pp));
					pp.push(Number(element.pp));
				}
				pp.push(enteredpp);
				pp.sort((a, b) => b - a);

				if (enteredpp == pp[pp.length - 1]) {
					await message.reply("PPに変動は有りません。");
					return;
				} else {
					pp.pop();
				}

				const userdata = await new osuLibrary.GetUserData(playername, apikey, mode).getData();
				const scorepp = osuLibrary.CalculateGlobalPP.calculate(oldpp, Number(userdata.playcount));
				const bonusPP = userdata.pp_raw - scorepp;

				let currentBonusPP = 0;
				let currentPlaycount = 0;
				while (currentBonusPP < bonusPP) {
					currentBonusPP = (417 - 1/3) * (1 - Math.pow(0.995, Math.min(1000, currentPlaycount)));
					currentPlaycount++;
				}
				let globalPP = 0;
				globalPP += osuLibrary.CalculateGlobalPP.calculate(pp, userdata.playcount + 1);
				globalPP += (417 - 1/3) * (1 - Math.pow(0.995, Math.min(1000, currentPlaycount + 1)));

				oldpp.reverse();
				let bpRanking = oldpp.length + 1;
				for (const element of oldpp) {
					if (enteredpp > element) {
						bpRanking--;
					} else {
						break;
					}
				}

				const NearestUser = await osuLibrary.GetRank.get(globalPP, mode);
				let nearestRank = Number(NearestUser.rank);

				let rankDiff = Number(userdata.pp_rank) - nearestRank;
				let rankPrefix = rankDiff > 0 ? "+" : "";

				const playerIconURL = osuLibrary.URLBuilder.iconURL(userdata?.user_id);
				const playerUserURL = osuLibrary.URLBuilder.userURL(userdata?.user_id);
				const embed = new EmbedBuilder()
					.setColor("Blue")
					.setTitle(`What if ${playername} got a new ${enteredpp}pp score?`)
					.setDescription(`A ${enteredpp}pp play would be ${playername}'s #${bpRanking} best play.\nTheir pp would change by **+${(Math.round((globalPP - Number(userdata.pp_raw)) * 100) / 100).toLocaleString()}** to **${(Math.round(globalPP * 100) / 100).toLocaleString()}pp** and they would reach approx. rank #${nearestRank} (${rankPrefix + rankDiff}).`)
					.setThumbnail(playerIconURL)
					.setAuthor({ name: `${userdata.username}: ${Number(userdata.pp_raw).toLocaleString()}pp (#${Number(userdata.pp_rank).toLocaleString()} ${userdata.country}${Number(userdata.pp_country_rank).toLocaleString()})`, iconURL: playerIconURL, url: playerUserURL });
				await message.channel.send({ embeds: [embed] });
				return;
			}

			if (fs.existsSync(`./OsuPreviewquiz/${message.channel.id}.json`) && message.content.endsWith("?")) {
				if (message.author.bot) return;
				commandLogs(message, "クイズの答え", 1);
				const answer = message.content.replace("?", "").toLowerCase().replace(/ /g, "");

				let parsedjson = fs.readJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`);
				let currenttitle = "";
				let isperfect;
				let foundflagforjson = false;

				for (const element of parsedjson) {
					if (!element.quizstatus && !foundflagforjson) {
						foundflagforjson = true;
						currenttitle = element.name;
						isperfect = element.Perfect;
					}
				}

				const currentanswer = currenttitle.toLowerCase().replace(/ /g, "");

				let answerer = "";
				const matchPercentage = Math.round(Tools.matchPercentage(answer, currentanswer));
				switch (true) {
					case answer == currentanswer:
						await message.reply("正解です！");
						answerer = `:o::clap:${message.author.username}`;
						break;
					case matchPercentage >= 90 && !isperfect:
						await message.reply(`ほぼ正解です！(正答率: ${matchPercentage}%)\n答え: ${currenttitle}`);
						answerer = `:o:${message.author.username}`;
						break;
					case matchPercentage >= 50 && !isperfect:
						await message.reply(`半分正解です！(正答率: ${matchPercentage}%)\n答え: ${currenttitle}`);
						answerer = `:o:${message.author.username}`;
						break;
					case matchPercentage >= 35 && !isperfect:
						await message.reply(`惜しかったです！(正答率: ${matchPercentage}%)\n答え: ${currenttitle}`);
						answerer = `:o:${message.author.username}`;
						break;
					default:
						await message.reply(`不正解です;-;\n答えの約${matchPercentage}%を入力しています。`);
						parsedjson = null;
						return;
				}

				let foundflagforans = false;
				for (let element of parsedjson) {
					if (foundflagforans) break;
					if (!element.quizstatus && !foundflagforans) {
						foundflagforans = true;
						element.quizstatus = true;
						element.Answerer = answerer;
						fs.writeJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`, parsedjson, { spaces: 4, replacer: null });
					}
				}
				parsedjson = null;
				let afterjson = fs.readJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`);
				let foundflagforafterjsonanswer = false;
				for (const element of afterjson) {
					if (!element.quizstatus && !foundflagforafterjsonanswer) {
						if (element.mode == "BG") {
							foundflagforafterjsonanswer = true;
							await message.channel.send(`問題${element.number}のBGを表示します。`);
							await Tools.getAPIResponse(`https://assets.ppy.sh/beatmaps/${element.id}/covers/raw.jpg`, { responseType: "arraybuffer" })
								.then(async BGdata => {
									await message.channel.send({ files: [{ attachment: BGdata, name: "background.jpg" }] });
									BGdata = null;
								});
							afterjson = null;
							return;
						} else {
							foundflagforafterjsonanswer = true;
							await message.channel.send(`問題${element.number}のプレビューを再生します。`);
							await Tools.getAPIResponse(`https://b.ppy.sh/preview/${element.id}.mp3`, { responseType: "arraybuffer" })
								.then(async audioData => {
									await message.channel.send({ files: [{ attachment: audioData, name: "audio.mp3" }] });
									audioData = null;
								});
							afterjson = null;
							return;
						}
					}
				}

				if (!foundflagforafterjsonanswer) {
					let answererarray = fs.readJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`);
					let answererstring = "";
					for (let i = 0; i < answererarray.length; i++) {
						if (answererarray[i].Answerer == "") continue;
						if (answererarray[i].hint) {
							answererstring += `問題${i + 1}の回答者: **${answererarray[i].Answerer}** ※ヒント使用\n`;
						} else {
							answererstring += `問題${i + 1}の回答者: **${answererarray[i].Answerer}**\n`;
						}
					}
					await message.channel.send(`クイズが終了しました！お疲れ様でした！\n${answererstring}`);
					fs.removeSync(`./OsuPreviewquiz/${message.channel.id}.json`);
					answererarray = null;
					afterjson = null;
				}
				return;
			}

			if (message.content == "!skip") {
				if (!fs.existsSync(`./OsuPreviewquiz/${message.channel.id}.json`)) {
					await message.reply("クイズが開始されていません。");
					return;
				}
				commandLogs(message, "クイズのスキップ", 1);

				let parsedjson = fs.readJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`);
				let currenttitle = "";
				let foundflagforjson = false;
				for (const element of parsedjson) {
					if (!element.quizstatus && !foundflagforjson) {
						foundflagforjson = true;
						currenttitle = element.name;
					}
				}

				await message.reply(`答え: ${currenttitle}`);

				let foundflagforans = false;
				for (let element of parsedjson) {
					if (foundflagforans) break;
					if (!element.quizstatus && !foundflagforans) {
						foundflagforans = true;
						element.quizstatus = true;
						element.Answerer = `:x:${message.author.username}さんによってスキップされました。`;
						fs.writeJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`, parsedjson, { spaces: 4, replacer: null });
					}
				}
				parsedjson = null;

				let afterjson = fs.readJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`);
				let foundflagforafterjsonanswer = false;
				for (const element of afterjson) {
					if (!element.quizstatus && !foundflagforafterjsonanswer) {
						if (element.mode == "BG") {
							foundflagforafterjsonanswer = true;
							await message.channel.send(`問題${element.number}のBGを表示します。`);
							await Tools.getAPIResponse(`https://assets.ppy.sh/beatmaps/${element.id}/covers/raw.jpg`, { responseType: "arraybuffer" })
								.then(async BGdata => {
									await message.channel.send({ files: [{ attachment: BGdata, name: "background.jpg" }] });
									BGdata = null;
								});
							afterjson = null;
							return;
						} else {
							foundflagforafterjsonanswer = true;
							await message.channel.send(`問題${element.number}のプレビューを再生します。`);
							await Tools.getAPIResponse(`https://b.ppy.sh/preview/${element.id}.mp3`, { responseType: "arraybuffer" })
								.then(async audioData => {
									await message.channel.send({ files: [{ attachment: audioData, name: "audio.mp3" }] });
									audioData = null;
								});
							afterjson = null;
							return;
						}
					}
				}

				if (!foundflagforafterjsonanswer) {
					let answererarray = fs.readJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`);
					let answererstring = "";
					for (let i = 0; i < answererarray.length; i++) {
						if (answererarray[i].Answerer == "") continue;
						answererstring += `問題${i + 1}の回答者: **${answererarray[i].Answerer}**\n`;
					}
					await message.channel.send(`クイズが終了しました！お疲れ様でした！\n${answererstring}`);
					fs.removeSync(`./OsuPreviewquiz/${message.channel.id}.json`);
					answererarray = null;
					afterjson = null;
				}
				return;
			}

			if (message.content == "!hint") {
				if (!fs.existsSync(`./OsuPreviewquiz/${message.channel.id}.json`)) {
					await message.reply("クイズが開始されていません。");
					return;
				}
				commandLogs(message, "クイズのヒント", 1);

				let parsedjson = fs.readJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`);
				let currenttitle = "";
				let foundflagforjson = false;
				for (const element of parsedjson) {
					if (foundflagforjson) break;
					if (!element.quizstatus && !foundflagforjson) {
						foundflagforjson = true;
						if (element.hint) {
							await message.reply("ヒントは１問につき１回まで使用できます。");
							return;
						}
						currenttitle = element.name;
						element.hint = true;
						fs.writeJsonSync(`./OsuPreviewquiz/${message.channel.id}.json`, parsedjson, { spaces: 4, replacer: null });
					}
				}

				parsedjson = null;
				const hidecount = Math.round(currenttitle.replace(" ", "").length / 3);

				let randomarray = [];
				while (randomarray.length < hidecount) {
					const randomnumber = Math.floor(Math.random() * currenttitle.length);
					if (!randomarray.includes(randomnumber) && currenttitle[randomnumber] != " ") randomarray.push(randomnumber);
				}

				let hint = "";
				for (let i = 0; i < currenttitle.length; i++) {
					if (currenttitle[i] == " ") {
						hint += " ";
						continue;
					}
					if (randomarray.includes(i)) {
						hint += currenttitle[i];
					} else {
						hint += "◯";
					}
				}

				await message.reply(`ヒント: ${hint}(計${hidecount}文字表示されています。タイトルは${currenttitle.replace(" ", "").length}文字です。)`);
				return;
			}

			if (message.content == "!ero") {
				commandLogs(message, "エロあるよ（笑）", 1);
				if (Math.floor(Math.random() * 10) == 0) {
					let eroVideo = fs.readFileSync("./eroaru.mp4");
					await message.reply({ files: [{ attachment: eroVideo, name: "donarudo.mp4" }] });
					eroVideo = null;
					return;
				} else {
					let eroVideo = fs.readFileSync("./eronai.mp4");
					await message.reply({ files: [{ attachment: eroVideo, name: "donarudo.mp4" }] });
					eroVideo = null;
					return
				}
			}

			if (message.content == "!nja") {
				commandLogs(message, "ナイジェリアの男達だった", 1);
				if (Math.floor(Math.random() * 10) == 0) {
					let nigVideo = fs.readFileSync("./nigaru.mp4");
					await message.reply({ files: [{ attachment: nigVideo, name: "nigeria.mp4" }] });
					nigVideo = null;
					return;
				} else {
					let nigVideo = fs.readFileSync("./nignai.mp4");
					await message.reply({ files: [{ attachment: nigVideo, name: "nigeria.mp4" }] });
					nigVideo = null;
					return
				}
			}

			if (message.content.split(" ")[0] == "h!help") {
				commandLogs(message, "ヘルプ", 1);
				const Arg = message.content.split(" ")[1];
				switch (Arg) {
					case "1": {
						let casinoMessage = "__\*\*カジノの遊び方(1ページ目)\*\*\__\n";
						casinoMessage += "- `/medal`でコインからメダルに\n";
						casinoMessage += "- `/coin`でメダルからコインに変えることができます。\n";
						casinoMessage += "- `/slot`で遊ぶことができます。\n";
						casinoMessage += "- `/slotgraph`でスランプのグラフが表示されます。\n";
						casinoMessage += "- `/slothistory`で当たりの履歴を見ることができます。\n";
						casinoMessage += "**Typeがレートで、5コイン1メダル、20コイン1メダルから選べます**\n\n";
						casinoMessage += "__\*\*コインフリップの遊び方\*\*\__\n";
						casinoMessage += "- `/coinflip`でゲームを開始できます。\n";
						await message.reply(casinoMessage);
						break;
					}

					case "2": {
						let casinoMessage = "__\*\*カジノ全般で使えるコマンド\*\*\__\n";
						casinoMessage += "- 参加したい場合、`/join`を入力することで参加できます。\n";
						casinoMessage += "- ゲームをやめたい場合、`/leave`を入力することでゲームをやめることができます。\n";
						casinoMessage += "- ゲームの途中でやめたい場合、`/cancel`を入力することでゲームを途中でやめることができます。\n";
						casinoMessage += "- 現在のゲームにBOTを追加したい場合、`/addbot`を入力することでBOTと戦うことができます。\n";
						casinoMessage += "- `/bank`で現在の銀行残高、スロットコインの所持量がわかります。\n";
						casinoMessage += "- `/bankranking`で銀行残高のランキングが見れます。\n";
						casinoMessage += "- `/lv`でカジノのレベルが見れます。\n"
						casinoMessage += "- `/regcasino`でカジノに登録します。\n";
						casinoMessage += "- `/send`で人にお金を送ることが出来ます。\n";
						casinoMessage += "- `/dice`でサイコロが増えます。\n";
						casinoMessage += "- `/roulette`でルーレットが引けます。\n";
						await message.reply(casinoMessage);
						break;
					}

					case "3": {
						let osuMessage = "__\*\*osu!のコマンド一覧(!〇〇)\*\*\__\n";
						osuMessage += "- `!osureg [osu! Username]`でosu!のユーザー名を登録します。スラッシュコマンドもあります\n";
						osuMessage += "- `!map [maplink] (mods) (acc)`で指定した譜面の情報を表示します。modsとaccは省略可能です。\n";
						osuMessage += "- `!c (maplink) (username)`でユーザーのそのマップでの記録(最大5個)を表示します。usernameは登録していれば省略可能です。マップリンクも省略可です。\n";
						osuMessage += "- `!r(o, t, c, m) (username)`でユーザーの最新のosu!std、taiko、catch、maniaの記録を表示します。usernameは登録していれば省略可能です。stdは!rでも!roでも実行可能です。\n";
						osuMessage += "- `!wi[o, t, c, m] [pp] (username)`でユーザーが指定したppを新しく取得したときのppを表示します。usernameは省略可能です。\n";
						osuMessage += "- `!m [mods]`で直近に送信された譜面にmodsをつけてppを表示します。/linkコマンドで有効になります。\n";
						osuMessage += "- `!skip`はosubgquiz、osubgquizpf、osuquiz、osuquizpfコマンドで使用できます。現在の問題をスキップします。\n";
						osuMessage += "- `!hint`はosubgquiz、osubgquizpf、osuquiz、osuquizpfコマンドで使用できます。現在の問題のヒントを表示します。\n";

						await message.reply(osuMessage);
						break
					}

					case "4": {
						let mamestaMessage = "__\*\*osu!(Mamestagram)のコマンド一覧\*\*\__\n";
						mamestaMessage += "- `m!osureg [Mamestagram ID]`でMamestagramのIDを登録します。\n";
						mamestaMessage += "- `m!r(o, t, c, m) (userid)`でユーザーの最新のosu!std、taiko、catch、maniaの記録を表示します。useridは登録していれば省略可能です。stdはm!rでもm!roでも実行可能です。\n";

						await message.reply(mamestaMessage);
						break
					}

					case "5": {
						let osuMessage = "__\*\*osu!のスラッシュコマンド一覧(1ページ目)\*\*\__\n";
						osuMessage += "- `/osureg [Username]`でosu!のユーザー名を登録します。\n";
						osuMessage += "- `/calculatepp [beatmapFile] [mode] (mods)`で送信されたosuファイルのPPを計算します。\n";
						osuMessage += "- `/loved (Mode)`で、送られたチャンネルをLovedチェックチャンネルに変えます。\n";
						osuMessage += "- `/lovedmention (Mode)`で、Lovedチェックチャンネルでメンションを送るかどうかを変更します。\n";
						osuMessage += "- `/qf (Mode)`で、送られたチャンネルをQF/Rankチェックチャンネルに変えます。\n";
						osuMessage += "- `/qfmention`で、QFチェックチャンネルでメンションを送るかどうかを変更します。\n";
						osuMessage += "- `/rankedmention (Mode)`で、Rankedチェックチャンネルでメンションを送るかどうかを変更します。\n";
						osuMessage += "- `/preview [BeatmapLink]`で、送られたマップのプレビューリンクを表示します。\n";
						osuMessage += "- `/srchart [BeatmapLink]`で、SRのチャート画像を表示します。\n";
						await message.reply(osuMessage);
						break;
					}

					case "6": {
						let osuMessage = "__\*\*osu!のスラッシュコマンド一覧(2ページ目)\*\*\__\n";
						osuMessage += "- `/ifmod [BeatmapLink] [Mods] (Username) (Scoreの種類)`で、送られたマップのスコアのModsを変更してPPを計算します。\n";
						osuMessage += "- `/lb [BeatmapLink] (Mods)`で、指定されたModsでのランキングを表示します。n";
						osuMessage += "- `/link`で、直近に送信された譜面のリンクを表示します。\n";
						osuMessage += "- `/osubgquiz | /osubgquizpf (Username) (Mode)`で、指定されたユーザーのosu!のBPからBGクイズを出します。PFは完答のみ正解扱いになります。\n";
						osuMessage += "- `/osuquiz | /osuquizpf (Username) (Mode)`で、指定されたユーザーのosu!のBPからプレビュークイズを出します。PFは完答のみ正解扱いになります。\n";
						osuMessage += "- `/quizend`でクイズを終了します。\n";
						osuMessage += "- `/osureg (Username)`でほしのbotにosu!のユーザー名を登録します。\n";
						osuMessage += "- `/link`でチャンネル内でビートマップリンクが送られた時にマップ情報を表示します。\n";
						osuMessage += "- `/osusearch [query] [mode]`でosu!のビートマップを検索します。\n";
						await message.reply(osuMessage);
						break;
					}

					case "7": {
						let imageMessage = "__\*\*画像関連のコマンド\*\*\__\n";
						imageMessage += "- `/kemo`でけも画像を表示します\n";
						imageMessage += "- `/kemodelete [Index]`で特定のけも画像を消します。";
						imageMessage += "- `/kemocount`でけも画像の数を表示します。\n";
						imageMessage += "- `/pic [Tag]`で指定したタグの画像を表示します。\n";
						imageMessage += "- `/alltags`ですべてのタグの一覧を表示します。\n";
						imageMessage += "- `/piccount [Tag]`で指定したタグの画像の数を表示します。\n";
						imageMessage += "- `/settag`で送られたチャンネルをpicタグに設定します。\n";
						imageMessage += "- `/deltag`で送られたチャンネルのpicタグを消します。\n";
						await message.reply(imageMessage);
						break;
					}

					case "8": {
						let quoteMessage = "__\*\*名言関連のコマンド\*\*\__\n";
						quoteMessage += "- `/quote [Tag]`で指定したタグの名言を表示します。\n";
						quoteMessage += "- `/delquote [Quote]`指定した名言を削除します。\n";
						quoteMessage += "- `/allquotetags`ですべてのタグの一覧を表示します。\n";
						quoteMessage += "- `/quotecount [Tag]`で指定したタグの名言の数を表示します。\n";
						quoteMessage += "- `/setquotetag`で送られたチャンネルをquoteタグに設定します。\n";
						quoteMessage += "- `/delquotetag`で送られたチャンネルのquoteタグを消します。\n";
						await message.reply(quoteMessage);
						break;
					}

					case "9": {
						let sbMessage = "__\*\*スカイブロック関連のコマンド\*\*\__\n";
						sbMessage += "- `/ratchecker [file] (output)`で、送られたChattrigger ModuleにRatが含まれているかを確認します。\n";
						await message.reply(sbMessage);
						break;
					}

					case "10": {
						let talkMessage = "__\*\*サーバーでの発言回数関連のコマンド\*\*\__\n";
						talkMessage += "- `/talkcount`であなたがこのサーバーでどのくらい話したかを表示します。\n";
						talkMessage += "- `/talkranking`でこのサーバーでの話した回数のランキングを表示します。\n";
						talkMessage += "- `/talklevel`であなたのこのサーバーでの話した回数をレベルを表示します。\n";
						talkMessage += "- `/talklevelranking`でこのサーバーでの話した回数のレベルランキングを表示します。\n";
						await message.reply(talkMessage);
						break;
					}

					case "11": {
						let otherMessage = "__\*\*その他のコマンド\*\*\__\n";
						otherMessage += "- `/tweetdownloader [URL]`でツイートの画像をダウンロードします。\n";
						otherMessage += "- `/youtubedownloader [URL]`でYouTubeの動画をダウンロードします。\n";
						otherMessage += "- `/loc [username] [repo]`で指定したユーザーの指定したリポジトリの行数を表示します。\n";
						otherMessage += "- `/echo [Message]`で送られたメッセージを代わりに送ります。\n";
						otherMessage += "- `/kawaii [tag]`でいい感じの画像をAPIから持ってきます。\n";
						otherMessage += "- `!calc 四則演算式`で計算します。\n";
						otherMessage += "- `時間計算(123.7時間、123.7分など)`で時間を計算します。\n";
						await message.reply(otherMessage);
						break;
					}

					case "12": {
						let adminMessage = "__\*\*管理者専用コマンド\*\*\__\n";
						adminMessage += "- `/slotsetting`で現在のスロットの設定が見れます。\n"
						adminMessage += "- `/update [File]`でBotを更新します。\n";
						adminMessage += "- `/restart`でBotを再起動します。\n";
						adminMessage += "- `/backup [Time]`でバックアップを復元します。\n";
						adminMessage += "- `/backuplist`でバックアップのリストを表示します。\n";
						adminMessage += "- `/backupcreate`でバックアップを作成します。\n";
						await message.reply(adminMessage);
						break;
					}

					default: {
						let helpMessage = "__\*\*目次\*\*\__\n";
						helpMessage += "- `1: カジノ`\n";
						helpMessage += "- `2: カジノ(2ページ目)`\n";
						helpMessage += "- `3: osu!`\n";
						helpMessage += "- `4: osu!(mamestagram)`\n";
						helpMessage += "- `5: osu!(スラッシュコマンド)`\n";
						helpMessage += "- `6: osu!(スラッシュコマンド2)`\n";
						helpMessage += "- `7: 画像関連のコマンド`\n";
						helpMessage += "- `8: 名言関連のコマンド`\n";
						helpMessage += "- `9: スカイブロック関連のコマンド`\n";
						helpMessage += "- `10: サーバーでの発言回数関連のコマンド`\n";
						helpMessage += "- `11: その他のコマンド`\n";
						helpMessage += "- `12: 管理者専用コマンド`\n";
						helpMessage += "詳細は`h!help [ページ番号]`で確認できます。";
						await message.reply(helpMessage);
						break;
					}
				}
				return;
			}

			if (message.content.split(" ")[0] == "!calc") {
				commandLogs(message, "計算コマンド", 1);
				const expression = message.content.split(" ").slice(1).join(" ");
				try {
					const result = MathJS.evaluate(expression);
					message.channel.send(`計算結果: **${result}**`);
					return;
				} catch (error) {
					message.channel.send("無効な計算式です");
					return;
				}
			}

			if (/^\d+\.\d+時間$/.test(message.content)) {
				commandLogs(message, "時間計算", 1);
				const totalHours = Number(RegExp(/^\d+\.\d+/).exec(message.content)[0]);
				if (isNaN(totalHours)) return;
				await message.reply(`${Math.floor(totalHours)}時間 ${Math.floor((totalHours - Math.floor(totalHours)) * 60)}分 ${Math.round(((totalHours - Math.floor(totalHours)) * 60 - Math.floor((totalHours - Math.floor(totalHours)) * 60)) * 60)}秒`);
				return;
			}

			if (/^\d+\.\d+分$/.test(message.content)) {
				commandLogs(message, "時間計算", 1);
				const totalminutes = Number(RegExp(/^\d+\.\d+/).exec(message.content)[0]);
				if (isNaN(totalminutes)) return;
				if (totalminutes >= 60) {
					await message.reply(`${Math.floor(totalminutes / 60)}時間 ${Math.floor(totalminutes % 60)}分 ${Math.round(((totalminutes % 60) - Math.floor(totalminutes % 60)) * 60)}秒`);
				} else {
					await message.reply(`${Math.floor(totalminutes)}分 ${Math.round((totalminutes - Math.floor(totalminutes)) * 60)}秒`);
				}
				return;
			}

			if (message.attachments.size > 0 && message.attachments.every(attachment => attachment.url.includes(".avi") || attachment.url.includes(".mov") || attachment.url.includes(".mp4") || attachment.url.includes(".png") || attachment.url.includes(".jpg") || attachment.url.includes(".gif")) && message.channel.id == Furrychannel) {
				if (message.author.bot) return;
				commandLogs(message, "Furry画像登録", 1);
				let dataBase = fs.readJsonSync("./Pictures/Furry/DataBase.json");
				for (const attachment of message.attachments.values()) {
					const imageURL = attachment.url;
					const imageFile = await Tools.getAPIResponse(imageURL, { responseType: "arraybuffer" });
					const extention = imageURL.split(".")[imageURL.split(".").length - 1].split("?")[0];
					const fileNameWithoutExtention = dataBase.PhotoDataBase.map((x) => Number(x.split(".")[0]));
					let filename = 0;
					while (fileNameWithoutExtention.includes(filename)) {
						filename++;
					}
					dataBase.PhotoDataBase.push(filename + "." + extention);
					dataBase.FileCount++;
					fs.writeFileSync(`./Pictures/Furry/${filename}.${extention}`, imageFile);
				}
				fs.writeJsonSync("./Pictures/Furry/DataBase.json", dataBase, { spaces: 4, replacer: null });
				dataBase = null;
				if (message.attachments.size == 1) {
					await message.reply("Furryが保存されました");
				} else {
					await message.reply(`${message.attachments.size}個のFurryが保存されました`);
				}
				return;
			}

			if (message.attachments.size > 0 && message.attachments.every(attachment => attachment.url.includes(".avi") || attachment.url.includes(".mov") || attachment.url.includes(".mp4") || attachment.url.includes(".png") || attachment.url.includes(".jpg") || attachment.url.includes(".gif"))) {
				if (message.author.bot) return;
				const currentDir = fs.readdirSync("./Pictures/tag").filter(folder => fs.existsSync(`./Pictures/tag/${folder}/DataBase.json`));
				for (const folder of currentDir) {
					let dataBase = fs.readJsonSync(`./Pictures/tag/${folder}/DataBase.json`);
					if (dataBase.id == message.channel.id) {
						commandLogs(message, "pic画像登録", 1);
						let fileNameArray = [];
						for (const attachment of message.attachments.values()) {
							const imageURL = attachment.url;
							const imageFile = await Tools.getAPIResponse(imageURL, { responseType: "arraybuffer" });
							const extention = imageURL.split(".")[imageURL.split(".").length - 1].split("?")[0];
							const fileNameWithoutExtention = dataBase.PhotoDataBase.map((x) => Number(x.split(".")[0]));
							let filename = 0;
							while (fileNameWithoutExtention.includes(filename)) {
								filename++;
							}
							dataBase.PhotoDataBase.push(filename + "." + extention);
							fileNameArray.push(filename + "." + extention);
							dataBase.FileCount++;
							fs.writeFileSync(`./Pictures/tag/${folder}/${filename}.${extention}`, imageFile);
						}
						fs.writeJsonSync(`./Pictures/tag/${folder}/DataBase.json`, dataBase, { spaces: 4, replacer: null });
						dataBase = null;
						if (message.attachments.size == 1) {
							await message.reply(`ファイルが保存されました(${fileNameArray[0]})`);
						} else {
							await message.reply(`${message.attachments.size}個のファイルが保存されました\nファイル名: ${fileNameArray.join(", ")}`);
						}
						return;
					}
					dataBase = null;
				}
			}

			if (!message.content.startsWith("!")) {
				if (message.author.bot || message.content == "") return;
				let allQuotes = fs.readJsonSync("./ServerDatas/Quotes.json");
				for (const key in allQuotes) {
					if (allQuotes[key].id == message.channel.id) {
						commandLogs(message, "名言登録", 1);
						allQuotes[key].quotes.push(message.content);
						fs.writeJsonSync("./ServerDatas/Quotes.json", allQuotes, { spaces: 4, replacer: null });
						await message.reply(`名言が保存されました`);
						allQuotes = null;
						return;
					}
				}
				allQuotes = null;
			}
		} catch (e) {
			if (e.message == "No data found") {
				await message.reply("マップが見つかりませんでした。")
					.catch(async () => {
						await client.users.cache.get(message.author.id).send("こんにちは！\nコマンドを送信したそうですが、権限がなかったため送信できませんでした。もう一度Botの権限について見てみてください！")
							.then(() => {
								console.log("DMに権限に関するメッセージを送信しました。");
							})
							.catch(() => {
								console.log("エラーメッセージの送信に失敗しました。");
							});
					});
			} else {
				await asciify("Error", { font: "larry3d" })
					.then(msg => console.log(msg))
					.catch(err => console.log(err));
				console.log(e);
				await message.reply(`${message.author.username}さんのコマンドの実行中にエラーが発生しました。`)
					.catch(async () => {
						await client.users.cache.get(message.author.id).send("こんにちは！\nコマンドを送信したそうですが、権限がなかったため送信できませんでした。もう一度Botの権限について見てみてください！")
							.then(() => {
								console.log("DMに権限に関するメッセージを送信しました。");
							})
							.catch(() => {
								console.log("エラーメッセージの送信に失敗しました。");
							});
					});
			}
		}
	}
);

client.on(Events.Error, async (error) => {
	await asciify("Discord API Error", { font: "larry3d" })
		.then(msg => console.log(msg))
		.catch(err => console.log(err));
	console.log(`エラー名: ${error.name}\nエラー内容: ${error.message}`);
});

function commandLogs(message, command, mode) {
	let now = new Date();
	if (mode == 1) {
		console.log(`[${now.toLocaleString()}] ${message.author.username}さんが${command}コマンドを送信しました`);
	} else {
		console.log(`[${now.toLocaleString()}] ${!message.user.globalName ? message.user.username : message.user.globalName}さんが${command}コマンドを送信しました。`);
	}
	message = null;
	command = null;
	mode = null;
}

async function checkMap() {
	await checkqualified();
	await checkranked();
	await checkloved();
}

function checkqualified() {
	return new Promise (async resolve => {
		const gameModes = ["osu", "taiko", "catch", "mania"];
		for (const mode of gameModes) {
			try {

				const qualifiedBeatmaps = await v2.beatmaps.search({
					mode: Tools.modeConvertSearch(mode),
					section: "qualified"
				});
				if (qualifiedBeatmaps.beatmapsets == undefined) continue;
				let qfarray = [];
				for (let i = 0; i < Math.min(qualifiedBeatmaps.beatmapsets.length, 15); i++) {
					qfarray.push(qualifiedBeatmaps.beatmapsets[i].id);
				}
				let allBeatmaps = fs.readJsonSync("./ServerDatas/Beatmaps/Beatmaps.json");
				const differentQFarray = Tools.findDifferentElements(allBeatmaps.Qualified[mode], qfarray);
				allBeatmaps.Qualified[mode] = qfarray;
				fs.writeJsonSync("./ServerDatas/Beatmaps/Beatmaps.json", allBeatmaps, { spaces: 4, replacer: null });
				allBeatmaps = null;
				if (differentQFarray == null) continue;
				for (const differentQF of differentQFarray) {
					let parsedjson = fs.readJsonSync(`./ServerDatas/Beatmaps/${mode}.json`);
					let foundflag = false;
					for (const element of parsedjson) {
						if (element.id == differentQF && !foundflag) {
							foundflag = true;
							element.qfdate = new Date();
							element.rankeddate = "-";
							fs.writeJsonSync(`./ServerDatas/Beatmaps/${mode}.json`, parsedjson, { spaces: 4, replacer: null });
							break;
						}
					}

					if (!foundflag) {
						parsedjson.push({
							id: differentQF,
							qfdate: new Date(),
							rankeddate: "-"
						});
						fs.writeJsonSync(`./ServerDatas/Beatmaps/${mode}.json`, parsedjson, { spaces: 4, replacer: null });
					}
					parsedjson = null;

					let QFBeatmapsMaxSrId;
					let QFBeatmapsMinSrId;
					let nominators = [];
					await v2.beatmap.set.details(differentQF).then(res => {
						res.current_nominations.forEach(async element => {
							try {
								const userId = element.user_id;
								const userData = await v2.user.details(userId, Tools.modeConvertSearch(mode), "id");
								nominators.push({
									username: userData.username,
									rank: userData.statistics.global_rank
								});
							} catch (e) {
								nominators.push({
									username: "Unknown",
									rank: "Unknown"
								});
							}
						});
						const array = res.beatmaps;
						array.sort((a, b) => a.difficulty_rating - b.difficulty_rating);
						const maxRatingObj = array[array.length - 1];
						const minRatingObj = array[0];
						QFBeatmapsMaxSrId = maxRatingObj.id;
						QFBeatmapsMinSrId = minRatingObj.id;
					});

					if (QFBeatmapsMaxSrId == undefined || QFBeatmapsMinSrId == undefined) continue;

					const mapMaxInfo = await new osuLibrary.GetMapData(QFBeatmapsMaxSrId, apikey, Tools.modeConvertMap(mode)).getData();
					const mapMinInfo = await new osuLibrary.GetMapData(QFBeatmapsMinSrId, apikey, Tools.modeConvertMap(mode)).getData();

					const maxCalculator = new osuLibrary.CalculatePPSR(QFBeatmapsMaxSrId, 0, Tools.modeConvertMap(mode));
					const minCalculator = new osuLibrary.CalculatePPSR(QFBeatmapsMinSrId, 0, Tools.modeConvertMap(mode));
					const maxsrpp = await maxCalculator.calculateSR();
					const minsrpp = await minCalculator.calculateSR();
					const maxdtpp = await maxCalculator.calculateDT();
					const mindtpp = await minCalculator.calculateDT();

					const BPM = `${mapMaxInfo.bpm}BPM (DT ${Math.round(Number(mapMaxInfo.bpm) * 1.5)}BPM)`;
					const maxCombo = mapMaxInfo.max_combo;
					const minCombo = mapMinInfo.max_combo;
					let Objectstring = minCombo == maxCombo ? `${maxCombo}` : `${minCombo} ~ ${maxCombo}`;
					const lengthsec = mapMaxInfo.hit_length;
					const lengthsecDT = Math.round(Number(mapMaxInfo.hit_length) / 1.5);
					const maptime = Tools.formatTime(lengthsec);
					const maptimeDT = Tools.formatTime(lengthsecDT);
					const maptimestring = `${maptime} (DT ${maptimeDT})`;

					const now = new Date();
					const month = now.getMonth() + 1;
					const day = now.getDate();
					const hours = now.getHours();
					const minutes = now.getMinutes();
					const dateString = `${month}月${day}日 ${Tools.formatNumber(hours)}時${Tools.formatNumber(minutes)}分`;

					let qfparsedjson = fs.readJsonSync(`./ServerDatas/Beatmaps/${mode}.json`);
					const averagearray = [];
					for (const element of qfparsedjson) {
						const qfdate = new Date(element.qfdate);
						if (element.rankeddate == "-") continue;
						const rankeddate = new Date(element.rankeddate);
						const rankeddays = Math.floor((rankeddate - qfdate) / (1000 * 60 * 60 * 24));
						if (rankeddays <= 5 || rankeddays >= 8) continue;
						averagearray.push(rankeddate - qfdate);
					}
					qfparsedjson = null;
					let average = averagearray.reduce((sum, element) => sum + element, 0) / averagearray.length;
					if (isNaN(average)) average = 604800000;

					const sevenDaysLater = new Date(now.getTime() + average);
					const rankedmonth = sevenDaysLater.getMonth() + 1;
					const rankedday = sevenDaysLater.getDate();
					const rankedhours = sevenDaysLater.getHours();
					const rankedminutes = sevenDaysLater.getMinutes();
					const rankeddateString = `${rankedmonth}月${rankedday}日 ${Tools.formatNumber(rankedhours)}時${Tools.formatNumber(rankedminutes)}分`;

					let srstring = maxsrpp.sr == minsrpp.sr ? `★${maxsrpp.sr.toFixed(2)} (DT ★${maxdtpp.sr.toFixed(2)})` : `★${minsrpp.sr.toFixed(2)} ~ ${maxsrpp.sr.toFixed(2)} (DT ★${mindtpp.sr.toFixed(2)} ~ ${maxdtpp.sr.toFixed(2)})`;
					let ppstring = maxsrpp.pp == minsrpp.pp ? `${maxsrpp.pp.toFixed(2)}pp (DT ${maxdtpp.pp.toFixed(2)}pp)` : `${minsrpp.pp.toFixed(2)} ~ ${maxsrpp.pp.toFixed(2)}pp (DT ${mindtpp.pp.toFixed(2)} ~ ${maxdtpp.pp.toFixed(2)}pp)`;

					let nominatorString = "";
					for (const nominator of nominators) {
						nominatorString += `**${nominator.username}** (#${nominator.rank})\n`;
					}
					const embed = new EmbedBuilder()
						.setColor("Blue")
						.setAuthor({ name: `🎉New Qualified ${mode} Map🎉` })
						.setTitle(`${mapMaxInfo.artist} - ${mapMaxInfo.title} by ${mapMaxInfo.creator}`)
						.setDescription(`**Download**: [Map](https://osu.ppy.sh/beatmapsets/${mapMaxInfo.beatmapset_id}) | [Nerinyan](https://api.nerinyan.moe/d/${mapMaxInfo.beatmapset_id}) | [Nerinyan (No Vid)](https://api.nerinyan.moe/d/${mapMaxInfo.beatmapset_id}?nv=1) | [Beatconnect](https://beatconnect.io/b/${mapMaxInfo.beatmapset_id})`)
						.setThumbnail(`https://b.ppy.sh/thumb/${mapMaxInfo.beatmapset_id}l.jpg`)
						.setURL(`https://osu.ppy.sh/beatmapsets/${mapMaxInfo.beatmapset_id}`)
						.addFields({ name: "`Mapinfo`", value: `BPM: **${BPM}**\nLength: **${maptimestring}**\nCombo: **${Objectstring}**`, inline: true })
						.addFields({ name: "`Beatmap Nominator`", value: nominatorString, inline: true })
						.addFields({ name: "`SR`", value: `**${srstring}**`, inline: false })
						.addFields({ name: "`PP`", value: `**${ppstring}**`, inline: false })
						.addFields({ name: "`Qualified 日時`", value: `**${dateString}**`, inline: true })
						.addFields({ name: "`Ranked 日時(予測)`", value: `**${rankeddateString}**`, inline: true });
					let MapcheckChannels = fs.readJsonSync(`./ServerDatas/MapcheckChannels.json`);
					for (const element of MapcheckChannels.Qualified[mode]) {
						try {
							const channel = client.channels.cache.get(element);
							if (channel == undefined) continue;
							await channel.send({ embeds: [embed] });
							const membersdata = await channel.guild.members.fetch();
							let mentionstring = [];
							let allUser = fs.readJsonSync(`./ServerDatas/MentionUser.json`);
							const mentionUser = allUser["Qualified"][element]?.[mode];
							allUser = null;
							if (mentionUser == undefined) continue;
							for (const user of mentionUser) {
								console.log(user);
								if (membersdata.get(user) == undefined) continue;
								mentionstring.push(`<@${user}>`);
							}
							if (mentionstring.length != 0) {
								await channel.send(`${mentionstring.join(" ")}\n新しい${mode}のQualified譜面が出ました！`);
							}
						} catch (e) {
							console.log(e);
							continue;
						}
					}
					MapcheckChannels = null;
				}
			} catch (e) {
				console.log(e);
				continue;
			}
		}
		resolve();
	});
}

function checkranked() {
	return new Promise (async resolve => {
		const gameModes = ["osu", "taiko", "catch", "mania"];
		for (const mode of gameModes) {
			const rankedDataList = await v2.beatmaps.search({
				mode: Tools.modeConvertSearch(mode),
				section: "ranked"
			});
			if (rankedDataList.beatmapsets == undefined) continue;
			let rankedarray = [];
			for (let i = 0; i < Math.min(rankedDataList.beatmapsets.length, 15); i++) {
				rankedarray.push(rankedDataList.beatmapsets[i].id);
			}
			let allBeatmaps = fs.readJsonSync("./ServerDatas/Beatmaps/Beatmaps.json");
			const differentrankedarray = Tools.findDifferentElements(allBeatmaps.Ranked[mode], rankedarray);
			allBeatmaps.Ranked[mode] = rankedarray;
			fs.writeJsonSync("./ServerDatas/Beatmaps/Beatmaps.json", allBeatmaps, { spaces: 4, replacer: null });
			allBeatmaps = null;
			if (differentrankedarray == null) continue;
			for (const differentranked of differentrankedarray) {
				try {
					let beatmapData = fs.readJsonSync(`./ServerDatas/Beatmaps/${mode}.json`);
					let errorMessage = "取得できませんでした";
					for (const element of beatmapData) {
						if (element.id == differentranked) {
							element.rankeddate = new Date();
							fs.writeJsonSync(`./ServerDatas/Beatmaps/${mode}.json`, beatmapData, { spaces: 4, replacer: null });
							const qfdate = new Date(element.qfdate);
							const rankeddate = new Date(element.rankeddate);
							const timeDifference = rankeddate - qfdate;
							const oneDay = 24 * 60 * 60 * 1000;
							const oneHour = 60 * 60 * 1000;
							const oneMinute = 60 * 1000;
							const sevenDays = 7 * oneDay;
							const diff = sevenDays - timeDifference;
							const sign = diff < 0 ? "+" : "-";
							const absDiff = Math.abs(diff);
							const days = Math.floor(absDiff / oneDay);
							const hours = Math.floor((absDiff % oneDay) / oneHour);
							const minutes = Math.floor((absDiff % oneHour) / oneMinute);
							if (days == 0 && hours == 0) {
								errorMessage = `${sign} ${minutes}分`;
							} else if (days == 0 && hours != 0) {
								errorMessage = `${sign} ${hours}時間 ${minutes}分`;
							} else {
								errorMessage = `${sign} ${days}日 ${hours}時間 ${minutes}分`;
							}
							break;
						}
					}
					beatmapData = null;

					let rankedBeatmapsMaxSrId;
					let rankedBeatmapsMinSrId;
					let nominators = [];
					await v2.beatmap.set.details(differentranked).then(res => {
						res.current_nominations.forEach(async element => {
							try {
								const userId = element.user_id;
								const userData = await v2.user.details(userId, Tools.modeConvertSearch(mode), "id");
								nominators.push({
									username: userData.username,
									rank: userData.statistics.global_rank
								});
							} catch (e) {
								nominators.push({
									username: "Unknown",
									rank: "Unknown"
								});
							}
						});
						const array = res.beatmaps;
						array.sort((a, b) => a.difficulty_rating - b.difficulty_rating);
						const maxRatingObj = array[array.length - 1];
						const minRatingObj = array[0];
						rankedBeatmapsMaxSrId = maxRatingObj.id;
						rankedBeatmapsMinSrId = minRatingObj.id;
					});
					if (rankedBeatmapsMaxSrId == undefined || rankedBeatmapsMinSrId == undefined) continue;

					const mapMaxInfo = await new osuLibrary.GetMapData(rankedBeatmapsMaxSrId, apikey, Tools.modeConvertMap(mode)).getData();
					const mapMinInfo = await new osuLibrary.GetMapData(rankedBeatmapsMinSrId, apikey, Tools.modeConvertMap(mode)).getData();

					const maxCalculator = new osuLibrary.CalculatePPSR(rankedBeatmapsMaxSrId, 0, Tools.modeConvertMap(mode));
					const minCalculator = new osuLibrary.CalculatePPSR(rankedBeatmapsMinSrId, 0, Tools.modeConvertMap(mode));
					const maxsrpp = await maxCalculator.calculateSR();
					const minsrpp = await minCalculator.calculateSR();
					const maxdtpp = await maxCalculator.calculateDT();
					const mindtpp = await minCalculator.calculateDT();

					const BPM = `${mapMaxInfo.bpm}BPM (DT ${Math.round(Number(mapMaxInfo.bpm) * 1.5)}BPM)`;
					const maxCombo = mapMaxInfo.max_combo;
					const minCombo = mapMinInfo.max_combo;
					let Objectstring = minCombo == maxCombo ? `${maxCombo}` : `${minCombo} ~ ${maxCombo}`;
					const lengthsec = mapMaxInfo.hit_length;
					const lengthsecDT = Math.round(Number(mapMaxInfo.hit_length) / 1.5);
					const maptime = Tools.formatTime(lengthsec);
					const maptimeDT = Tools.formatTime(lengthsecDT);
					const maptimestring = `${maptime} (DT ${maptimeDT})`;

					const now = new Date();
					const month = now.getMonth() + 1;
					const day = now.getDate();
					const hours = now.getHours();
					const minutes = now.getMinutes();
					const dateString = `${month}月${day}日 ${Tools.formatNumber(hours)}時${Tools.formatNumber(minutes)}分`;

					let srstring = maxsrpp.sr == minsrpp.sr ? `★${maxsrpp.sr.toFixed(2)} (DT ★${maxdtpp.sr.toFixed(2)})` : `★${minsrpp.sr.toFixed(2)} ~ ${maxsrpp.sr.toFixed(2)} (DT ★${mindtpp.sr.toFixed(2)} ~ ${maxdtpp.sr.toFixed(2)})`;
					let ppstring = maxsrpp.pp == minsrpp.pp ? `${maxsrpp.pp.toFixed(2)}pp (DT ${maxdtpp.pp.toFixed(2)}pp)` : `${minsrpp.pp.toFixed(2)} ~ ${maxsrpp.pp.toFixed(2)}pp (DT ${mindtpp.pp.toFixed(2)} ~ ${maxdtpp.pp.toFixed(2)}pp)`;

					let nominatorString = "";
					for (const nominator of nominators) {
						nominatorString += `**${nominator.username}** (#${nominator.rank})\n`;
					}

					const embed = new EmbedBuilder()
						.setColor("Yellow")
						.setAuthor({ name: `🎉New Ranked ${mode} Map🎉` })
						.setTitle(`${mapMaxInfo.artist} - ${mapMaxInfo.title} by ${mapMaxInfo.creator}`)
						.setDescription(`**Download**: [Map](https://osu.ppy.sh/beatmapsets/${mapMaxInfo.beatmapset_id}) | [Nerinyan](https://api.nerinyan.moe/d/${mapMaxInfo.beatmapset_id}) | [Nerinyan (No Vid)](https://api.nerinyan.moe/d/${mapMaxInfo.beatmapset_id}?nv=1) | [Beatconnect](https://beatconnect.io/b/${mapMaxInfo.beatmapset_id})`)
						.setThumbnail(`https://b.ppy.sh/thumb/${mapMaxInfo.beatmapset_id}l.jpg`)
						.setURL(`https://osu.ppy.sh/beatmapsets/${mapMaxInfo.beatmapset_id}`)
						.addFields({ name: "`Mapinfo`", value: `BPM: **${BPM}**\nLength: **${maptimestring}**\nCombo: **${Objectstring}**`, inline: true })
						.addFields({ name: "`Beatmap Nominator`", value: nominatorString, inline: true })
						.addFields({ name: "`SR`", value: `**${srstring}**`, inline: false })
						.addFields({ name: "`PP`", value: `**${ppstring}**`, inline: false })
						.addFields({ name: "`Ranked 日時`", value: `**${dateString}** (誤差: **${errorMessage}**)`, inline: true });
					let MapcheckChannels = fs.readJsonSync(`./ServerDatas/MapcheckChannels.json`);
					for (const element of MapcheckChannels.Qualified[mode]) {
						try {
							const channel = client.channels.cache.get(element);
							if (channel == undefined) continue;
							await channel.send({ embeds: [embed] });
							const membersdata = await channel.guild.members.fetch();
							let mentionstring = [];
							let allUser = fs.readJsonSync(`./ServerDatas/MentionUser.json`);
							const mentionUser = allUser["Ranked"][element]?.[mode];
							allUser = null;
							if (mentionUser == undefined) continue;
							for (const user of mentionUser) {
								console.log(user);
								if (membersdata.get(user) == undefined) continue;
								mentionstring.push(`<@${user}>`);
							}
							if (mentionstring.length != 0) {
								await channel.send(`${mentionstring.join(" ")}\n新しい${mode}のRanked譜面が出ました！`);
							}
						} catch (e) {
							console.log(e);
							continue;
						}
					}
					MapcheckChannels = null;
				} catch (e) {
					console.log(e);
					continue;
				}
			}
		}
		resolve();
	});
}

function checkloved() {
	return new Promise(async resolve => {
		const gameModes = ["osu", "taiko", "catch", "mania"];
		for (const mode of gameModes) {
			const lovedDataList = await v2.beatmaps.search({
				mode: Tools.modeConvertSearch(mode),
				section: "loved"
			});
			if (lovedDataList.beatmapsets == undefined) continue;
			let lovedarray = [];
			for (let i = 0; i < Math.min(lovedDataList.beatmapsets.length, 15); i++) {
				lovedarray.push(lovedDataList.beatmapsets[i].id);
			}
			let beatmapData = fs.readJsonSync("./ServerDatas/Beatmaps/Beatmaps.json");
			const differentlovedarray = Tools.findDifferentElements(beatmapData.Loved[mode], lovedarray);
			beatmapData.Loved[mode] = lovedarray;
			fs.writeJsonSync("./ServerDatas/Beatmaps/Beatmaps.json", beatmapData, { spaces: 4, replacer: null });
			beatmapData = null;
			if (differentlovedarray == null) continue;
			for (const differentloved of differentlovedarray) {
				try {
					let maxStarRatingOfLovedBeatmaps;
					let minStarRatingofLovedMaps;
					await v2.beatmap.set.details(differentloved).then(res => {
						const array = res.beatmaps;
						array.sort((a, b) => a.difficulty_rating - b.difficulty_rating);
						const maxRatingObj = array[array.length - 1];
						const minRatingObj = array[0];
						maxStarRatingOfLovedBeatmaps = maxRatingObj.id;
						minStarRatingofLovedMaps = minRatingObj.id;
					});
					if (maxStarRatingOfLovedBeatmaps == undefined || minStarRatingofLovedMaps == undefined) continue;

					const mapMaxInfo = await new osuLibrary.GetMapData(maxStarRatingOfLovedBeatmaps, apikey, Tools.modeConvertMap(mode)).getData();
					const mapMinInfo = await new osuLibrary.GetMapData(minStarRatingofLovedMaps, apikey, Tools.modeConvertMap(mode)).getData();

					const maxCalculator = new osuLibrary.CalculatePPSR(maxStarRatingOfLovedBeatmaps, 0, Tools.modeConvertMap(mode));
					const minCalculator = new osuLibrary.CalculatePPSR(minStarRatingofLovedMaps, 0, Tools.modeConvertMap(mode));
					const maxsrpp = await maxCalculator.calculateSR();
					const minsrpp = await minCalculator.calculateSR();
					const maxdtpp = await maxCalculator.calculateDT();
					const mindtpp = await minCalculator.calculateDT();

					const BPM = `${mapMaxInfo.bpm}BPM (DT ${Math.round(Number(mapMaxInfo.bpm) * 1.5)}BPM)`;
					const maxCombo = mapMaxInfo.max_combo;
					const minCombo = mapMinInfo.max_combo;
					let Objectstring = minCombo == maxCombo ? `${maxCombo}` : `${minCombo} ~ ${maxCombo}`;
					const lengthsec = mapMaxInfo.hit_length;
					const lengthsecDT = Math.round(Number(mapMaxInfo.hit_length) / 1.5);
					const formattedTime = Tools.formatTime(lengthsec);
					const maptimeDT = Tools.formatTime(lengthsecDT);
					const maptimestring = `${formattedTime} (DT ${maptimeDT})`;

					const now = new Date();
					const month = now.getMonth() + 1;
					const day = now.getDate();
					const hours = now.getHours();
					const minutes = now.getMinutes();
					const dateString = `${month}月${day}日 ${Tools.formatNumber(hours)}時${Tools.formatNumber(minutes)}分`;

					let srstring = maxsrpp.sr == minsrpp.sr ? `★${maxsrpp.sr.toFixed(2)} (DT ★${maxdtpp.sr.toFixed(2)})` : `★${minsrpp.sr.toFixed(2)} ~ ${maxsrpp.sr.toFixed(2)} (DT ★${mindtpp.sr.toFixed(2)} ~ ${maxdtpp.sr.toFixed(2)})`;

					const embed = new EmbedBuilder()
						.setColor("Blue")
						.setAuthor({ name: `💓New Loved ${mode} Map💓` })
						.setTitle(`${mapMaxInfo.artist} - ${mapMaxInfo.title} by ${mapMaxInfo.creator}`)
						.setDescription(`**Download**: [Map](https://osu.ppy.sh/beatmapsets/${mapMaxInfo.beatmapset_id}) | [Nerinyan](https://api.nerinyan.moe/d/${mapMaxInfo.beatmapset_id}) | [Nerinyan (No Vid)](https://api.nerinyan.moe/d/${mapMaxInfo.beatmapset_id}?nv=1) | [Beatconnect](https://beatconnect.io/b/${mapMaxInfo.beatmapset_id})`)
						.setThumbnail(`https://b.ppy.sh/thumb/${mapMaxInfo.beatmapset_id}l.jpg`)
						.setURL(`https://osu.ppy.sh/beatmapsets/${mapMaxInfo.beatmapset_id}`)
						.addFields({ name: "`Mapinfo`", value: `BPM: **${BPM}**\nLength: **${maptimestring}**\nCombo: **${Objectstring}**`, inline: true })
						.addFields({ name: "`SR`", value: `**${srstring}**`, inline: false })
						.addFields({ name: "`loved 日時`", value: `**${dateString}**`, inline: true });
					let MapcheckChannels = fs.readJsonSync(`./ServerDatas/MapcheckChannels.json`);
					for (const element of MapcheckChannels.Loved[mode]) {
						try {
							const channel = client.channels.cache.get(element);
							if (channel == undefined) continue;
							await channel.send({ embeds: [embed] });
							const membersdata = await channel.guild.members.fetch();
							let mentionstring = [];
							let allUser = fs.readJsonSync(`./ServerDatas/MentionUser.json`);
							const mentionUser = allUser["Loved"][element]?.[mode];
							allUser = null;
							if (mentionUser == undefined) continue;
							for (const user of mentionUser) {
								console.log(user);
								if (membersdata.get(user) == undefined) continue;
								mentionstring.push(`<@${user}>`);
							}
							if (mentionstring.length != 0) {
								await channel.send(`${mentionstring.join(" ")}\n新しい${mode}のLoved譜面が出ました！`);
							}
						} catch (e) {
							console.log(e);
							continue;
						}
					}
					MapcheckChannels = null;
				} catch (e) {
					console.log(e);
					continue;
				}
			}
		}
		resolve();
	})
}

async function rankedintheday() {
	const gameModes = ["osu", "taiko", "catch", "mania"];
	for (const mode of gameModes) {
		let beatmapJson = fs.readJsonSync(`./ServerDatas/Beatmaps/${mode}.json`);
		const now = new Date();
		const lastWeekDate = new Date();
		lastWeekDate.setDate(lastWeekDate.getDate() - 7);
		const formattedDate = `${lastWeekDate.getFullYear()}-${lastWeekDate.getMonth() + 1}-${lastWeekDate.getDate()}`;
		let previousWeekQueries = [];
		let count = 0;
		for (const element of beatmapJson) {
			if (count >= 10) break;
			try {
				const qfDateTime = new Date(element.qfdate);
				const qfFormattedDate = `${qfDateTime.getFullYear()}-${qfDateTime.getMonth() + 1}-${qfDateTime.getDate()}`;
				if (qfFormattedDate == formattedDate) {
					if (element.rankeddate != "-") continue;
					count++;
					const date = new Date(element.qfdate);
					const year = date.getFullYear();
					const month = date.getMonth() + 1;
					const day = date.getDate();
					const hours = date.getHours();
					const minutes = date.getMinutes();

					let MaxSrIdForQFBeatmaps;
					let MinSrIdBeatmapsQF;
					await v2.beatmap.set.details(element.id).then(res => {
						const beatmapsArray = res.beatmaps;
						beatmapsArray.sort((a, b) => a.difficulty_rating - b.difficulty_rating);
						const highestRatingObj = beatmapsArray[beatmapsArray.length - 1];
						const minimumRatingObject = beatmapsArray[0];
						MaxSrIdForQFBeatmaps = highestRatingObj.id;
						MinSrIdBeatmapsQF = minimumRatingObject.id;
					});
					if (MaxSrIdForQFBeatmaps == undefined || MinSrIdBeatmapsQF == undefined) continue;

					const mapInformation = await new osuLibrary.GetMapData(MaxSrIdForQFBeatmaps, apikey, Tools.modeConvertMap(mode)).getData();

					const osuMaxPPCalculator = new osuLibrary.CalculatePPSR(MaxSrIdForQFBeatmaps, 0, Tools.modeConvertMap(mode));
					const osuMinPPCalculator = new osuLibrary.CalculatePPSR(MinSrIdBeatmapsQF, 0, Tools.modeConvertMap(mode));
					const maxStarRatingPPSR = await osuMaxPPCalculator.calculateSR();
					const minStarRatingPPSR = await osuMinPPCalculator.calculateSR();
					const maxdtpp = await osuMaxPPCalculator.calculateDT();
					const mindtpp = await osuMinPPCalculator.calculateDT();
					let srString = maxStarRatingPPSR.sr == minStarRatingPPSR.sr ? `★${maxStarRatingPPSR.sr.toFixed(2)} (DT ★${maxdtpp.sr.toFixed(2)})` : `★${minStarRatingPPSR.sr.toFixed(2)} ~ ${maxStarRatingPPSR.sr.toFixed(2)} (DT ★${mindtpp.sr.toFixed(2)} ~ ${maxdtpp.sr.toFixed(2)})`;
					let ppString = maxStarRatingPPSR.pp == minStarRatingPPSR.pp ? `${maxStarRatingPPSR.pp.toFixed(2)}pp (DT ${maxdtpp.pp.toFixed(2)}pp)` : `${minStarRatingPPSR.pp.toFixed(2)} ~ ${maxStarRatingPPSR.pp.toFixed(2)}pp (DT ${mindtpp.pp.toFixed(2)} ~ ${maxdtpp.pp.toFixed(2)}pp)`;
					previousWeekQueries.push({ name : `${count}. **${mapInformation.title} - ${mapInformation.artist}**`, value : `▸Mapped by **${mapInformation.creator}**\n▸SR: ${srString}\n▸PP: ${ppString}\n▸**Download** | [Map](https://osu.ppy.sh/beatmapsets/${element.id}) | [Nerinyan](https://api.nerinyan.moe/d/${element.id}) | [Nerinyan (No Vid)](https://api.nerinyan.moe/d/${element.id}?nv=1) | [Beatconnect](https://beatconnect.io/b/${element.id})\n**Qualified**: ${year}年 ${month}月 ${day}日 ${Tools.formatNumber(hours)}:${Tools.formatNumber(minutes)}\n` });
				}
			} catch (e) {
				console.log(e);
				continue;
			}
		}
		beatmapJson = null;

		if (previousWeekQueries.length == 0) previousWeekQueries.push({ name : `**今日Ranked予定の${mode}譜面はありません**`, value : `チェック日時: ${now.getFullYear()}年 ${now.getMonth() + 1}月 ${now.getDate()}日 ${Tools.formatNumber(now.getHours())}:${Tools.formatNumber(now.getMinutes())}` });

		const embed = new EmbedBuilder()
			.setColor("Yellow")
			.setAuthor({ name: `🎉Daily Ranked Check🎉` })
			.setTitle(`日付が変わりました！今日Ranked予定の${mode}マップのリストです！`)
			.addFields(previousWeekQueries)
			.setFooter({ text: `このメッセージは毎日0時に送信されます(最大10マップ)。既にRankedされた譜面は表示されません。` });
		let MapCheckChannels = fs.readJsonSync(`./ServerDatas/MapcheckChannels.json`);
		for (const element of MapCheckChannels.Qualified[mode]) {
			try {
                const channel = client.channels.cache?.get(element);
				if (channel == undefined) continue;
				await channel.send({ embeds: [embed] });
			} catch {
				continue;
			}
		}
		MapCheckChannels = null;
	}
}

async function makeBackup() {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const day = now.getDate();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const dateString = `${year}-${month}-${day} ${hours} ${minutes}`;
	fs.mkdirSync(`./Backups/${dateString}`);
	fs.copySync("./ServerDatas", `./Backups/${dateString}`);
}

const login = async () => await auth.login(osuclientid, osuclientsecret, ["public", "identify"]);

(async () => {
	await login();
	setInterval(async () => {
		await login();
	}, 600000);
})();

client.login(token);
