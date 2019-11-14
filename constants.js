module.exports.Ranks = [
  { name : "Extraterrestrial", required: 5000, emoji: ":alien:" }, 
  { name : "Gamer", required: 4000, emoji: ":video_game:" },
  { name : "Oni", required: 3000, emoji: ":smiling_imp:" },  
  { name : "Cow", required: 2500, emoji: ":cow:" },
  { name : "Airplane", required: 2000, emoji: ":airplane:" }, 
  { name : "Car", required: 1750, emoji: ":blue_car:" }, 
  { name : "Boat", required: 1500, emoji: ":cruise_ship:" }, 
  { name : "Intellectual Guesser", required: 1250, emoji: ":blue_book:" }, 
  { name : "Sparkling Guesser", required: 1000, emoji: ":gem:" }, 
  { name : "Shining Guesser", required: 750, emoji: ":diamond_shape_with_a_dot_inside:" }, 
  { name : "Glittering Guesser", required: 500, emoji: ":large_blue_diamond:" }, 
  { name : "Marvelous Guesser", required: 250, emoji: ":blue_heart:" }, 
  { name : "Amazing Guesser", required: 100, emoji: ":blue_circle:" }, 
  { name : "Great Guesser", required: 50, emoji: ":small_blue_diamond:" }, 
  { name : "Good Guesser", required: 25, emoji: ":white_small_square:" },
  { name : "Okay Guesser", required: 10, emoji: ":small_red_triangle_down:" },  
  { name : "New Noob", required: 0, emoji: ":black_small_square:" }
];

module.exports.Commands = { 
	HELP: 'help',
	INFO: 'info',
	GUESS: 'guess',
	TOP: 'top',
	HINT: 'hint',
	STATS: 'stats',
	RANKS: 'ranks',
	SETCHANNEL: 'setchannel',
	REMOVECHANNEL: 'removechannel',
	SONGS: 'songs',
	PLAY: 'play',
	SKIP: 'skip'
};

module.exports.DataField = {
	CORRECT : 'correct',
	TOTAL : 'total',
	HINTS : 'hints'
}