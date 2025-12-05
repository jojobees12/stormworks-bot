require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  REST,
  Routes
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const Database = require("better-sqlite3");
const db = new Database("database.sqlite");

// ==========================
// ✅ ENV CHECK
// ==========================
const { TOKEN, CLIENT_ID, GUILD_ID, MIN_ACCOUNT_AGE_DAYS } = process.env;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.log("❌ Missing .env values");
  process.exit(1);
}

// ==========================
// ✅ DATABASE
// ==========================
db.prepare(`
CREATE TABLE IF NOT EXISTS warnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT,
  reason TEXT,
  moderator TEXT,
  time TEXT
)
`).run();

// ==========================
// ✅ RAID SYSTEM
// ==========================
let raidMode = false;

// ==========================
// ✅ SLASH COMMANDS
// ==========================
const commands = [
  { name: "help", description: "Open help menu" },
  { name: "verify", description: "Verify with captcha" },
  {
    name: "warn",
    description: "Warn a user",
    options: [
      { name: "user", type: 6, description: "User", required: true },
      { name: "reason", type: 3, description: "Reason", required: true }
    ]
  },
  {
    name: "banvote",
    description: "Start a ban vote",
    options: [
      { name: "user", type: 6, description: "User", required: true },
      { name: "reason", type: 3, description: "Reason", required: true }
    ]
  },
  { name: "modlogs", description: "View warnings" },
  { name: "raidmode", description: "Toggle raid mode" }
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("✅ Slash commands loaded");
})();

// ==========================
// ✅ BOT READY
// ==========================
client.once("ready", () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
});

// ==========================
// ✅ INTERACTIONS
// ==========================
client.on("interactionCreate", async interaction => {

  // ---------------- HELP ----------------
  if (interaction.commandName === "help") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 StormWorks Security Bot")
      .setDescription("Choose a category below")
      .setColor(0x00ffcc)
      .addFields(
        { name: "✅ Public", value: "`/help`, `/verify`" },
        { name: "🔒 Staff", value: "`/warn`, `/banvote`, `/modlogs`, `/raidmode`" }
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ---------------- VERIFY (CAPTCHA) ----------------
  if (interaction.commandName === "verify") {
    const a = Math.floor(Math.random() * 10 + 1);
    const b = Math.floor(Math.random() * 10 + 1);
    interaction.reply(`🧠 CAPTCHA: What is **${a} + ${b}**?`);

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });

    collector.on("collect", msg => {
      if (Number(msg.content) === a + b) {
        msg.reply("✅ Verified successfully!");
      } else {
        msg.reply("❌ Failed verification.");
      }
    });
  }

  // ---------------- WARN ----------------
  if (interaction.commandName === "warn") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: "❌ Staff only", ephemeral: true });

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    db.prepare(`INSERT INTO warnings (user, reason, moderator, time) VALUES (?, ?, ?, ?)`)
      .run(user.id, reason, interaction.user.tag, new Date().toLocaleString());

    return interaction.reply(`⚠️ ${user.tag} warned.`);
  }

  // ---------------- MODLOGS ----------------
  if (interaction.commandName === "modlogs") {
    const logs = db.prepare(`SELECT * FROM warnings ORDER BY id DESC LIMIT 5`).all();
    if (!logs.length) return interaction.reply("✅ No logs.");
    return interaction.reply(logs.map(l => `⚠️ ${l.user}: ${l.reason}`).join("\n"));
  }

  // ---------------- BAN VOTE ----------------
  if (interaction.commandName === "banvote") {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`yes_${user.id}`).setLabel("✅ Ban").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`no_${user.id}`).setLabel("❌ No").setStyle(ButtonStyle.Secondary)
    );

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🛑 Ban Vote")
          .setDescription(`Target: **${user.tag}**\nReason: ${reason}`)
          .setColor(0xff0000)
      ],
      components: [row]
    });
  }

  // ---------------- RAID MODE ----------------
  if (interaction.commandName === "raidmode") {
    raidMode = !raidMode;
    interaction.reply(`🚨 Raid Mode: **${raidMode ? "ON" : "OFF"}**`);
  }

  // ---------------- BUTTONS ----------------
  if (interaction.isButton()) {
    if (interaction.customId.startsWith("yes_")) {
      return interaction.reply("✅ Vote counted.");
    }
    if (interaction.customId.startsWith("no_")) {
      return interaction.reply("❌ Vote counted.");
    }
  }

});

// ==========================
// ✅ JOIN PROTECTION
// ==========================
client.on("guildMemberAdd", member => {
  const ageDays = (Date.now() - member.user.createdTimestamp) / 86400000;
  if (ageDays < Number(MIN_ACCOUNT_AGE_DAYS)) {
    member.kick("Anti-alt protection").catch(() => {});
  }

  if (raidMode) {
    member.timeout(60_000).catch(() => {});
  }
});

// ==========================
client.login(TOKEN);
