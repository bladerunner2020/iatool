# README #

A Command line tool for IAdea players and signboards.

### Installation ###
To use IAtool [NODE.JS](https://nodejs.org/) should be installed.

To install IAtool:
```
    $ sudo npm install --global iatool
```

### Usage examples ###
General usage: ```$ iatool <host>[:port] [options] command```

<host>[:port] - ip address and port of IAdea media player or signboard. Port is optional, default value is 8080.

*IADEA_HOST*, *IADEA_PORT*, *IADEA_USER*, *IADEA_PASS* could be specified as environment variables or in **.ENV** file.

**NOTE:** if *IADEA_HOST* is specified as an environment variable or in **.ENV** file, host argument may be omitted.

**common options**

``` 
    -h, --help         output usage information
    -U, --user <user>  set user name
    -P, --pass <pass>  set user password
``` 

**commands**

List of available commands:
```
    info                           show information on the player
    list [options] [filter]        display file list.
    play <file>                    play a local file or an external URL
    switch                         switch to play default content 
    remove [options] [file]        remove file(s) matching criteria
    upload <source> [destination]  upload file
    replace <source> [destination] remove file on iadea device and upload new file 
    autostart <file>               set default content to play each time player boots up 
    fallback <file>                set content to play on critical errors 
    startapp <package> <class>     set autostart android apk
    display <status>               turn display on/off
    reboot                         reboot player
    showconfig [options] [name]    show configuration settings
    setname <name>                 set player name
    setconfig <name> <value>       set configuration parameter
    screenshot [options] <file>    save screenshot to file
    find [<host>]                  find all IAdea devices
    notify <event>                 send notify event to Iadea device
    setcolor <color>               set color of LED bar lights (XDS-1078)
    password [pass]                update device password (reset if no argument specified)
    setrotation [rotation]         set rotation of the screen (0, 90, 180, 270, auto = default)
```

**iatool info**

Usage: ```$ iatool <host>[:port] info```

show information on the player (model, firmware, storage, etc).

**iatool list**

Usage: ```$ iatool <host>[:port] list [options] [filter]```

Display list of files on the player. If optional parameter *filter* is specified, only files that contains *filter* are listed.
It is possible to specify the information that should be displayed on each file.

The following options are available:

```  
    -h, --help             output usage information
    -p, --downloadPath     add downloadPath to the list
    -i, --id               add file id to the list
    -s, --fileSize         add fileSize to the list
    -z, --transferredSize  add transferredSize to the list
    -t, --mimeType         add mimeType to the list
    -d, --createdDate      add createdDate to the list
    -m, --modifiedDate     add modifiedDate to the list
    -c, --completed        add completed flag to the list
```

The default options are *-psc*.

*Example:*
```
    $ iatool 192.168.1.11 list -pstc
    
    ---------------------------------------------------------------------
    DOWNLOADPATH              | FILESIZE   | MIMETYPE         | COMPLETED
    ---------------------------------------------------------------------
    index.smil                | 6611       | application/smil | true     
    media/index2.smil         | 180        | application/smil | true     
    media/image1.jpg          | 190936     | image/jpeg       | true     
    media/image3.jpg          | 236185     | image/jpeg       | true     
    media/image2.jpg          | 773970     | image/jpeg       | true     
    safe.smil                 | 147        | application/smil | true     
    media/video1.5d43a661.mp4 | 1157541301 | video/mp4        | true     
    slideshow.smil            | 358        | application/smil | true     
    media/video.mp4           | 1578331716 | video/mp4        | true     
    ---------------------------------------------------------------------
    Total: 9 file(s). Size: 2.55 Gb (2737081404 bytes)
```

**iatoop play**

Usage: ```$ iatool <host>[:port] play <file>```

Play specified file or external URL once. It could be a media file, SMIL playlist or html-page.
It's possible to specify full path or file name or part of file name. 
If more then one files match the criteria only one will be played.
**NOTE:** it's also possible to specify external URL.

*Examples:*

```
    $ iatool 192.168.1.11 play media/image1.jpg
    
    Playing: http://localhost:8080/v2/user-data/media/image1.jpg
```

```
    $ iatool 192.168.1.11 play video.mp4
    
    Playing: http://localhost:8080/v2/user-data/media/video.mp4
```

To play external URL:

```
    $ iatool 192.168.1.11 play http://www.auvix.ru
    
    Playing: http://www.auvix.ru
```

**iatool switch**

Usage: ```$ iatool <host>[:port] switch```

Switch to play the default content (it can be set with autostart command).

**iatool remove**

Usage: ```$ iatool <host>[:port] remove [options] [file]```

Remove file(s) matching the criteria. If no options set it searches for files matching *<file>* and remove them.
Available options:

```
    -h, --help        output usage information
    -i, --id          remove file by id
    -n, --incomplete  remove all incomplete files
```

*Examples:*

```
    $ iatool 192.168.1.11 remove --id E4A7E415121366A8453916ECD6FBF144
    
    Removing file by id: E4A7E415121366A8453916ECD6FBF144
```

Remove file with specified ID. ID could be determined by list command (```$ iatool <host> list -pic```).

```
    $ iatool 192.168.1.11 remove --incomplete                         
    
    Removing all incomplete files.
```

Remove all files with flag *complete* set to false.

**iatool upload**

Usage: ```$ iatool <host>[:port]  upload <source> [destination]```

Upload specified file (<source>) to IAdea media player.
If [destination] is not specified the file will keep the name of ordinal file.
By default all media files (images, videos, etc.) are uploaded to \media\ folder.
The target folder could be se in [destination].

*Examples:*

```
    $ iatool 192.168.1.11 upload video.smil smil/
```

Upload *video.smil* to */smil/video.smil*.


```
    $ iatool 192.168.1.11 upload video.mp4
```

Upload *video.mp4* to */media/video.mp4*.

**iatool upload**

Usage: ```$ iatool <host>[:port]  replace <source> [destination]```

Find and remove file on IAdea device and upload new file.
If no file found on IAdea device or found more than one files operation cannot be completed.
See also descripton of **upload** command.


**iatool autostart**

Usage: ```$ iatool <host>[:port]  autostart <file>```

Set default content to play each time player boots up.
See the description of **play** command for more details.

**iatool fallback**

Usage: ```$ iatool <host>[:port]  fallback <file>```

Set the content to play on critical errors.
See the description of **play** command for more details.

**iatool startapp**

Usage: ```$ iatool <host>[:port]  <package> <class>```
Start Android apk automatically

*Example:*

```
    $ iatool <host> "com.iridium.i3pro_v100" "com.iridium.mobile.i3_proas.IridiumActivity"   
     
    { packageName: 'com.iridium.i3pro_v100',
      action: 'android.intent.action.VIEW',
      className: 'com.iridium.mobile.i3_proas.IridiumActivity' }
```

**iatool display**

Usage: ```$ iatool <host>[:port] display <status>```

*<status>* could be *on* or *off*. Turn display on or off.

*Example:*

```
    $ iatool <host> display off   
     
    Current display status: on
    Turn display: off
```

**iatool reboot**

Usage: ```$ iatool <host> reboot```

Reboot player.

**iatool showconfig**

Usage: ```$ iatool <host>[:port] showconfig [options] [name]```
    
Show configuration settings. If optional parameter [name] is set only settings that includes [name] are shown.

Available options:

```
    -h, --help       output usage information
    -s, --skipempty  skip empty settings
```

**iatool setname**

Usage: ```$ iatool <host>[:port] setname <name>```

Set the  player name.

**iatool setconfig**

Usage: ```$ iatool <host>[:port] setconfig <name> <value>```

Set configuration parameter.

Example - set time zone. Informatoin about time zones could be taken [here](http://www.a-smil.org/index.php/Timezone_List)

```
    $ iatool setconfig time.timeZone Europe/Moscow    
             
    Done. Player restart required.
```
**iatool screenshot**

Usage: ```$ iatool <host>[:port] screenshot [options] <file>```

Save screenshot to file.

Available options:

```
    -h, --help       output usage information
    -o, --overwrite  overwrite existing file
```

**iatool find**

Usage: ```$ iatool find [<host>]```

Do search for all IAdea devices in the *<host>* network segment. If *<host>* is omitted the search is done on the current segment.


**iatool notify**

Usage: ```$ iatool <host>[:port] notify <event>```

Send notify *event* to Iadea device to trigger SMIL playlist.

**iatool setcolor**

Usage: ```$ iatool <host>[:port] setcolor <color>```

Set color of LED bar lights. This command can be used with devices that has LED bar lights (e.g. Iadea XDS-1078).
*color* is HTML color code. 

*Example:*

```
    $ iatool <host> setcolor FF0000   
     
```

**iatool password**

Usage: ```$ iatool <host>[:port] password [pass]```

Update device password. If no argument is specified - reset default password (no password).


### Contribution ###

If you would like to contribute, please fork the repo and send in a pull request.

### License ###

(The MIT License)
Copyright (c) 2017 Alexander Pivovarov <pivovarov@gmail.com>