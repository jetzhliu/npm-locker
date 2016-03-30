'use strict'
var path = require('path')
require('shelljs/global')
var childProcess = require('child_process')
var fs = require('fs')
var log = console.log

function makeShrinkwrapFile(projectPath, useDev, callback) {
  childProcess.exec('cd ' + projectPath + ' && npm shrinkwrap' + (useDev ? ' --dev' : ''), callback)
}

function travelPackages(dependencies, callback) {
  Object.keys(dependencies).forEach(function(name) {
    callback(name, dependencies[name])
    if (dependencies[name].dependencies) {
      travelPackages(dependencies[name].dependencies, callback)
    }
  })
}

function nameAddVer(name, dep) {
  return name + '@' + dep.version
}

function getAllPackages(dependencies) {
  var out = {}
  travelPackages(dependencies, function(name, dep) {
    out[nameAddVer(name, dep)] = dep.resolved
  })
  return out
}

function classify(npmCachePath, packages) {
  var out = {
    cached: {},
    noCached: {}
  }
  Object.keys(packages).forEach(function(name) {
    var filepath = getCachedPackage(npmCachePath, name)
    if (filepath) {
      out.cached[name] = filepath
    } else {
      out.noCached[name] = packages[name]
    }
  })
  return out
}

function getCachedPackage(npmCachePath, name) {
  var pkgInfo = name.match(/([^@]+)@(.+)/)
  var filepath = path.join(npmCachePath, pkgInfo[1], pkgInfo[2], 'package.tgz')
  if (fs.existsSync(filepath)) {
    return filepath
  }
}

function exit() {
  Array.prototype.slice.apply(arguments).forEach(function(msg) {
    log(msg)
  })
  process.exit()
}

function packageToFileName(packageDir, name) {
  return path.join(packageDir, name.replace('@', '-') + '.tgz')
}

function copyCache(packages, packageDir) {
  Object.keys(packages).forEach(function(name) {
    var dist = packageToFileName(packageDir, name)
    if (!fs.existsSync(dist)) {
      cp(packages[name], dist)
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

function writeShrinkwrap(pkgPath, pkgJson) {
  travelPackages(pkgJson.dependencies, function(name, dep) {
    dep.resolved = './node_packages/' + packageToFileName('', name)
  })
  fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 4), 'utf8')
}

module.exports = function(projectPath, useDev, addCache) {
  useDev = useDev || true
  addCache = addCache || false
  var packageDir = path.join(projectPath, 'node_packages')
  makeShrinkwrapFile(projectPath, useDev, function(err, out, errMsg) {
    if (err) {
      exit(errMsg)
    }
    log(out)
    var pkgPath = path.join(projectPath, 'npm-shrinkwrap.json')
    var pkg = require(pkgPath)
    var packages = getAllPackages(pkg.dependencies)
    log('total packages count: ' + Object.keys(packages).length)
    childProcess.exec('npm config get cache', function(err, npmCachePath) {
      if (err) {
        exit('get cache path error: ', err)
      }
      npmCachePath = npmCachePath.trim()
      var classifiedPackages = classify(npmCachePath, packages)
      mkdir('-p', packageDir)
      if (Object.keys(classifiedPackages.noCached).length === 0) {
        copyCache(classifiedPackages.cached, packageDir)
        writeShrinkwrap(pkgPath, pkg)
      } else {
        hint(classifiedPackages.noCached, packageDir)
      }
    })
  })
}
