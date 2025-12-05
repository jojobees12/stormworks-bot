require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

let raidMode = false;
let joinTimestamps = [];
let banVotes = new Map();

client.once("ready", () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
});

// ✅ STAFF LOG FUNCTION
async function logStaffAction(guild, message) {
  const channel = guild.channels.cache.find(c => c.name === "staff-logs");
  if (!channel) return;
  channel.send({ embeds: [new EmbedBuilder().setDescription(message).setColor(0xff0000)] });
}

// ✅ JOIN PROTECTION + ANTI ALT + RAID MODE
client.on("guildMemberAdd", async member => {
  const accountAgeDays =
    (Date.now() - member.user.createdTimestamp) / 86400000;

  if (accountAgeDays < Number(process.env.MIN_ACCOUNT_AGE_DAYS)) {
    await member.kick("Account too new (Anti‑Alt)");
    return logStaffAction(member.guild, `🚫 Auto‑kicked alt: ${member.user.tag}`);
  }

  if (raidMode) {
    joinTimestamps.push(Date.now());
    await member.kick("Raid Mode Active");
    return logStaffAction(member.guild, `🚨 Auto‑kicked during raid: ${member.user.tag}`);
  }
});

// ✅ CAPTCHA VERIFY
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "verify") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("captcha_pass")
        .setLabel("✅ Click to Verify")
        .setStyle(ButtonStyle.Success)
    );
    return interaction.reply({
      content: "Complete captcha to verify:",
      components: [row],
      ephemeral: true
    });
  }

  // ✅ RAID MODE TOGGLE
  if (interaction.commandName === "raidmode") {
    raidMode = !raidMode;
    await logStaffAction(
      interaction.guild,
      `🚨 Raid Mode is now ${raidMode ? "ON" : "OFF"}`
    );
    return interaction.reply(`🚨 Raid Mode is now ${raidMode ? "ON" : "OFF"}`);
  }

  // ✅ BAN VOTE SYSTEM
  if (interaction.commandName === "banvote") {
    const user = interaction.options.getUser("user");
    banVotes.set(user.id, 0);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`yes_${user.id}`)
        .setLabel("✅ Yes")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`no_${user.id}`)
        .setLabel("❌ No")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      embeds: [new EmbedBuilder().setTitle("🛑 Ban Vote Started").setDescription(`Vote to ban **${user.tag}**`)],
      components: [row]
    });
  }
});

// ✅ BUTTON HANDLER (Captcha + Ban Vote)
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  // CAPTCHA PASS
  if (interaction.customId === "captcha_pass") {
    const role = interaction.guild.roles.cache.find(r => r.name === "Verified");
    if (role) await interaction.member.roles.add(role);
    return interaction.reply({ content: "✅ You are verified!", ephemeral: true });
  }

  // BAN VOTE SYSTEM
  if (interaction.customId.startsWith("yes_")) {
    const userId = interaction.customId.split("_")[1];
    banVotes.set(userId, banVotes.get(userId) + 1);

    if (banVotes.get(userId) >= 3) {
      const member = await interaction.guild.members.fetch(userId);
      await member.ban({ reason: "Ban Vote Passed" });
      return logStaffAction(interaction.guild, `🔨 Auto‑banned via vote: ${member.user.tag}`);
    }

    return interaction.reply({ content: "✅ Vote counted", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
