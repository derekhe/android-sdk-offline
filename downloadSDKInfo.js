'use strict'
/**
 * Created by hesicong on 2015/7/18.
 */

var request = require('request-promise');
var async = require('async');
var _ = require('lodash');
var xml2js = require('xml2js');
var path = require('path');
var fs = require('fs');

var repo = [
    'http://dl.google.com/android/repository/repository-11.xml',
    'http://dl.google.com/android/repository/repository-10.xml',
    'http://dl.google.com/android/repository/addon-6.xml',
    'http://dl.google.com/android/repository/addon.xml',
    'http://dl.google.com/android/repository/extras/intel/addon.xml',
    'http://dl.google.com/android/repository/sys-img/android-tv/sys-img.xml',
    'http://dl.google.com/android/repository/sys-img/android-wear/sys-img.xml',
    'http://dl.google.com/android/repository/sys-img/android/sys-img.xml',
    'http://dl.google.com/android/repository/sys-img/google_apis/sys-img.xml',
    'http://dl.google.com/android/repository/sys-img/x86/addon-x86.xml',
    'https://dl-ssl.google.com/glass/gdk/addon.xml'
];

function fixUrl(dirname, js) {
    if (!_.isObject(js)) return;

    _.each(_.keys(js), function (k) {
        if (k == "url") {
            if (!_.startsWith(js[k], "http")) {
                js[k] = dirname + "/" + js[k];
            }
        }

        fixUrl(dirname, js[k]);
    });
}

function fetchDetailInfomation(callback) {
    async.map(repo, function (url, done) {
            console.log("Fetching from", url);
            request(url).then(function (body) {
                xml2js.parseString(body, {
                    tagNameProcessors: [function (tag) {
                        return tag.replace("sdk:", "");
                    }]
                }, function (err, js) {
                    var dirname = path.dirname(url);
                    fixUrl(dirname, js);
                    done(err, js);
                });
            }).catch(function (err) {
                console.error("can't fetch " + url + " skip", err);
                done(null, null);
            })
        }
        , function (err, results) {
            var mergeAllResults = {};
            _.each(results, function (r) {
                mergeAllResults = _.merge(mergeAllResults, r);
            });

            var mergedAllCategory = {};
            _.each(_.keys(mergeAllResults), function (k) {
                mergedAllCategory = _.merge(mergeAllResults[k], mergedAllCategory);
            });

            console.log("Got all category");
            callback(null, mergedAllCategory);
        })
}

function getVersion(rev) {
    return rev["major"] + "." + rev["minor"] + "." + rev["micro"];
}

function getApis(sdk) {
    var apiLevels = {};
    apiLevels = _.merge(apiLevels, getApi(sdk, "add-on", "Add-on"));
    apiLevels = _.merge(apiLevels, getApi(sdk, "platform", "SDK Platform"));
    apiLevels = _.merge(apiLevels, getApi(sdk, "sample", "Samples"));
    apiLevels = _.merge(apiLevels, getApi(sdk, "system-image", "System Image"));
    apiLevels = _.merge(apiLevels, getApi(sdk, "source", "Source code"));
    return apiLevels;
}

function isObsolete(item) {
    return !_.isUndefined(item["obsolete"]);
}

function getApi(sdk, items, defaultDescription) {
    var apiLevels = {};
    _.each(sdk[items], function (item) {
        var level = item["api-level"][0];
        var existLevel = apiLevels[level];
        existLevel = existLevel || [];
        var value = {
            description: function () {
                if (_.isUndefined(item['description'])) {
                    return defaultDescription;
                }

                return item['description'][0];
            }(),
            version: item['revision'][0],
            archives: item['archives'],
            obsolete: isObsolete(item)
        };
        existLevel.push(value);

        apiLevels[item["api-level"]] = existLevel;
    });

    return apiLevels;
}

//DEBUG
function writeToFile(sdk, callback) {
    fs.writeFileSync("temp.json", JSON.stringify(sdk, null, 2));
    callback(null, sdk);
}

function getExtras(sdk) {
    return _.map(sdk['extra'], function (item) {
        return {
            description: item['name-display'],
            version: getVersion(item['revision'][0]),
            archives: item['archives'],
            obsolete: isObsolete(item)
        }
    });
}

function getTools(sdk, s, desc) {
    return _.map(sdk[s], function (tag) {
        return {
            description: desc,
            version: getVersion(tag["revision"][0]),
            obsolete: isObsolete(tag),
            archives: tag["archives"]
        }
    })
}

function postProcess(sdk, callback) {
    console.log("Post processing");
    var info = {
        tools: {
            "buildTools": getTools(sdk, 'build-tool', 'Android SDK Build-tools'),
            "platformTools": getTools(sdk, 'platform-tool', 'Android SDK Platform-tools'),
            "sdkTools": getTools(sdk, 'tool', 'Android SDK Tools')
        },
        apis: getApis(sdk),
        extras: getExtras(sdk)
    };

    var outputFileName = "out/sdk.json";
    console.log("Writing to", outputFileName);
    fs.writeFileSync(outputFileName, JSON.stringify(info, null, 2));
    callback(null, sdk);
}

async.waterfall([
    fetchDetailInfomation,
    //writeToFile,
    postProcess
], function (err, results) {
    console.log("Done");
});