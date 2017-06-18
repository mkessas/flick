# node-flick

## Overview 

A RESTful API to retrieve, store, and expose Flick Electric unit prices for a given account.  This standalone service is powered by Express and is intended to run as a background service.  It serves two purposes:

- It will leverage the smartphone API to retrieve the current electricity price for a given account at regular intervals (configurable)
- It exposes a REST endpoint where the prices and the daily low & high are made available as a JSON object.

## Requirements

In order to run the daemon as-is, a Linux x64 system is required since the node binary is included in the package.  Using an alternate architecture (non-Windows) is a simple matter of replacing the node binary (under `sbin/`) with the correct version.

Alternately, you could simply pluck out the `modules/flick.js` file and reuse it as you please.

## Installation

The simplest way to install this is to clone the git repo:

```sh
$ git clone https://github.com/mkessas/node-flick.git
```

## Configuration

All configurable aspects of the daemon are read from the `etc/flick.properties` file.  Make all your changes there.  Be sure to substitute the placeholder values of the flick account with your own.

Please avoid reducing the `interval` to less than `600` as it would not yield any benefit.

## Starting

You can invoke the script manually using:

```sh
$ cd bin && ./flick
``` 

or using `nohup`

```sh
$ cd bin && nohup ./flick >> ../flick.log 2>&1 &
```

## Troubleshooting

Enable debugging in the `etc/flick.properties` file under the `[general]` section (set `debug` to `true`)

