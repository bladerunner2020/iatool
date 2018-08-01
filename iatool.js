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
var IR =require('iadea-rest');
var program = require('commander');
var columnify = require('columnify');
var path = require('path');
var ProgressBar = require('progress');
var fs = require('fs');
var Q = require('q');

// IADEA_HOST could be specified as an environment variable
// or in .ENV file
var iadea_ip = process.env.IADEA_HOST;
var iadea_port = process.env.IADEA_PORT || 8080;
var iadea_user = process.env.IADEA_USER || 'admin';
var iadea_pass = process.env.IADEA_PASS || 'pass';


// If iadea IP is set we should parse it and remove from process.argv
// before program.parse(process.argv) is called
var argv = process.argv;

// If IP address is specified it should be first argument
// check if first argument is valid IP address
// Note: domain names are not supported.
if (ValidateIPaddress(argv[2])) {
    iadea_ip = argv[2];
    var port = iadea_ip.split(':').pop();
    if (port == iadea_ip) port = '';
        else iadea_ip = iadea_ip.substring(0, iadea_ip.indexOf(port)-1);
    iadea_port = port || iadea_port;
    argv.splice(2, 1);
}

var iadea = null;


// Add commands and onions processing
program
    .usage('<host>[:port] [options] command')
    .option('-U, --user <user>', 'set user name')
    .option('-P, --pass <pass>', 'set user password');

program
    .command('info')
    .action(showInfo)
    .description('show information on the player');

program
    .version(require('./package.json').version)
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
    .option('-c, --completed', 'add completed flag to the list');

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
    .description('upload file')
    .option('-s, --silent', 'hide all progress info during upload')
    .option('-n, --nobar', 'hide progress bar');

program
    .command('replace <source> [destination]')
    .action(replaceFile)
    .description('remove file on iadea device and upload new file')
    .option('-s, --silent', 'hide all progress info during upload')
    .option('-n, --nobar', 'hide progress bar');

program
    .command('autostart <file>')
    .action(setAutostart)
    .description('set default content to play each time player boots up ');

program
    .command('fallback <file>')
    .action(setFallback)
    .description('set content to play on critical errors ');

program
    .command('startapp <package> <class>')
    .action(setAutostartApp)
    .description('set autostart android apk');

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

program
    .command('screenshot <file>')
    .action(saveScreenShot)
    .description('save screenshot to file')
    .option('-o, --overwrite', 'overwrite existing file');

program
    .command('find [<host>]')
    .action(findIadeaDevices)
    .description('find all Iadea devices');

program
    .command('notify <event>')
    .action(sendNotify)
    .description('send notify event to Iadea device');

program
    .command('setcolor <color>')
    .action(setColor)
    .description('set color of LED bar lights');

program
    .command('consolenew <json...>')
    .action(function(json) {ConsoleUpdate(json, true)})
    .description('add configuration parameter (via console/new)');

program
    .command('consoleupdate <json...>')
    .action(function(json) {ConsoleUpdate(json, false)})
    .description('update configuration parameter (via console/new)');


program.on('--help', function(){
    console.log('  Examples:');
    console.log();
    console.log('  $ iatool --help');
    console.log('  $ iatool list -help');
    console.log('  $ iatool 192.168.1.111 info');
    console.log();
    
    console.log('  Optional environment variables:');
    console.log('');
    console.log('    IADEA_HOST=' + (process.env.IADEA_HOST || ''));
    console.log('    IADEA_PORT=' + (process.env.IADEA_PORT || ''));
    console.log('    IADEA_USER=' + (process.env.IADEA_USER || ''));
    console.log('    IADEA_PASS=' + (process.env.IADEA_PASS || ''));
    console.log('');
    console.log('    NOTE: if IADEA_HOST is specified as an environment variable or in .ENV file,');
    console.log('          host argument may be omitted. ')
});

program
    .command('*', '', {noHelp: true})
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
    return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[0-9]+)?$/.test(ipaddress));
}

