var fs = require('fs');

var emotionObj = {
	emotion: null,
	date: null,
	channel: null
};
var emotions = []
var obj ; 

var logger = fs.createWriteStream('emotions.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})


fs.readFile('dump.json', 'utf8', function (err, data) {
    obj = JSON.parse(data);
	var results = obj.results;

	for (var i = results.length - 1; i >= 0; i--) {
		if (results[i].emotion_data != null) {
			emotionObj = {
				emotion: results[i].emotion_data.dominant_emotion ,
				date: results[i].releaseDate,
				channel: results[i].channel
			}
			emotions.push(emotionObj);
			logger.write(emotionObj.emotion.toString()+','+emotionObj.date.toString()+','+emotionObj.channel.toString()+'\n');
		}
	}
	logger.close();
});

