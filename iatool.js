#!/usr/bin/env node 

/*!
 * Iadea command line tool
 * Copyright(c) 2017 Alexander Pivovarov
 * pivovarov@gmail.com
 * MIT Licensed
 *
 * To see commands and options run: node iatool --help
 *
 */

require('dotenv').config(); // should be on top
var iadea =require('iadea-rest');
var program = require('commander');
var columnify = require('columnify');
var path = require('path');
var ProgressBar = require('progress');

// IADEA_HOST could be specified as an environment variable
// or in .ENV file
var iadea_ip = process.env.IADEA_HOST;


// If iadea IP is set we should parse it and remove from process.argv
// before program.parse(process.argv) is called
var argv = process.argv;

// If IP address is specified it should be first argument
// check if first argument is valid IP address
// Note: domain names are not supported.
if (ValidateIPaddress(argv[2])) {
    iadea_ip = argv[2];
    argv.splice(2, 1);
}

// Add commands and onions processing
program
    .usage('<host> command [options]');

program
    .command('info')
    .action(showInfo)
    .description('show information on the player');

program
    .command('list [filter]')
    .action(showFiles)
    .description('display file list.')
    .option('-p, --downloadPath', 'add downloadPath to the list')
    .option('-i, --id', 'add file id to the list')
    .option('-s, --fileSize', 'add fileSize to the list')
    .option('-z, --transferredSize', 'add transferredSize to the list')
    .option('-t, --mimeType', 'add mimeType to the list')
    .option('-d, --createdDate', 'add createdDate to the list')
    .option('-m, --modifiedDate', 'add modifiedDate to the list')
    .option('-c, --completed', 'add completed flag to the list')
    .on('--help', function() {
        console.log('  Examples:');
        console.log();
        console.log('    $ iatool 192.168.1.111 list -pmsc');
        console.log('');
        console.log();
    });

program
    .command('play <file>')
    .action(playFile)
    .description('play a local file or an external URL');

program
    .command('switch')
    .action(switchDefault)
    .description('switch to play default content ');


program
    .command('remove [file]')
    .action(removeFile)
    .description('remove file(s) matching criteria')
    .option('-i, --id', 'remove file by id')
    .option('-n, --incomplete', 'remove all incomplete files');

program
    .command('upload <source> [destination]')
    .action(uploadFile)
    .description('upload file');

program
    .command('autostart <file>')
    .action(setAutostart)
    .description('set default content to play each time player boots up ');

program
    .command('fallback <file>')
    .action(setFallback)
    .description('set content to play on critical errors ');

program
    .command('display <status>')
    .action(displayOn)
    .description('turn display on/off');

program
    .command('reboot')
    .action(rebootPlayer)
    .description('reboot player');

program
    .command('showconfig [name]')
    .action(showConfig)
    .description('show configuration settings')
    .option('-s, --skipempty', 'skip empty settings');

program
    .command('setname <name>')
    .action(setPlayerName)
    .description('set player name');

program
    .command('setconfig <name> <value>')
    .action(setConfig)
    .description('set configuration parameter');


program.on('--help', function(){
    console.log('  Examples:');
    console.log();
    console.log('  $ iatool --help');
    console.log('  $ iatool list -help');
    console.log('  $ iatool 192.168.1.111 info');
    console.log();
    
    console.log('  Environment variables:');
    console.log('');
    console.log('    IADEA_HOST=' + process.env.IADEA_HOST);
    console.log('');
    console.log('    NOTE: if IADEA_HOST is specified as an environment variable or in .ENV file,');
    console.log('          host argument may be omitted. ')
});

program
    .command('*')
    .action(function(cmd){
        console.log('Unknown command: ', cmd);
    });

program.parse(argv);

// If no command display help
if (argv.length < 3)
    program.help();


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

/**
 * Check if string is valid IP address
 * @param {String} ipaddress
 * @return {Boolean}
 */
function ValidateIPaddress(ipaddress) {
    return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress));
}

/**
 * Check if string is valid IP address
 * @promise {String} access token
 */
function connect() {
    return iadea.connect(iadea_ip);
}

/**
 * log error message in console log
 * @param {Error} err
 */
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

/**
 * Display information about Iadea device and storage
 */
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

/**
 * Display list of files matching criteria
 * @param {String} filter - shows only files that include filter
 * @param {Object} options specify which columns to show
 */
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

/**
 * Play file
 * @param {String} file
 */
function playFile(file) {

    function PlayFile(file) {
        var filename = file.downloadPath || file;
        return iadea.playFile(filename);
    }

    function logResults(data) {
        console.log("Playing: " + data.uri);
    }

    return connect()
        .then(function () {
            if (!file.includes('http'))
                return iadea.findFileByName(file);
            return file;
        })
        .then(PlayFile)
        .then(logResults)
        .catch(logError);

}

/**
 * Switch display on/off
 * @param {String} status 'on' to switch on
 */
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

/**
 * Play default content (e.g. set by setStart function)
 */
function switchDefault() {
    function logResults(data) {
        console.log("Playing: " + data.uri);
    }

    return connect()
        .then(iadea.switchToDefault)
        .then(logResults)
        .catch(logError);

}

/**
 * Set default content to play each time player boots up or fallback content
 * @param {String} file
 * @param {Boolean} fallback
 */
