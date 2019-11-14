/* SECRET STUFF */
var BotSecret = require("./private.js").BotSecret;
var FirebaseConfig = require("./private.js").FirebaseConfig;
/* ----------- */

// Discord Variables
const Discord = require("discord.js");
const client = new Discord.Client();

// Database Variables 
const firebase = require("firebase/app");
const fs = require("fs");
require("firebase/auth");
require("firebase/firestore");
require("firebase/database");
firebase.initializeApp(FirebaseConfig);
var db = firebase.database();

// Bot Manager Variables
const Ranks = require("./constants").Ranks
const DataField = require("./constants").DataField;
const Game = require("./mania-guesser.js");
const EventEmitter = require('events');
var contents = fs.readFileSync("./song-data.json");
var songData = JSON.parse(contents);
var instances = [];
var users = [];
var guilds = [];

/* METHODS */
// Get Rank Emoji/Name
function getRank(correct){
  for (var i in Ranks){
    if (correct >= Ranks[i].required){
      return Ranks[i];
    }
  }
  return Ranks[Ranks.length-1];
}

// Initialize Users
function initUserQuery(){
  var userquery = firebase.database().ref("users").orderByKey();
  userquery.once("value").then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      console.log("[USERQUERY INIT]: " + childSnapshot.key + " added to query.");
      if (users[childSnapshot.key] === undefined){
        users[childSnapshot.key] = childSnapshot.val();
        if (users[childSnapshot.key] === undefined){
          users[snapshot.key] = { correct : 0, total : 0, hints : 0, songs : {"0" : 0}};
        }
      }
    });
  });
}

// Initialize Guilds
function initGuildQuery(){
  var guildquery = firebase.database().ref("guilds").orderByKey();
  guildquery.once("value").then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      if (guilds[childSnapshot.key] === undefined){
        console.log("[GUILDQUERY INIT]: " + childSnapshot.key + " added to query.");
        guilds[childSnapshot.key] = childSnapshot.val();
      }
    });
  });
}

// Console.Log on Error
function handleError(e, msg = null){
  if (msg === null || msg === undefined)
    console.log("[ERROR]: " + e.message + "\n" + e.stack);
  else
    console.log("[ERROR]: author: " + msg.author.tag + " - contents: " + msg.contents + "\n" + e.message + "\n" + e.stack);
}

// Save User Stats
function saveUserData(user) {
  console.log("[SAVE USER DATA]: Saved stats for user " + user.tag);
  db.ref(`users/${user.id}`).set(users[user.id]);
}

// Save Guild Stats
function saveGuildData(guild){
  console.log("[SAVE GUILD DATA]: Saved stats for guild " + guild.name);
  db.ref(`guilds/${guild.id}`).set(guilds[guild.id]);
}

// Increment User Stats
function increment(user, val, song = -1){
  // If user is currently not in the query, add it.
  var id = user.id;
  if (users[id] === undefined){
    var ref = firebase.database().ref(`users/${id}`);
    ref.once("value").then(function(snapshot) {
      console.log("[INCREMENT STATS]: Loaded stats for " + user.tag);
      users[snapshot.key] = snapshot.val();
      if (users[snapshot.key] == null){
        users[snapshot.key] = { correct : 0, total : 0, hints : 0, songs : {"0" : 0}};
      }
      increment(user, val, song);
    });
    return;
  }
  // Increment stuff accordingly.
  switch(val){
    case DataField.CORRECT:
      if (song === null || song === undefined) {
        console.log("[ERROR]: song id " + song + " does not exist!");
        return;
      }
      console.log("[INCREMENT STATS]: id " + user.tag + " got a correct answer. correct: " + (users[id].correct + 1));
      users[id].correct ++;
      if (users[id].songs[song] === undefined){
        users[id].songs[song] = 1;
        saveUserData(user);
        return;
      }
      users[id].songs[song] ++;
      saveUserData(user);
    return;
    case DataField.TOTAL:
    console.log("[INCREMENT STATS]: id " + user.tag + " increased their total guess count. Total: " + (users[id].total + 1));
      users[id].total ++;
      saveUserData(user);
    return;
    case DataField.HINTS:
    console.log("[INCREMENT STATS]: id " + user.tag + " increased their hints count. Hints: " + (users[id].hints + 1));
      users[id].hints ++;
      saveUserData(user);
    return;
  }
}

// Set Bot Discord Presence
function setPresence(){
  client.user.setPresence({
        game: {
            name: "m!help (" + client.guilds.size + " servers)"
        }
    });
}

// Handle Event Subscriptions for a guild
function handleGuildAttach(guild){
  guild.eventSystem.on('increment', args => increment(args.user, args.field, args.song));
  guild.eventSystem.on('viewtop', msg => viewTop(msg));
  guild.eventSystem.on('viewstats', msg => viewStats(msg));
  guild.eventSystem.on('updateguild', args => updateGuild(args.message, args.channel));
}

// Handle Event Unsubscriptions for a guild
function handleGuildDetach(guild){
  guild.eventSystem.removeListener('increment', args => increment(args.user, args.field, args.song));
  guild.eventSystem.removeListener('viewtop', msg => viewTop(msg));
  guild.eventSystem.removeListener('viewstats', msg => viewStats(msg));
  guild.eventSystem.removeListener('updateguild', args => updateGuild(args.message, args.channel));
}

