const Discord = require("discord.js");
require("dotenv").config();
const ls = require("lightstreamer-client");

const NODE3000004 = {2:"STOP",4:"SHUTDOWN",8:"MAINTENANCE",16:"NORMAL",32:"STANDBY",64:"IDLE",128:"SYSTEM INITIALIZED"}


const bot = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildPresences,
  ],
});

const token = process.env.DISCORD_TOKEN;

const lsClient = new ls.LightstreamerClient(
  "https://push.lightstreamer.com",
  "ISSLIVE"
);
const peeConnection = new ls.Subscription(
  "MERGE",
  ["NODE3000005"],
  ["Value"]
);
const pooConnection = new ls.Subscription(
  "MERGE",
  ["NODE3000008"],
  ["Value" /*, "TimeStamp"*/]
);
const tankStateConnection = new ls.Subscription(
    "MERGE",
    ["NODE3000004"],
    ["Value"]
);

let pee = 0;
let poo = 0;
let tankState = "UNDEFINED";

peeConnection.addListener({
  onSubscription: () => {
    console.log("Subscription to peeNode established.");
  },
  onItemUpdate: (updateInfo) => {
    console.log("Received pee update for ISS:", updateInfo.getValue("Value"));
    pee = updateInfo.getValue("Value");
  },
});
pooConnection.addListener({
  onSubscription: () => {
    console.log("Subscription to pooNode established.");
  },
  onItemUpdate: (updateInfo) => {
    console.log("Received poo update from ISS:", updateInfo.getValue("Value"));
    poo = updateInfo.getValue("Value");
  },
});
tankStateConnection.addListener({
    onSubscription: () => {
        console.log("Subscription to tankStateNode established.");
    },
    onItemUpdate: (updateInfo) => {
        console.log("Received tankState update from ISS:", updateInfo.getValue("Value"));
        tankState = updateInfo.getValue("Value");
        if(tankState === "128"){
            bot.channels.cache.forEach(channel => {
                channel.send("@everyone Someone is taking a piss check it out!")
            })
        }
    },
});

lsClient.subscribe(pooConnection);
lsClient.subscribe(peeConnection);
lsClient.subscribe(tankStateConnection);

lsClient.addListener({
  onListenStart: () => {
    console.log("Lightstreamer client listening started.");
  },
  onListenEnd: () => {
    console.log("Lightstreamer client listening ended.");
  },
  onServerError: (errorCode, errorMessage) => {
    console.error(`Lightstreamer server error: ${errorCode} - ${errorMessage}`);
  },
});

lsClient.connect();

bot.on("ready", () => {
  console.log("I am ready!");
});

bot.on("messageCreate", async (message) => {
  if (message.content === "ISS") {
    message.reply(
      "ISS:\n Poop percentage: " +
        Number(poo).toPrecision(3) +
        "%" +
        "\n Pee Percentage is: " +
        Number(pee).toPrecision(3) +
        "%"+ "\n Tank State is: " + NODE3000004[tankState]
    );
  }
});

bot.login(token);
