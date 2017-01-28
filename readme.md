# README #

A command line tool for Iadea players and signboards.

### Installation ###
To use iadea-tool [NODE.JS](https://nodejs.org/) should be installed.
To install iadea-tool:
```
npm install --global iadea-tool
```

### Usage examples ###
General usage: ```$ iatool <host> [command] [options]```

host - ip address of IAdea media player or signboard. 
**NOTE:** if *IADEA_HOST* is specified as an environment variable or in **.ENV** file, host argument may be omitted.

**commands**
List of available commands:
```
    info                           show information on the player
    list [options] [filter]        display file list.
    play <file>                    play a local file or an external URL
    display <status>               turn display on/off
    switch                         switch to play default content 
    remove [options] [file]        remove file(s) matching criteria
    upload <source> [destination]  upload file
    autostart <file>               set default content to play each time player boots up 
    fallback <file>                set content to play on critical errors 
    reboot                         reboot player
```

**iatool info**

Usage: ```iatool <host> info```

show information on the player (model, firmware, storage, etc).

**iatool list**

Usage: ```iatool <host> list [options] [filter]```

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
    $ iatool <host> list -pstc
    
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

Usage: ```iatool <host> play <file>```

Play specified file or external URL once. It could be a media file, SMIL playlist or html-page.
It's possible to specify full path or file name or part of file name. 
If more then one files match the criteria only one will be played.
**NOTE:** it's also possible to specify external URL.

*Examples:*

```
    iatool <host> play media/image1.jpg
    iatool 192.168.2.12 play media/image1.jpg
    Playing: http://localhost:8080/v2/user-data/media/image1.jpg
```

```
    iatool <host> play video.mp4
    iatool 192.168.2.12 play media/video.mp4
    Playing: http://localhost:8080/v2/user-data/media/video.mp4
```

To play external URL:

```
    iatool <host> play http://www.auvix.ru
    Playing: http://www.auvix.ru
```

**iatool switch**

Usage: ```iatool <host> switch```

Switch to play the default content (it can be set with autostart command).

**iatool remove**

Usage: ```iatool <host> remove [options] [file]```

Remove file(s) matching the criteria. If no options set it searches for files matching *<file>* and remove them.
Available options:

```
    -h, --help        output usage information
    -i, --id          remove file by id
    -n, --incomplete  remove all incomplete files
```

*Examples:*

```
    iatool <host> remove --id E4A7E415121366A8453916ECD6FBF144
    Removing file by id: E4A7E415121366A8453916ECD6FBF144
```

Remove file with specified ID. ID could be determined by list command (```iatool <host> list -pic```).

```
    iatool <host> remove --incomplete                         
    Removing all incomplete files.
```

Remove all files with flag *complete* set to false.

**iatool upload**

Usage: ```iatool <host> upload <source> [destination]```

Upload specified file (<source>) to IAdea media player.
If [destination] is not specified the file will keep the name of ordinal file.
By default all media files (images, videos, etc.) are uploaded to \media\ folder.
The target folder could be se in [destination].

*Examples:*

```
    node iatool upload video.smil smil/
```

Upload video.smil to /smil/video.smil.


```
    node iatool upload video.mp4
```

Upload video.mp4 to /media/video.mp4

**iatool autostart*

Usage: ```iatool <host> autostart <file>```

Set default content to play each time player boots up.
See the description of **play** command for more details.

**iatool fallback**

Usage: ```iatool <host> fallback <file>```

Set the content to play on critical errors.
See the description of **play** command for more details.

**iatool display**

Usage: ```iatool <host> display <status>```

*<status>* could be *on* or *off*. Turn display on or off.

*Example:*

```
    iatool <host> display off    
    Current display status: on
    Turn display: off
```

**iatool reboot**

Usage: ```iatool <host> reboot```

Reboot player.



### Contribution ###

If you would like to contribute, please fork the repo and send in a pull request.

### License ###

(The MIT License)
Copyright (c) 2017 Alexander Pivovarov <pivovarov@gmail.com>