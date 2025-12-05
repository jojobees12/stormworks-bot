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
const fs = require("fs");

// ✅ CRASH SHIELD
process.on("unhandledRejection", err => console.error("UNHANDLED:", err));
process.on("uncaughtException", err => console.error("UNCAUGHT:", err));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

const STAFF_ROLE = "Staff";
let raidMode = false;
let blacklist = new Set();
let backupData = null;

// ✅ READY
client.once("ready", () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
});

// ✅ STAFF LOGGING
async function logStaff(guild, msg) {
  const channel = guild.channels.cache.find(c => c.name === "staff-logs");
  if (!channel) return;
  channel.send({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(msg)] });
}

// ✅ CHANNEL LOCK / UNLOCK
async function setChannelLock(guild, locked) {
  guild.channels.cache.forEach(async channel => {
    if (!channel.isTextBased()) return;
    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: !locked
      });
    } catch {}
  });
}

// ✅ JOIN PROTECTION
client.on("guildMemberAdd", async member => {
  if (blacklist.has(member.id)) {
    await member.ban({ reason: "Blacklisted User" });
    return logStaff(member.guild, `⛔ Blacklisted auto‑ban: ${member.user.tag}`);
  }

  const age = (Date.now() - member.user.createdTimestamp) / 86400000;
  if (age < Number(process.env.MIN_ACCOUNT_AGE_DAYS)) {
    blacklist.add(member.id);
    await member.kick("Alt Account");
    return logStaff(member.guild, `🚫 Alt detected: ${member.user.tag}`);
  }

  if (raidMode) {
    blacklist.add(member.id);
    await member.kick("Raid Mode");
    return logStaff(member.guild, `🚨 Raid kick: ${member.user.tag}`);
  }
});

// ✅ EMOJI SPAM AUTO PURGE (DELETE + WARN + TIMEOUT)
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const emojiCount = (message.content.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu) || []).length;
  if (emojiCount >= 10) {
    try {
      await message.delete();
      await message.member.timeout(10 * 60 * 1000, "Emoji Spam"); // 10 min
      await logStaff(message.guild, `🚨 Emoji spam timeout: ${message.author.tag}`);
    } catch {}
  }
});

// ✅ INTERACTIONS
client.on("interactionCreate", async interaction => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const isStaff = interaction.member.roles.cache.some(r => r.name === STAFF_ROLE)
      || interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

    // ✅ CAPTCHA VERIFY
    if (interaction.commandName === "verify") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("captcha_pass").setLabel("✅ Verify").setStyle(ButtonStyle.Success)
      );
      return interaction.reply({ content: "Captcha:", components: [row], ephemeral: true });
    }

    // ✅ RAID MODE
    if (interaction.commandName === "raidmode") {
      if (!isStaff) return interaction.reply({ content: "❌ Staff only", ephemeral: true });
      raidMode = !raidMode;
      await setChannelLock(interaction.guild, raidMode);

      const status = raidMode ? "ON — Channels Locked" : "OFF — Channels Unlocked";
      await logStaff(interaction.guild, `🚨 Raid Mode ${status}`);
      return interaction.reply(`🚨 Raid Mode is now **${status}**`);
    }

    // ✅ BACKUP SERVER
    if (interaction.commandName === "backup") {
      if (!isStaff) return interaction.reply({ content: "❌ Staff only", ephemeral: true });

      backupData = {
        roles: interaction.guild.roles.cache.map(r => r.name),
        channels: interaction.guild.channels.cache.map(c => ({
          name: c.name,
          type: c.type
        }))
      };

      fs.writeFileSync("backup.json", JSON.stringify(backupData, null, 2));
      await logStaff(interaction.guild, "💾 Server backup created");
      return interaction.reply("✅ Backup saved.");
    }

    // ✅ RESTORE SERVER
    if (interaction.commandName === "restore") {
      if (!isStaff) return interaction.reply({ content: "❌ Staff only", ephemeral: true });
      if (!fs.existsSync("backup.json")) return interaction.reply("❌ No backup found.");

      const data = JSON.parse(fs.readFileSync("backup.json"));

      for (const ch of data.channels) {
        await interaction.guild.channels.create({ name: ch.name, type: ch.type }).catch(() => {});
      }

      await logStaff(interaction.guild, "♻️ Server restored from backup");
      return interaction.reply("✅ Server restore started.");
    }

    // ✅ BOT RESET
    if (interaction.commandName === "botreset") {
      if (!isStaff) return interaction.reply({ content: "❌ Staff only", ephemeral: true });
      await interaction.reply("♻️ Restarting bot...");
      process.exit(0);
    }

  } catch (err) {
    console.error("COMMAND ERROR:", err);
  }
});

// ✅ BUTTON HANDLER
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "captcha_pass") {
    const role = interaction.guild.roles.cache.find(r => r.name === "Verified");
    if (role) await interaction.member.roles.add(role);
    return interaction.reply({ content: "✅ Verified!", ephemeral: true });
  }
});

// ✅ LOGIN
client.login(process.env.TOKEN);
