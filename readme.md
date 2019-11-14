# What is this?
Mania Guesser is a bot where users encounter random osu!mania maps that they may be familiar with. The player earns points by guessing a song's name correctly (similar to pokecord bot)
# Commands
## General Commands
- `m!help`: displays a list of commands and troubleshooting for this bot. 
- `m!setchannel`: sets the Play Channel for this bot. You must have a role called `Mania Guesser` to use this command.
- `m!info`: general bot info + invite link.
- `m!top`: shows the top players for this server and globally.
- `m!stats`: shows your stats for the mania guessing game.
- `m!songs <page-num>`: shows your current collection of songs.
- `m!ranks`: view a list of unlockable ranks.
## Game Commands
- `m!guess <song-name>`: guess the current song. You can use this during 'encounters'.
- `m!hint`: reveals a hint for the current encounter.
- `m!play`: starts a new song encounter.
- `m!skip`: skips the current song encounter.
# Setup (for server owners)
1. Invite the bot to your discord server https://discordapp.com/oauth2/authorize?client_id=642470359354048527&scope=bot
2. Create a `Mania Guesser` role and give it to anyone that wishes to have access to the `m!setchannel` and `m!removechannel` command.
3. Set the Play Channel `m!setchannel` (this is where you will see the bot spam.)
# Setup (for developers)
1. Make sure you have the latest version of npm installed. Current Version: 6.12.0.
2. This bot also requires you to make a real-time database from firebase (but you can modify the code to use a different type of database.) The bot should also automatically populate your database if you plan on using firebase.
3. clone the repository to the host server `git clone http://github.com/staravia/mania-guesser`
4. cd to the project directory and install node packages `npm install`
5. create a private.js file
```javascript
// Example private.js file

// Discord Bot Secret
module.exports.BotSecret = "---------------------";
// Firebase Config
module.exports.FirebaseConfig = {
	  apiKey: "---------------------------------------------------",
	  authDomain: "---------------------------------",
	  databaseURL: "--------",
	  projectId: "----------",
	  storageBucket: "----------",
	  messagingSenderId: "----------",
	  appId: "----------", 
};
```
6. run index.js `node index.js`
## song-data.json
If you plan on creating your own songdata.json file (for example, you would want to do this if you plan on creating a osu!std version of this bot), take a look at this repository: https://github.com/staravia/osumania-to-json
# Trouble Shooting
- A Play Channel must be set for this bot using the m!setchannel command.
- Make sure this bot has the correct permissions to view/write message on the appropriate channels.
- I know you can cheat using the mapset URL, but its just too much work to create a database for the images.
