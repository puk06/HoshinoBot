const { SlashCommandBuilder } = require("./node_modules/discord.js");
const fs = require("./node_modules/fs-extra");

module.exports = [
    {
        data: new SlashCommandBuilder()
            .setName("coin")
            .setDescription("スロット用のメダルをコインに換金できます。")
            .addNumberOption(option =>
                option
                    .setName("medal")
                    .setDescription("交換したいメダルの枚数")
                    .setRequired(true)
            )
            .addNumberOption(option =>
                option
                    .setName("type")
                    .setDescription("5か20コインスロットを選択できます。")
                    .setRequired(true)
                    .addChoices(
                        { name: "5コイン", value: 5 },
                        { name: "20コイン", value: 20 }
                    )
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("medal")
            .setDescription("コインをスロット用のメダルに交換できます。")
            .addNumberOption(option =>
                option
                    .setName("coin")
                    .setDescription("交換したいコインの枚数")
                    .setRequired(true)
            )
            .addNumberOption(option =>
                option
                    .setName("type")
                    .setDescription("5か20コインスロットを選択できます。")
                    .setRequired(true)
                    .addChoices(
                        { name: "5コイン", value: 5 },
                        { name: "20コイン", value: 20 }
                    )
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("coinshop")
            .setDescription("コインでランクを買うことができます。")
            .addStringOption(option =>
                option
                    .setName("rank")
                    .setDescription("購入したいランクを選択してください。")
                    .setRequired(true)
                    .addChoices(
                        { name: "VIP(50000コイン)", value: "VIP" },
                        { name: "VIP+(80000コイン)", value: "VIP+" },
                        { name: "MVP(120000コイン)", value: "MVP" },
                        { name: "MVP+(250000コイン)", value: "MVP+" },
                        { name: "MVP++(800000コイン)", value: "MVP++" }
                    )
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("join")
            .setDescription("そのチャンネル内で行われているカジノゲームに参加します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("leave")
            .setDescription("そのチャンネル内で行われているカジノゲームから退出します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("cancel")
            .setDescription("そのチャンネル内で行われているカジノゲームをキャンセルします。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("addbot")
            .setDescription("そのチャンネル内で行われているカジノゲームにBOTを参加させます。対応してるものが限られています。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("slotsetting")
            .setDescription("スロットの設定を表示します。管理者専用です。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("slot")
            .setDescription("ジャグラーを起動します。")
            .addNumberOption(option =>
                option
                    .setName("type")
                    .setDescription("5か20コインスロットを選択できます。")
                    .setRequired(true)
                    .addChoices(
                        { name: "5コイン", value: 5 },
                        { name: "20コイン", value: 20 }
                    )
            )
            .addNumberOption(option =>
                option
                    .setName("auto")
                    .setDescription("自動でスロットを回します。")
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("coinflip")
            .setDescription("コインフリップを開始します。")
            .addNumberOption(option =>
                option
                    .setName("bet")
                    .setDescription("賭ける金額")
                    .setRequired(true)
            )
            .addNumberOption(option =>
                option
                    .setName("rank")
                    .setDescription("指定したRank以上の者のみ限定にします。")
                    .addChoices(
                        { name: "VIP", value: 1 },
                        { name: "VIP+", value: 2 },
                        { name: "MVP", value: 3 },
                        { name: "MVP+", value: 4 },
                        { name: "MVP++", value: 5 }
                    )
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("bankranking")
            .setDescription("銀行口座残高の桁数ランキングを表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("lv")
            .setDescription("カジノのレベルを表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("bank")
            .setDescription("現在の銀行口座残高を表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("regcasino")
            .setDescription("カジノに登録できます。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("send")
            .setDescription("指定したユーザーにお金を送ります。")
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("送りたい人の名前")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addNumberOption(option =>
                option
                    .setName("amount")
                    .setDescription("送りたい金額")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("dice")
            .setDescription("さいころを振ります。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("roulette")
            .setDescription("ルーレットを回します。赤か黒を出します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("kemo")
            .setDescription("保存されたFurry画像をランダムで表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("kemodelete")
            .setDescription("Furryフォルダから指定された画像を削除します。")
            .addNumberOption(option =>
                option
                    .setName("count")
                    .setDescription("削除したい画像のカウント")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("kemocount")
            .setDescription("Furryフォルダの総ファイル数を表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("pic")
            .setDescription("指定されたタグの画像をランダムで表示します。")
            .addStringOption(option =>
                option
                    .setName("tag")
                    .setDescription("タグ名")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("settag")
            .setDescription("このチャンネルをpicタグに設定します。")
            .addStringOption(option =>
                option
                    .setName("name")
                    .setDescription("タグ名")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("deltag")
            .setDescription("このチャンネルをタグから削除します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("delpic")
            .setDescription("指定された画像を削除します。")
            .addNumberOption(option =>
                option
                    .setName("count")
                    .setDescription("削除したい画像のカウント")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("piccount")
            .setDescription("送られたタグの総ファイル数を表示します。")
            .addStringOption(option =>
                option
                    .setName("tag")
                    .setDescription("タグ名")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("alltags")
            .setDescription("全てのタグ一覧を表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("quote")
            .setDescription("指定されたタグの名言を表示します。")
            .addStringOption(option =>
                option
                    .setName("tag")
                    .setDescription("タグ名")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("setquotetag")
            .setDescription("このチャンネルの名言タグを作成、更新します。")
            .addStringOption(option =>
                option
                    .setName("tag")
                    .setDescription("タグ名")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("delquotetag")
            .setDescription("このチャンネルを名言タグから削除します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("delquote")
            .setDescription("指定された名言を削除します。")
            .addStringOption(option =>
                option
                    .setName("quote")
                    .setDescription("削除したい名言")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("quotecount")
            .setDescription("送られた名言タグの総名言数を表示します。")
            .addStringOption(option =>
                option
                    .setName("tag")
                    .setDescription("タグ名")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("allquotetags")
            .setDescription("全ての名言タグ一覧を表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("link")
            .setDescription("リンクが送信されたら、マップ情報を表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("unlink")
            .setDescription("リンクが送信されても、マップ情報は表示しなくなります。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("check")
            .setDescription("送られたマップのオブジェクトに関する情報を計算します。")
            .addStringOption(option =>
                option
                    .setName("beatmaplink")
                    .setDescription("マップリンク")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("ispp")
            .setDescription("PPマップかどうかを表示します。FPという単位で表示されます。")
            .addStringOption(option =>
                option
                    .setName("beatmaplink")
                    .setDescription("マップリンク")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mods")
                    .setDescription("Mod")
                    .setRequired(false)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("lb")
            .setDescription("Mod別ランキングを表示します。")
            .addStringOption(option =>
                option
                    .setName("beatmaplink")
                    .setDescription("マップリンク")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mods")
                    .setDescription("Mod")
                    .setRequired(false)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("qf")
            .setDescription("送られたチャンネルをQF、rankチャンネルに設定します。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("loved")
            .setDescription("送られたチャンネルをLovedチャンネルに設定します。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("qfmention")
            .setDescription("Qualifiedが検出されたらメンションします。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("lovedmention")
            .setDescription("Lovedが検出されたらメンションします。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("rankedmention")
            .setDescription("Rankedが検出されたらメンションします。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("deqf")
            .setDescription("送られたチャンネルをQF、rankチャンネルから削除します。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("deloved")
            .setDescription("送られたチャンネルをLovedチャンネルから削除します。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("deqfmention")
            .setDescription("Qualifiedが検出されたらメンションするのを解除します。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("derankedmention")
            .setDescription("Rankedが検出されたらメンションするのを解除します。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("delovedmention")
            .setDescription("Lovedが検出されたらメンションするのを解除します。")
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("bg")
            .setDescription("送られたマップのBGを表示します。")
            .addStringOption(option =>
                option
                    .setName("beatmaplink")
                    .setDescription("マップリンク")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("ifmod")
            .setDescription("送られたマップのユーザーの最高記録のModを変更してランキングを計算します。")
            .addStringOption(option =>
                option
                    .setName("beatmaplink")
                    .setDescription("マップリンク")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mods")
                    .setDescription("Mod")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("ユーザー名")
                    .setRequired(false)
            )
            .addStringOption(option =>
                option
                    .setName("score")
                    .setDescription("モード")
                    .addChoices(
                        { name: "Top Score", value: "0" },
                        { name: "Top PP", value: "1" }
                    )
                    .setRequired(false)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("srchart")
            .setDescription("送られたマップのSRグラフを表示します。")
            .addStringOption(option =>
                option
                    .setName("beatmaplink")
                    .setDescription("マップリンク")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("preview")
            .setDescription("マップのプレビューリンクを表示します。")
            .addStringOption(option =>
                option
                    .setName("beatmaplink")
                    .setDescription("マップリンク")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("calculatepp")
            .setDescription("送られたosuマップのPPを計算します。")
            .addAttachmentOption(option =>
                option
                    .setName("beatmapfile")
                    .setDescription("マップファイル")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mods")
                    .setDescription("Mod")
                    .setRequired(false)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("osubgquiz")
            .setDescription("送られたユーザー、モードからBGクイズを出題します。")
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("ユーザー名")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("osubgquizpf")
            .setDescription("送られたユーザー、モードからBGクイズを出題します。")
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("ユーザー名")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("osuquiz")
            .setDescription("送られたユーザー、モードからBGクイズを出題します。")
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("ユーザー名")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("osuquizpf")
            .setDescription("送られたユーザー、モードからBGクイズを出題します。")
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("ユーザー名")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("quizend")
            .setDescription("クイズを終了します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("osusearch")
            .setDescription("osu!のビートマップを検索します。")
            .addStringOption(option =>
                option
                    .setName("query")
                    .setDescription("検索したいキーワード")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("mode")
                    .setDescription("モード")
                    .addChoices(
                        { name: "osu!", value: "osu" },
                        { name: "osu!taiko", value: "taiko" },
                        { name: "osu!catch", value: "catch" },
                        { name: "osu!mania", value: "mania" }
                    )
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("osureg")
            .setDescription("osu!のユーザー名をほしのbotに登録します。")
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("ユーザー名")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("slayer")
            .setDescription("スレイヤーの周回数などを表示します。")
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("ユーザー名")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("slayername")
                    .setDescription("スレイヤー名")
                    .addChoices(
                        { name: "Revenant Horror", value: "Revenant Horror" },
                        { name: "Sven Packmaster", value: "Sven Packmaster" },
                        { name: "Voidgloom Seraph", value: "Voidgloom Seraph" },
                        { name: "Inferno Demonlord", value: "Inferno Demonlord" },
                        { name: "Riftstalker Bloodfiend", value: "Riftstalker Bloodfiend" },
                    )
                    .setRequired(true)
            )
            .addNumberOption(option =>
                option
                    .setName("profileid")
                    .setDescription("プロファイルID")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("profile")
            .setDescription("プレイヤーのSkyblockプロファイルを表示します。")
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("ユーザー名")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("ratchecker")
            .setDescription("送られたChattrigger ModuleにRatが含まれているかを確認します。")
            .addAttachmentOption(option =>
                option
                    .setName("file")
                    .setDescription("モジュールファイル(zip)")
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option
                    .setName("output")
                    .setDescription("警告の部分のコードを送信します。")
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("tweetdownloader")
            .setDescription("送られたツイートの動画をダウンロードします。")
            .addStringOption(option =>
                option
                    .setName("link")
                    .setDescription("ツイートリンク")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("skyblockpatch")
            .setDescription("Hypixel Skyblockの最新のパッチノートを表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("loc")
            .setDescription("GitHubのリポジトリのLOCを表示します。")
            .addStringOption(option =>
                option
                    .setName("username")
                    .setDescription("ユーザー名")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("repository")
                    .setDescription("リポジトリ名")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("backup")
            .setDescription("バックアップを復元できます。管理者専用です。")
            .addNumberOption(option =>
                option
                    .setName("backuptime")
                    .setDescription("何時間前のバックアップを復元するか")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("backuplist")
            .setDescription("バックアップの一覧を表示します。管理者専用です。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("backupcreate")
            .setDescription("バックアップを作成します。管理者専用です。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("echo")
            .setDescription("メッセージをあなたの代わりに送信します。")
            .addStringOption(option =>
                option
                    .setName("message")
                    .setDescription("送りたいメッセージ")
                    .setRequired(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("talkcount")
            .setDescription("あなたがどのくらいこのサーバーで喋ったかを表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("talkranking")
            .setDescription("このサーバーでの、話した回数のランキングを表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("talklevel")
            .setDescription("あなたのこのサーバーでの話した回数をレベルを表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("talklevelranking")
            .setDescription("このサーバーでの、話した回数のレベルランキングを表示します。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("update")
            .setDescription("サーバーのファイルを更新します。管理者専用です。")
            .addStringOption(option =>
                option
                    .setName("file")
                    .setDescription("ファイル名")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    },
    {
        data: new SlashCommandBuilder()
            .setName("restart")
            .setDescription("サーバーを再起動します。管理者専用です。")
    },
    {
        data: new SlashCommandBuilder()
            .setName("kawaii")
            .setDescription("いい感じの画像をAPIから取得します。タグ結構あるよ。")
            .addStringOption(option =>
                option
                    .setName("tag")
                    .setDescription("写真のタグ決めれます。色々試してみてね！")
                    .addChoices(
                        { name: "SECONDARY ELEMENT ADAPTIVE", value: "ycy" },
                        { name: "CUTE VERSION ADAPTIVE", value: "moez" },
                        { name: "AI ADAPTIVE", value: "ai" },
                        { name: "GENSHIN IMPACT ADAPTIVE", value: "ysz" },
                        { name: "PC HORIZONTAL MAP", value: "pc" },
                        { name: "CUTE HORIZONTAL MAP", value: "moe"},
                        { name: "LANDSCAPE HORIZONTAL", value: "fj"},
                        { name: "HORIZONTAL IMAGE ON WHITE BACKGROUND", value: "bd"},
                        { name: "ORIGINAL GOD HORIZONTAL MAP", value: "ys"},
                        { name: "ACG ANIMATION", value: "acg"},
                        { name: "MOVE VERTICAL IMAGE", value: "mp"},
                        { name: "CUTE VERTICAL IMAGE", value: "moemp"},
                        { name: "ORIGINAL GOD VERTICAL PICTURE", value: "ysmp"},
                        { name: "AI VERTICAL PICTURE", value: "aimp"},
                        { name: "AVATAR SQUARE PICTURE", value: "tx"},
                        { name: "NANASE KURUMI", value: "lai"},
                        { name: "LITTLE FOX", value: "xhl"}
                    )
                    .setRequired(true)
            )
    },
]
