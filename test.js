var ratingarr = [];
var pickarr = [];

var userNumber = Math.floor((Math.random() * 20)) + 100;

for (var i = 0; i < userNumber; i++) {
    ratingarr.push(Math.floor((Math.random() * 2000)) + 500);
}

var sumRating = 0;

var match_home = 0; //1
var match_draw = 0;     //2
var match_away = 0;     //3

var randomPick;
for(var i = 0; i < userNumber; i++) {
    sumRating += ratingarr[i];
    // randomPick = Math.floor((Math.random() * 3));
    randomPickC = Math.floor((Math.random() * 10));
    if (randomPickC <= 7){
        randomPick = 0;
    } else if (randomPickC <= 8) {
        randomPick = 1;
    } else {
        randomPick = 2;
    }
    pickarr.push(randomPick);

    if(randomPick == 0) {
        match_home++;
    } else if(randomPick == 1) {
        match_draw++;
    } else {
        match_away++;
    }
}

var avgRating = sumRating / userNumber;

var match_all = match_home + match_draw + match_away;

var home_rate = match_home/match_all;
var draw_rate = match_draw/match_all;
var away_rate = match_away/match_all;

var upRate = 0;
var upres = [0, 0, 0];

var downRate = 0;
var downres = [0, 0, 0];

var result = [0, 1, 2];
var upsum = [0, 0, 0];
var downsum = [0, 0, 0];

var getCorrectP = function(rate) {
    var p = -1 * rate + 1.5;

    return p;
};

var getIncorrectP = function(rate) {
    var p = rate + 0.5;

    return p;
};

var getCorrectW = function(rating) {
    var win_rate = 1 / (1 + Math.pow(10, (avgRating - rating) / avgRating));
    var w = -1 * win_rate * 20 + 10;

    return w;
};

var getIncorrectW = function(rating) {
    var win_rate = 1 / (1 + Math.pow(10, (avgRating - rating) / avgRating));
    // console.log(rating, win_rate);
    var w = win_rate * 20 - 10;

    return w;
};

console.log('home pick : ', match_home, ' draw pick : ', match_draw, ' away pick : ', match_away);
console.log('avg rating : ', avgRating);
for(var j = 0; j < result.length; j++) {
    console.log('result : ', result[j]);
    for(var i = 0; i < ratingarr.length; i++) {
        upRate = 1/(1 + Math.pow(10, (avgRating - ratingarr[i])/avgRating));

        upres[0] = 30 * getCorrectP(home_rate) + getCorrectW(ratingarr[i]);
        upres[1] = 30 * getCorrectP(draw_rate) + getCorrectW(ratingarr[i]);
        upres[2] = 30 * getCorrectP(away_rate) + getCorrectW(ratingarr[i]);

        downres[0] = -30 * getIncorrectP(home_rate) - getIncorrectW(ratingarr[i]);
        downres[1] = -30 * getIncorrectP(draw_rate) - getIncorrectW(ratingarr[i]);
        downres[2] = -30 * getIncorrectP(away_rate) - getIncorrectW(ratingarr[i]);

        if(result[j] == pickarr[i]) {
            console.log(i + ": pick : " + pickarr[i] + " rating : " + ratingarr[i] + ' ' + upres[pickarr[i]]);
            upsum[j] += upres[pickarr[i]];
        } else {
            console.log(i + ": pick : " + pickarr[i] + " rating : " + ratingarr[i] + ' ' + downres[pickarr[i]]);
            downsum[j] += downres[pickarr[i]];
        }
    }
    console.log("result : ", result[j], "upsum: ", upsum[j], "downsum: ", downsum[j]);
};
