var casper = require('casper').create({
    // 'verbose': true,
    // 'logLevel': 'debug',
    // 'viewportSize': {
    //     'width': 1000,
    //     'height': 1000
    // },
    'pageSettings': {
        'loadImages': false,
        'javascriptEnabled': true,
        'loadPlugins': true,
        'localToRemoteUrlAccessEnabled': true,
        'userAgent': 'Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36',
        'XSSAuditingEnabled': false,
        'logLevel': 'debug'
    },
    'ignoreSslErrors': true,
});

var x = require('casper').selectXPath;
var mouse = require('mouse').create(casper);

casper.start('http://www.koreabaseball.com/Schedule/Schedule.aspx?seriesId');

// casper.on('resource.requested', function(requestData, resource) {
//     if (requestData.postData && requestData.url && requestData.url == 'https://somers.taglive.net/grid_excel_down.html') {
//         var json_data = decodeURIComponent(requestData.postData);
//         console.log(json_data);
//     }
// });

casper.then(function() {
    var html = this.getHTML('#tblSchedule', true);
    this.echo(html);
    // casper.waitForUrl('https://somers.taglive.net/main.html', function then() {
    //     casper.waitForSelector('.slick-cell', function then() {
    //         this.mouse.click(x("//div[contains(@class, 'slick-cell') and contains(text(), [SOMERS_TARGET_TAG])]"));
    //         casper.waitForSelector('.contestDIV', function then() {
    //             this.mouse.click('.contestDIV');
    //             casper.waitForSelector('#jqi_state0_buttonOk', function then() {
    //                 this.mouse.click('#jqi_state0_buttonOk');
    //                 console.log('no_contents');
    //             }, function timeout() {
    //                 this.mouse.click('.ui-output-xml');
    //             }, 3000);
    //         }, function timeout() {
    //             this.echo('time out3');
    //         });
    //     }, function timeout() {
    //         this.echo('time out2');
    //     });
    // }, function timeout() {
    //     this.echo('time out1');
    // }, 10000);
});

casper.run();
