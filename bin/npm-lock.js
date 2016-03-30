#!/usr/bin/env node
'use strict'

var path = require('path')
var argv = process.argv
if (argv.length > 3 || argv[2] === '--help') {
  usage()
}

var locker = require('..')

locker(path.resolve(process.cwd()))
// locker('/Users/liuzhanhong/Documents/svn/server')

function usage() {
  console.log('usage: node npm-lock [--help]')
  process.exit()
}
