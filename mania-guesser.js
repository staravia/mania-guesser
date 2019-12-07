const Ranks = require("./constants").Ranks;
const DataField = require("./constants").DataField;
const Discord = require("discord.js");
const EventEmitter = require('events');
const Commands = require("./constants").Commands;
const Invite = "https://discordapp.com/oauth2/authorize?client_id=642470359354048527&scope=bot";
const Github = "https://github.com/staravia/mania-guesser";
const Prefix = "m!";
const Version = "v1.1.4"
const TimeOutMax = 43200
const CountMin = 6;
const CountDelta =20;
const PageSize = 20;
const MaxHints = 2;

module.exports = class Game {
	constructor(data, channel = null){
		this.songData = data;
		this.playChannel = channel;
		this.currentCount = 0;
		this.encounterCountTarget = 10;
		this.encounterDate = null;
		this.currentSong = null;
		this.totalHintsGiven = 0;
		this.eventSystem = new EventEmitter();
	}

	handleOnMessage(msg, userData){
		// Ignore bots
		if (msg.author.bot)
			return;
		// Check to see if player wants to execute a command
		if (!msg.content.startsWith(Prefix)){
			this.handleEventCounter(msg.channel, msg.author);
			return;
		}
		// Handle Commands that could be used if play channel is not set.
		var cmd = getCommand(msg.content.substring(Prefix.length));
		var tag = getTag(msg.author.id);
		switch(cmd){
			case Commands.SETCHANNEL:
				if (msg.member.roles.find(role => role.name.toLowerCase() == "mania guesser")){
					this.playChannel = msg.channel;
					sendMessage(msg.channel, `${tag} The Play Channel has been set to: <#${this.playChannel.id}> :v:`);
					this.eventSystem.emit('updateguild', {message : msg, channel : msg.channel})
					return;
				}
				else{
					sendMessage(msg.channel, tag + " You need to have the `Mania Guesser` role in order to use that command! :x:");
				}
			return;
			case Commands.REMOVECHANNEL:
				if (msg.member.roles.find(role => role.name.toLowerCase() == "mania guesser")){
					if (this.playChannel == null)
						sendMessage(msg.channel, `${tag} There is currently no play channel to be removed.`);
					else
					{
						sendMessage(msg.channel, `${tag} The Play Channel has been removed from <#${this.playChannel.id}>`);
						this.playChannel = null;
						this.eventSystem.emit('updateguild', {message : msg, channel : null});
						return;
					}
				}
				else{
					sendMessage(msg.channel, tag + " You need to have the `Mania Guesser` role in order to use that command! :x:");
				}
			return;
			case Commands.HELP:
			const helpInfo = [
					"\n**General Commands**",
					"`m!setchannel`: Set the Play Channel for this bot. You must have a role called `Mania Guesser` to use this command.",
					"`m!removechannel`: Removes the Play Channel for this bot. You must have the `Mania Guesser` role to use this command.",
					"`m!info`: general bot info + Invite link.",
					"`m!top`: shows the top players for this server and globally.",
					"`m!stats`: shows your stats for the mania guessing game.",
					"`m!songs <page-num>`: shows your current collection of songs.",
					"`m!ranks`: view list of unlockable ranks.",
					"\n**Game Commands**",
					"`m!guess <song-name>`: guess the current song. You can use this during 'encounters'.",
					"`m!hint`: reveals a hint for the current encounter.",
					"`m!play`: starts a new song encounter.",
					"`m!skip`: skips the current song encounter.",
					"\n**Trouble Shooting**",
					"This bot is an osu!mania song guessing game.",
					"A Play Channel must be set for this bot using the `m!setchannel` command.",
					"Make sure this bot has the correct permissions to view/write message on the appropriate channels.",
					"I know you can cheat using the mapset URL, but its just too much work to create a database for the images."
				];
				var output = "";
				for (var key in helpInfo){
					output += helpInfo[key] + "\n";
				}
				sendMessage(msg.channel, tag + " **- HELP!**\n" + output);
			return;
		}
		// Send message if play channel has not been set
		if (this.playChannel == null){
			sendMessage(msg.channel, tag + " There is currently no play channel. Type `m!setchannel` to set this channel as the playing channel for this bot. Note: You must have a role called `Mania Guesser` for privledges.");
			return;
		}
		// Handle Commands that are supposed to be used in play channel
		if (msg.channel != this.playChannel)
			return;
		// Handle Commands that require a play channel
		switch(cmd){
			case Commands.INFO:
				var output = "**Mania Guesser (Info)**\n";
				output += `Version: ${Version}\n`;
				output += `Run Time: ${(process.uptime()/3600).toFixed(1)} hours\n`
				output += `Github: ${Github}\n`;
				output += `Invite: ${Invite}\n`;
				sendMessage(msg.channel, output);
			return;
			case Commands.GUESS:
				if (this.currentSong == null){
					sendMessage(msg.channel, tag + " There is currently no song to guess! Type `m!skip` to skip this song!");
					return;
				}
				if (this.handleGuess(msg.content.substring(Prefix.length + Commands.GUESS.length + 1)) == true){
					sendMessage(msg.channel, "Congrats! " + tag + " has correctly guessed the song! **Answer:** `" + this.currentSong.Artist + " - " + this.currentSong.Title + "`");
					this.eventSystem.emit('increment', { user : msg.author, song : this.currentSong.Id, field : DataField.CORRECT});
      				this.eventSystem.emit('increment', { user : msg.author, song : null, field: DataField.TOTAL});
      				this.endEncounter();
					return;
				}
				sendMessage(msg.channel, tag + " Wrong guess. Type `m!hint` for a hint!");
      			this.eventSystem.emit('increment', { user : msg.author, song : null, field: DataField.TOTAL});
			return;
			case Commands.HINT:
				if (this.currentSong == null){
					sendMessage(msg.channel, tag + " There is currently no song to guess!");
					return;
				}
				if (this.totalHintsGiven >= MaxHints){
					sendMessage(msg.channel, `${tag} Can't use anymore hints! Max amount of hints have already been used for this song.`);
					return;
				}
				this.totalHintsGiven++;
				sendMessage(msg.channel, tag + " has used a hint.\nHints Used: **" + this.totalHintsGiven + "/" + MaxHints + "**\nArtist: `" + this.currentSong.Artist + "`\nTitle: `" + generateHint(this.currentSong.Title, this.totalHintsGiven) + "`");
				this.eventSystem.emit('increment', { user : msg.author, song : null, field: DataField.HINTS});
			return;
			case Commands.TOP:
				this.eventSystem.emit('viewtop', msg);
			return;
			case Commands.STATS:
				this.eventSystem.emit('viewstats', msg);
			return;
			case Commands.RANKS:
			var output = tag + " **Unlockable Ranks!**";
			output += "\n`Rank Name` - `Correct guesses required`";
			for (var i in Ranks){
				output += "\n" + Ranks[i].name + " " + Ranks[i].emoji + " - `" + Ranks[i].required + "`"; 
			}
			sendMessage(msg.channel, output);
			return;
			case Commands.SONGS:
				var maxPages = Math.ceil(this.songData.length/PageSize);
				var page = parseInt(msg.content.substring(Prefix.length + Commands.SONGS.length))
				if (msg.content.substring(Prefix.length + Commands.SONGS.length).length == 0) page = 1;
				if (isNaN(page) || page > maxPages || page <= 0){
					sendMessage(msg.channel, tag + " `m!songs <page-num>` Enter a page number between 1 and " + maxPages);
					return;
				}
		        var len = Object.keys(userData.songs).length - 1;
		        var output = tag + " **Your Songs** page `" + page + "/" + maxPages + "` **(" + len + "/" + this.songData.length + ":v:)**";
		        for (var i=(page-1)*PageSize; i < this.songData.length && i < (page)*PageSize; i++)
		        {
		          var unlocked = false;
		          if (userData.songs[this.songData[i].Id] != null && userData.songs[this.songData[i].Id] > 0)
		            output += "\n" + (i+1) + ". `" + this.songData[i].Artist + " - " + this.songData[i].Title + "` **x"+userData.songs[this.songData[i].Id]+"**:v:";
		          else
		            output += "\n" + (i+1) + ". `" + this.songData[i].Artist + " - " + this.songData[i].Title + "`:x:";
		        }
		        sendMessage(msg.channel, output);
			return;
			case Commands.PLAY:
				if (this.currentSong == null)
					this.startEncounter(msg.channel);
				else
					sendMessage(this.playChannel, tag + " There is currently a song to guess!")
			return;
			case Commands.SKIP:
				if (this.currentSong == null)
					sendMessage(this.playChannel, tag + " There is currently no song to guess! Type `m!play` to start!")
				else{
					sendMessage(this.playChannel, "Song Skipped. Answer: `" + getSongTitle(this.currentSong) + "`");
					this.endEncounter();
					this.startEncounter(msg.channel);
				}
			return;
			case Commands.UWU:
				const attachment = new Discord.Attachment('./uwu.png', 'uwu.png');
				const embed = new Discord.RichEmbed()
			        .attachFile(attachment)
			        .setImage('attachment://uwu.png');
				sendMessage(msg.channel, embed);
			return;
			sendMessage(msg.channel, `${tag} Unknown Command. Type m!help for help!`);
		}

		// Handle Command Error
		sendMessage(msg.channel, `${tag} Unknown Command. Type m!help for help!`);
		return;
	}

	handleEventCounter(channel, author){
		// Encounters only can happen when there is a Play Channel
		if (this.playChannel == null)
			return;
		// Make sure there is currently not an encounter before creating one
		if (this.currentSong != null && this.encounterDate != null){
			if ((new Date() - this.encounterDate)/1000 < TimeOutMax)
				return;
			else {
				sendMessage(this.playChannel, "Time out! Took too long to guess the song.");
				this.endEncounter();
			}
		}
		this.currentCount++;
		// If current count exceeds the target count then the enxounter event will happen.
		if (this.currentCount > this.encounterCountTarget){
			this.startEncounter(this.playChannel);
		}
	}

	handleGuess(content){
		var correct = "";
		var guess = "";
		var spaceCount = 0;
		var letterCount = 0;
		// Correct Answer
		for (var i=0; i<this.currentSong.Title.length; i++){
			var char = this.currentSong.Title[i];
			if (charIsLetter(char)){
				letterCount++;
				correct += char.toLowerCase();
			}
			if (charIsBracket(char))
				break;
			if (char == ' '){
				if (letterCount >= 3)
					spaceCount++;
				if (spaceCount >= 2)
					break;
				letterCount = 0;
			}
		}
		// Guess
		for (var i=0; i<content.length; i++){
			if (content[i].toLowerCase() != content[i].toUpperCase()){
				guess += content[i].toLowerCase();
			}
		}
		return guess.substring(0, correct.length) == correct;
	}

	startEncounter(channel){
		this.totalHintsGiven = 0;
		this.currentSong = this.songData[Math.floor(Math.random() * this.songData.length)];
		this.encounterDate = new Date();
		sendMessage(channel, "**Encounter! **\nType `m!guess <songname>` to guess the osu!mania song! Type `m!hint` for a hint!\nSong: " + getSongImage(this.currentSong));
		sendMessage(channel,getHintBlock(this.currentSong, this.totalHintsGiven))
	}

	endEncounter(){
		this.currentCount = 0;
		this.encounterCountTarget = Math.floor(Math.random() * CountDelta + CountMin);
		this.currentSong = null;
		this.encounterDate = null;
	}
}

