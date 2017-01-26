#!/usr/bin/env node 

var iadea =require('iadea-rest');
var program = require('commander');
var columnify = require('columnify');


var iadea_ip = null;

if (isURL(process.argv[2])) {
    iadea_ip = process.argv[2];
    process.argv.splice(2, 1);
}

program
    .command('info')
    .action(showInfo)
    .description('show information on the player');

program
    .command('list [filter]')
    .action(showFiles)
    .description('display file list')
    .option('-p, --downloadPath', 'add downloadPath to the list')
    .option('-i, --id', 'add file id to the list')
    .option('-s, --fileSize', 'add fileSize to the list')
    .option('-z, --transferredSize', 'add transferredSize to the list')
    .option('-t, --mimeType', 'add mimeType to the list')
    .option('-d, --createdDate', 'add createdDate to the list')
    .option('-m, --modifiedDate', 'add modifiedDate to the list')
    .option('-c, --completed', 'add completed flag to the list');

program
    .command('play <file>')
    .action(playFile)
    .description('play a media or smil file');

program
    .command('display <status>')
    .action(displayOn)
    .description('turn display on/off');

program
    .command('switch')
    .action(switchDefault)
    .description('switch to play default content ');

program
    .command('autostart <file>')
    .action(setAutostart)
    .description('set default content to play each time player boots up ');

program
    .command('fallback <file>')
    .action(setFallback)
    .description('set content to play on critical errors ');

program.parse(process.argv);

function isURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return pattern.test(str);
}


// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

function connect() {
    return iadea.connect(iadea_ip);
}

function logError(err) {
    var message = err;
    if (err.message) message = err.message;
    switch (err.code) {
        case 'ECONNREFUSED':
            message = 'Cannot {0} to {1}:{2} ({3})'.format(err.syscall, err.address, err.port, err.errno);
            break;
        default:
    }
    console.log(message);
}


function showInfo() {
    var info = [];

    function logInfo() {
        for (var i = 0; i < info.length; i++) {
            var name = info[i].name;
            var value = info[i].value;

            if (!name) console.log('');
            if (value) {
                if (typeof(value) !== 'object') //value = JSON.stringify(value);
                    console.log('{0}: {1}'.format(info[i].name, value ));
            }
        }
    }

    function pushValue(data, nobreak) {
        for (n in data) {
            info.push({name:n, value:data[n]});
        }
        if (!nobreak)
            info.push({name: ''});
    }

    function pushStorageInfo(data) {
        for (var i = 0; i < data.length; i++) {
            var storage = data[i];
            var name = 'Storage' + storage.id;
            var value = 'Free: {0} Gb ({1}). Total: {2} Gb ({3}). storageType: {4}, mediaType: {5}'.format(
                (storage.freeSpace/1024/1024/1024).toFixed(2), storage.freeSpace,
                (storage.capacity/1024/1024/1024).toFixed(2), storage.capacity,
                storage.storageType, storage.mediaType);

            var obj = {};
            obj[name] = value;

            pushValue(obj, true);
        }
        info.push({name: ''});
    }

    return connect()
        .then(iadea.getFirmwareInfo).then(pushValue)
        .then(iadea.getModelInfo).then(pushValue)
        .then(iadea.storageInfo).then(pushStorageInfo)
        .then(logInfo)
        .catch(logError);

}

function showFiles(filter, options) {
    function logFiles(data) {
        var files = data.items;
        var count = files.length;
        var columns = [];
        var maxWidth = 60;
        var size = 0;

        if (options.downloadPath) columns.push('downloadPath');
        if (options.id) columns.push('id');
        if (options.fileSize) columns.push('fileSize');
        if (options.transferredSize) columns.push('transferredSize');
        if (options.mimeType) columns.push('mimeType');
        if (options.createdDate) columns.push('createdDate');
        if (options.modifiedDate) columns.push('modifiedDate');
        if (options.completed) columns.push('completed');

        if (columns.length == 0) columns = ['downloadPath', 'fileSize', 'completed'];


        for (var i = 0; i < count; i++) {
            size += files[i].fileSize;
            var name = files[i].downloadPath;
            if (name.includes('/user-data/')) files[i].downloadPath = name.substring(11);
        }


        var col = columnify(files, {
            paddingChr: '',
            columnSplitter: ' | ',
            config: {downloadPath :{maxWidth:maxWidth}},
            columns: columns});


        var dashline = '-'.repeat(col.indexOf('\n'));
        console.log(dashline);
        col = col.slice(0, col.indexOf('\n')) + '\n' +'-'.repeat(col.indexOf('\n')) + col.slice(col.indexOf('\n'));

        console.log(col);
        console.log(dashline);
        console.log('Total: {0} file(s). Size: {1} Gb ({2} bytes)'.format(count, (size/1024/1024/1024).toFixed(2), size));

    }


    return connect()
        .then(function() { return iadea.getFileList(filter)})
        .then(logFiles)
        .catch(logError);
}


function playFile(file) {

    function PlayFile(file) {
        return iadea.playFile(file.downloadPath);
    }

    function logResults(data) {
        console.log("Playing: " + data.uri);
    }

    return connect()
        .then(function () {return iadea.findFileByName(file);})
        .then(PlayFile)
        .then(logResults)
        .catch(logError);

}

function displayOn(status) {
    function log(data) {
        console.log('Current display status: ' + data[0].power);
        console.log('Turn display: ' + (on ? 'on' : 'off'));

    }

    var on = (status.toLowerCase() == 'on');
    return connect()
        .then(function() {return iadea.switchDisplay(on)})
        .then(log)
        .catch(logError);
}

function switchDefault() {
    function logResults(data) {
        console.log("Playing: " + data.uri);
    }

    return connect()
        .then(iadea.switchToDefault)
        .then(logResults)
        .catch(logError);

}

function setStart(file, fallback) {
    function logResults(data) {
        var message = fallback ? "Fallback: " : "Autostart: " + data.uri;
        console.log(message);
    }

    return connect()
        .then(function () {return iadea.findFileByName(file);})
        .then(function (data) { return iadea.setStart(data.downloadPath, fallback);})
        .then(logResults)
        .catch(logError);

}

function setAutostart(file) {
    return setStart(file, false);
}

function setFallback(file) {
    return setStart(file, true);
}