/**
 * Check if string is valid IP address
 * @promise {String} access token
 */
function connect() {
    var user = program.user || iadea_user;
    var pass = program.pass || iadea_pass;

    if (!iadea)
        iadea = IR.createDevice(iadea_ip, iadea_port, user, pass);

    return iadea.connect();
}

/**
 * log error message in console log
 * @param {Error} err
 */
function logError(err) {
    console.log(); //add empty line
    var message = err;
    if (err.message) message = err.message;
    switch (err.code) {
        case 'ECONNREFUSED':
            message = 'Cannot {0} to {1}:{2} ({3})'.format(err.syscall, err.address, err.port, err.errno);
            break;
        case 'EPIPE':
            message = 'Error writing to pipe (connection is lost)';
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
        var count = files ? files.length : 0;
        var columns = [];
        var maxWidth = 60;
        var size = 0;

        if (count == 0) {
            console.log('Storage seems empty.');
            return;
        }



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
        if (data.error) {
            console.log(data.error);
            return;
        }

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
        var message = (fallback ? "Fallback: " : "Autostart: ") + data.uri;
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


function setAutostartApp(packageName, className) {
    var data = {
        className: className,
        packageName: packageName,
        action: "android.intent.action.VIEW"
    };
    
    return connect()
        .then(function () {
            return iadea.setStart(data, false);})
        .then(console.log)
        .catch(logError);    
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

function replaceFile(source, destination, options) {
    var filename = source.replace(/^.*(\\|\/|\:)/, '');
    //var extension = filename.split('.').pop();

    if (typeof(destination) == 'string') filename = destination;

    function findId(data) {
        var files = data.items;
        var found = [];

        for (var i=0; i < files.length; i++) {
            var name = files[i].downloadPath;

            if (name.indexOf(filename) >= 0) found.push(files[i]);
        }

        switch (found.length) {
            case 0:
                console.log('File to replace not found on IAdea: ' + filename);
                process.exit(1);
                break;
            case 1:
                return found[0];
                break;
            
            // > 1
            default:
                console.log('More than one file found: ' + filename);
                console.log('replace can not be continued...');
                process.exit(1);
        }

    }

    function removeFileById(file) {
        console.log('Removing file ' + file.downloadPath);
        return iadea.deleteFiles(file.id);
    }

    return connect()
        .then(function() { return iadea.getFileList()})
        .then(findId)
        .then(removeFileById)
        .then(function(){uploadFile(source, destination, options);})
        .catch(logError);
    
}

/**
 * Upload file
 * @param {String} source - file to upload
 * @param {String} destination - optional
 * @param {Object} options
 */
function uploadFile(source, destination, options) {
    var silent  = options.silent;
    var nobar = options.nobar;
    var filename = source.replace(/^.*(\\|\/|\:)/, '');
    var extension = filename.split('.').pop();

    var downloadPath = destination;
    var bar = null;
    var last_done = 0;
    var start_time = Date.now();

    var _logProgress = function(data) {
        if (nobar) {
            process.stdout.write('Downloading ' + data.done + ' of ' + data.size + '...\r');
            return;
        }

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
    };
    if (silent) _logProgress = null; // don't output any information is silent mode
    
    var _logResults = function (data) {
        if (typeof(data) == 'string') data = JSON.parse(data);

        var end_time = Date.now();
        var elapsed = Math.floor((end_time - start_time)/1000);
        // console.log(data);
        var status = (data.completed) ? 'successful' : 'failed';
        
        console.log('Uploaded: ' + data.downloadPath + ' (' + data.fileSize + ' bytes) - ' + status);
        console.log('Elapsed: ' + elapsed + ' s');
    };


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
            case 'apk':
                dest_path = dest_path + 'upload/';
            default:

        }

    dest_path = '/user-data/' + dest_path;

    if (dest_filename == '') dest_filename = filename;

    path.normalize(dest_path);

    console.log('Uploading ' + filename + ' to ' + dest_path + dest_filename + '...');

    return connect()
        .then(function() {return iadea.uploadFile(source, dest_path + dest_filename);})
        .progress(_logProgress)
        .then(_logResults)
        .catch(logError);
}

/**
 * Reboot player.
 */
function rebootPlayer() {
    console.log('Rebooting player');

    return connect()
        .then(iadea.reboot)
        .catch(logError);
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

/**
 * Save screen shot to file
 * @param {String} file
 * @param {Object} options 
 */
function saveScreenShot(file, options) {

    function writeFile(data) {
        fs.writeFile(filename, data, 'binary', function (err) {

            if (err) return err;
            console.log('Screenshot saved to ' + filename);
        });
    }

    var filename = file;

    var extension = filename.split('.').pop();
    if ((extension == '') || (extension == filename)) filename = filename + '.jpg';


    fs.exists(filename, function (exists) {
        if(exists && !options.overwrite)
        {
            logError(new Error('Error. Cannot write file ' + filename + ': file already exist. Use --overwrite option.'));
        }else
        {
            return connect()
                .then(iadea.getScreenshot)
                .then(writeFile)
                .catch(logError);
        }
    });
    
}


/**
 * Do search for iadea devices in the current ip segment
 */
function findIadeaDevices(host) {

    function SearchAndLog(host) {
        var found = [];
        var promises = [];

        function searchAll(host) {
            var base_addess = host.split('.');
            base_addess = base_addess[0] + '.' + base_addess[1] + '.' + base_addess[2] + '.';

            for (var i = 0; i < 255; i++) {
                var ip = base_addess + i;
                promises.push(searchIP(ip));
            }

            return Q.all(promises);
        }

        function searchIP(ip) {
            var iadea = IR.createDevice(ip, iadea_port, iadea_user, iadea_pass);
            return iadea.connect().then(iadea.getModelInfo).then(onFound.bind({ip : ip})).catch(onNotFound);
        }

        function onFound(data) {
            var s = this.ip  + ' (' + data.modelName + ')';
            found.push(s);
        }

        function onNotFound(data) {

        }

        searchAll(host).then(function() {
            console.log("Found " + found.length + ' device(s):');
            for (var i = 0; i < found.length; i++) {
                console.log('   ' + found[i]);
            }
        })
    }


    if (host) return SearchAndLog(host);

    // Trying to define hostname
    require('dns').lookup(require('os').hostname(), function (err, addr, fam) {
        if (err) return logError(err);
        SearchAndLog(addr);
    })
}

/**
 * Send notify event to Iadea device
 * @param {String} event - string to send to Iadea device as notify parameter
 * @param {Object} options
 */
function sendNotify(event, options) {
    return connect()
        .then(function() {return iadea.notify(event);})
        .then(console.log)
        .catch(logError);

}

/**
 * Set color of LED bar lights
 * @param color
 */
function setColor(color) {
   if (color.charAt(0) !== '#') {
       color = '#' + color;
   }

   return connect()
       .then(function() {return iadea.setColor(color);})
       .then(console.log)
       .catch(logError);

}

/**
 * Send request via /app/settings/com.iadea.console/update
 * @param json_arr {Array} - new settings (JSON broke down to array)
 *     Example: iatool <host> consolenew '{"settings": [ {"name": "autoTimeServer", "default": "ntp://host{:port}" } ] }'
 * @param is_new - if true used - "/app/settings/com.iadea.console/new" instead
 * @promis - return the default value configured above
 */
function ConsoleUpdate(json_arr, is_new) {
    var s = mergeArguments(json_arr);
    if (!s) {
        console.log("Wrong json format.");
        return;
    }

    return connect()
        .then(function() {return is_new ? iadea.settingsConsoleNew(s) : iadea.settingsConsoleUpdate(s);})
        .then(console.log)
        .catch(logError);

}

function mergeArguments(arr) {
    if (!arr.forEach) return null;

    var s = '';
    arr.forEach(function(e){
        s += e;
    });
    

    try {
        return JSON.parse(s);
    } catch (e) {
        return null;
    }

}