// This method is called when the user uses the "Top" Command
function viewTop(msg){
  console.log("[VIEW TOP]: " + msg.author.tag + " viewed top leaderboards.");
  var user = msg.author.id;
  var localtop = [];
  var globaltop = [];
  var output = `<@${user}>`;
  // Get top 10 Local Scores
  msg.guild.members.forEach(member => {
    if (users[member.user.id] != null && users[member.user.id] != undefined){
      var ob = users[member.user.id];
      ob.tag = member.user.tag;
      localtop.push(users[member.user.id]);
    }
    if (globaltop[member.user.id] != null && globaltop[member.user.id] != undefined){
      var ob = users[member.user.id];
      ob.tag = member.user.tag;
      globaltop.push(users[member.user.id]);
    }
  });
  // Get Sorted Global Scores
  localtop.sort((a,b) => (a.correct < b.correct) ? 1 : -1);
  for (var key in users){
    if (globaltop[key] == null)
      globaltop.push(users[key]);
  }
  globaltop.sort((a,b) => (a.correct < b.correct) ? 1 : -1);
  // Write Top 5 Global Scores
  output += "**\nTop 5 Scores (Global)**"; 
  for (var i in globaltop){
    if (i >= 5) break;
    var name = `Anonymous`;
    if (globaltop[i].tag != null && globaltop[i].tag != undefined)
      name = globaltop[i].tag
    output += "\n**"+(parseInt(i)+1)+".** " + name + ": `" + globaltop[i].correct + "` " + getRank(globaltop[i].correct).emoji;
  }
  // Write top 10 Local Scores
  output += "**\n\nTop 10 Scores (Local)**"; 
  for (var i=0; i<localtop.length && i<10; i++)
    output += "\n**"+(i+1)+".** " + localtop[i].tag + ": `" + localtop[i].correct + "` " + getRank(localtop[i].correct).emoji;
  msg.channel.send(output);
}

// This method is called when the user uses the "Stats" command
function viewStats(msg){
  console.log("[VIEW STATS]: " + msg.author.tag + " viewed their stats.");
  var user = msg.author.id;
  if (users[user] === undefined || users[user].songs === undefined){
    msg.channel.send(`<@${msg.author.id}> You do not have stats yet! Stats will appear once you have guessed a song.`);
    return;
  }
  try {
    var output = "";
    var rank = getRank(users[user].correct);
    output += "**<@" + user + "> Your Stats!**\n";
    output += "Rank: `" + rank.name + "` " + rank.emoji + "\n";
    var len = Object.keys(users[user].songs).length - 1;
    output += "Songs Unlocked: `" + len + "/" + songData.length + "` **(" + (100 * len/songData.length).toFixed(1) + "%)**\n";
    output += "Correct Guesses: `" + users[user].correct + "`\n";
    output += "Total Guesses: `" + users[user].total + "`\n";
    output += "Hints Used: `" + users[user].hints + "`";
    msg.channel.send(output);
  }
  catch(e){
    msg.channel.send("<@" + user + ">: Error getting user stats.");
    handleError(e, msg);
  }
}

// This method is called whenever a guild Play Channel gets updated
function updateGuild(msg, channel){
  if (channel == null){
    console.log("[UPDATE GUILD]: " + msg.author.tag + " saved their guild channel. (no channel)");
    guilds[msg.guild.id] = null;
    return;
  }
  console.log("[UPDATE GUILD]: " + msg.author.tag + " saved their guild channel. name: #" + channel.name);
  guilds[msg.guild.id] = channel.id;
  saveGuildData(msg.guild);
}

// Bot Ready
initUserQuery();
initGuildQuery();
client.on("ready", (member) => {
  setTimeout(function() {
    var servers = client.guilds.array();
    for (var i in servers){
      console.log("[CLIENT ON]: Initialized Game in guild: " + servers[i].name + " id: " + servers[i].id);
      if (guilds[servers[i].id] === undefined)
        instances[servers[i].id] = new Game(songData);
      else
        instances[servers[i].id] = new Game(songData, client.channels.get(guilds[servers[i].id]));
      handleGuildAttach(instances[servers[i].id]);
    }
    setPresence();
    console.log("[CLIENT ON]: All Guilds Initialized");
  }, 5000);
});

// Bot Joined Server
client.on("guildCreate", (guild) => {
  try {
    console.log("[JOIN]: Initialized Game in guild: " + guild.name + " id: " + guild.id);
    instances[guild.id] = new Game(songData);
    handleGuildAttach(instances[guild.id]);
    setPresence();
  }
  catch (e){
    handleError(e);
  }
});

// Bot Got Kicked
client.on("guildDelete", (guild) => {
  try {
    console.log("[LEFT]: Stopped Game in guild: " + guild.name + " id: " + guild.id);
    handleGuildDetach(instances[guild.id]);
    delete instances[guild.id];
    setPresence();
  }
  catch (e){
    handleError(e);
  }
});

// User Sent Message
client.on("message", (msg) => {
  try{
    if (instances[msg.guild.id] === undefined || instances[msg.guild.id] === null){
      console.log(`[WARNING]: Uninitialized server in guild: ${msg.guild.name} id: ${msg.guild.id}`);
      return;
    }
  	instances[msg.guild.id].handleOnMessage(msg, users[msg.author.id]);
  }
  catch (e){
    handleError(e, msg);
  }
});
client.login(BotSecret);