function charIsBracket(char, end=false){
	if (!end) return char == "(" || char == "[" || char == "<" || char == "{" 
	return char == ")" || char == "]" || char == ">" || char == "}" 
}

function charIsLetter(char){
	return char.toUpperCase() != char.toLowerCase();
}

function getTag(id){
	return `<@${id}>`;
}

function getSongTitle(song){
	return `${song.Artist} - ${song.Title}`; 
}

function getSongImage(song){
	return `https://assets.ppy.sh/beatmaps/${song.Id}/covers/cover.jpg`
}

function getHintBlock(song, hints){
	return "Artist: `" + song.Artist + "`\nTitle: `" + generateHint(song.Title, hints) + "`\nPreview: " + getSongPreview(song.Id);
}

function getSongPreview(id){
	return `https://b.ppy.sh/preview/${id}.mp3`;
}

function sendMessage(channel, content){
	channel.send(content);
}

function getCommand(content){
  	for (var key in Commands){
  		var obj = Commands[key];
  		if (content.toLowerCase().substring(0, obj.length) == obj){
  			return obj;
  		}
  	}
	return null;
}

// Generate hint with given title and total hints given
function generateHint(title, hints){
	var output = "";
	var total = title.length - Math.floor(title.length * (0.6 * hints/MaxHints + 0.1));
	var hint = [];
	// Generate no hint if title length is less than 2
	if (title.length <= 2){
		for (var i=0; i<title.length; i++){
			output += "_";
		}
		return output;
	}
	// Generate Random pos
	for (var i=0; i<title.length; i++){
		hint.push(i);
	}
	for (var i=0; i<total; i++){
		if (hint.length == 0) break;
		var rand = Math.floor(Math.random() * hint.length);
		hint.splice(rand,1);
	}
	// Generate Hint
	var nested = false;
	for (var i=0; i<title.length; i++){
		var char = title[i];
		var cont = false;
		if (charIsBracket(char))
			nested = true;
		else if (charIsBracket(char,true))
			nested = false;
		for (var j=0; j<hint.length; j++){
			if (i==hint[j]){
				output += char;
				hint.splice(j, 1);
				cont = true;
				break;
			}
		}
		if (cont == true) continue;
		if (charIsLetter(char) && nested == false)
			output += "_";
		else
			output += char;
	}
	return output;
}