function setStart(file, fallback) {
    function logResults(data) {
        var message = fallback ? "Fallback: " : "Autostart: " + data.uri;
        console.log(message);
    }

    return connect()
        .then(function () {
            if (!file.includes('http'))
                return iadea.findFileByName(file);
            return file;
        })
        .then(function (data) {
            return iadea.setStart(data.downloadPath || data, fallback);})
        .then(logResults)
        .catch(logError);

}

/**
 * Set default content to play each time player boots up
 */
function setAutostart(file) {
    return setStart(file, false);
}

/**
 * Set fallback content to play if error happnes
 */
function setFallback(file) {
    return setStart(file, true);
}

/**
 * Remove file(s) matching criteria
 * @param {String} file - filename or criteria
 * @param {Object} options (mimeType, completed)
 */

function removeFile(file, options) {

    if (options.id) {
        console.log('Removing file by id: ' + file);
        
        return connect()
            .then(function () {
                return iadea.deleteFiles(file)
            })
            // .then(console.log)
            .catch(logError);
    }
    
    if (options.incomplete) {
        console.log('Removing all incomplete  files.');

        return connect()
            .then (function () {return iadea.getFileList(false, 'completed'); })
            .then(iadea.deleteFiles)
            // .then(console.log)
            .catch(logError);
    }
    

    return connect()
        .then(function () {return iadea.getFileList(file);})
        .then(iadea.deleteFiles)
        // .then(console.log)
        .catch(logError);
    
}

var bar = null;
var last_done = 0;
function _logProgress(data) {
 //   process.stdout.write('Downloading ' + data.done of data.size... \r');

    // If file is uploaded in one go skip progress bar
    if ((bar == null) && (data.percent == 1)) return;

    if (!bar)
        bar = new ProgressBar('Uploading :current [:bar] :percent :etas', {
            complete: '█',
            incomplete: '░',
            width: 20,
            total: data.size
        });


    bar.tick(data.done - last_done);
    last_done = data.done;
}

/**
 * Upload file
 * @param {String} source - file to upload
 * @param {String} destination - optional
 */
function uploadFile(source, destination) {
    var filename = source.replace(/^.*(\\|\/|\:)/, '');
    var extension = filename.split('.').pop();

    var downloadPath = destination;
    if (typeof(downloadPath) === 'undefined') {downloadPath = filename;}

    var dest_filename = downloadPath.replace(/^.*(\\|\/|\:)/, '');
    var dest_path = downloadPath;
    if (dest_filename != '')
        dest_path = downloadPath.substring(0, downloadPath.indexOf(dest_filename));

    if (dest_path == '')
        switch (extension) {
            case 'jpg':
            case'jpeg':
            case 'png' :
            case 'mp4':
            case "mpe":
            case "mpeg":
            case "mpg":
            case "avi":
            case "wmv":
            case "divx":
            case "mov":
            case "mp3":
            case "txt":
                dest_path = dest_path + 'media/';
                break;
            case 'smil':
            case 'smi':
                break;
            default:

        }

    dest_path = '/user-data/' + dest_path;

    if (dest_filename == '') dest_filename = filename;

    path.normalize(dest_path);

    console.log('Uploading ' + filename + ' to ' + dest_path + dest_filename + '...');

    return connect()
        .then(function() {return iadea.uploadFile(source, dest_path + dest_filename);})
        .progress(_logProgress)
        .then(console.log)
        .catch(logError);
}

/**
 * Reboot player.
 */
function rebootPlayer() {
    console.log('Rebooting player');

    return connect()
        .then(iadea.reboot);
}

/**
 * Show configuration settings
 * @param {String} name
 * @param {Object} options
 */
function showConfig(name, options) {
    function logResults(data) {
        var res = data;
        if (typeof(res) === 'string' ) res = JSON.parse(data);

        var settings = res.userPref;
        if (!settings) {
            console.log("Error. Can't get current configuration.");
            return;
        }

        for(var i = 0; i < settings.length; i++ ) {
            var s = settings[i];

            if (!name || (s.name.includes(name)))
                logValue(s.name, s.value);
 
        }
    }

    function logValue(n, v) {
        var name = n;
        var value = v;
        if (name == 'app.start' || name == 'app.fallback') {
            if (typeof(value) === 'string') value = JSON.parse(value);
            value = value.uri;
            name = name + ' (URI)';
        }

        if (!value) value = '';

        if (value != '' || !options.skipempty)
            console.log(name + ': ' + value);
    }

    return connect()
        .then(iadea.exportConfiguration)
        .then(logResults)
        .catch(logError);
}

/**
 * Set player name
 * @param {String} newname
 */
function setPlayerName(newname) {
    var cfg = {name: 'info.playerName', value: newname};

    function logResult(data) {
        if (data && data.restartRequired)
            console.log('Done. Player restart required.')
    }

    return connect()
        .then(function() {return iadea.importConfiguration(cfg, true);})
        .then(logResult)
        .catch(logError);
}

/**
 * Set configuration parameter
 * @param {String} name
 * @param {String} value
 */
function setConfig(name, value) {
    var cfg = {name: name, value: value};


    function logResult(data) {
        if (data && data.restartRequired)
            console.log('Done. Player restart required.')
    }

    return connect()
        .then(function() {return iadea.importConfiguration(cfg, true);})
        .then(logResult)
        .catch(logError);
}
