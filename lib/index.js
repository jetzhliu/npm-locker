'use strict'
var path = require('path')
var exec = require('child_process').exec
var fs = require('fs')
var log = console.log

module.exports = function(projectPath, useDev, addCache) {
  useDev = useDev || true
  addCache = addCache || false
  // set('-v')
  process.chdir(projectPath)
  var wrapPath = path.join(projectPath, 'npm-shrinkwrap.json')
  if (!fs.existsSync(wrapPath)) {
    die('You must run `npm shrinkwrap` first')
  }
  log('make sure your npm-shrinkwrap.json is up to date')
  var packageDir = path.join(projectPath, 'node_packages')
  var wrapPath = path.join(projectPath, 'npm-shrinkwrap.json')
  var pkg = require(wrapPath)
  var packages = getAllPackages(pkg.dependencies || {})
  log('total packages count: ' + Object.keys(packages).length)
  exec('npm config get cache', function(err, stdout, stderr) {
    if (err) {
      die(stderr)
    }
    var npmCachePath = stdout.trim()
    var classifiedPackages = classify(npmCachePath, packages)
    if (Object.keys(classifiedPackages.noCached).length) {
      hint(classifiedPackages.noCached, packageDir)
    } else {
      if (!fs.existsSync(packageDir)) {
        fs.mkdirSync(packageDir)
      }
      copyCache(classifiedPackages.cached, packageDir, function(err) {
        if (err) {
          die(err)
        }
        writeShrinkwrap(wrapPath, pkg)
        log('done, all you vendor packages are in node_packages')
      })
    }
  })
}

function getAllPackages(dependencies) {
  var out = {}
  travelPackages(dependencies, function(name, dep) {
    if (!out[name]) {
      out[name] = {}
    }
    out[name][dep.version] = dep.resolved
  })
  return out
}

function travelPackages(dependencies, callback) {
  Object.keys(dependencies).forEach(function(name) {
    callback(name, dependencies[name])
    if (dependencies[name].dependencies) {
      travelPackages(dependencies[name].dependencies, callback)
    }
  })
}

function classify(npmCachePath, packages) {
  var out = {
    cached: {},
    noCached: {}
  }
  Object.keys(packages).forEach(function(name) {
    Object.keys(packages[name]).forEach(function(version) {
      var cachedPath = path.join(npmCachePath, name, version, 'package.tgz')
      if (fs.existsSync(cachedPath)) {
        var localPath = getLocalPath(name, version)
        out.cached[cachedPath] = localPath
      } else {
        out.noCached[name + '@' + version] = packages[name][version]
      }
    })
  })
  return out
}

function getLocalPath(name, version) {
  return './node_packages/' + name + '-' + version + '.tgz'
}

function copyCache(packages, packageDir, done) {
  var keys = Object.keys(packages)
  var total = keys.length
  var count = 0
  var doneOne = function() {
    count += 1
    if (count === total) {
      done()
    }
  }
  keys.forEach(function(cachedPath) {
    var dist = packages[cachedPath]
    if (!fs.existsSync(dist)) {
      exec("cp '" + cachedPath + "' '" + dist + "'", function (err) {
        if (err) {
          done(err)
        }
        doneOne()
      })
    } else {
      doneOne()
    }
  })
}

function hint(packages, packageDir) {
  log('the following packages not in npm cache')
  log('please add them to cache first')
  log('npm cache add name@version')
  Object.keys(packages).forEach(function(name) {
    log(name)
  })
}

function writeShrinkwrap(wrapPath, pkgJson) {

  travelPackages(pkgJson.dependencies, function(name, dep) {
    dep.resolved = getLocalPath(name, dep.version)
  })
  fs.writeFileSync(wrapPath, JSON.stringify(pkgJson, null, 4), 'utf8')
}

function die() {
  Array.prototype.slice.apply(arguments).forEach(function(msg) {
    log(msg)
  })
  process.exit(1)
}
