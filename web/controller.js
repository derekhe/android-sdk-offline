/**
 * Created by hesicong on 2015/7/18.
 */

angular.module("app", ['ngResource', 'ngLodash'])
    .controller("controller", ['$scope', '$resource', 'lodash', function (vm, resource, _) {
        vm.showObsolete = false;
        vm.showObsoleteFn = function (item) {
            if (vm.showObsolete) {
                return true;
            }

            return item.obsolete == vm.showObsolete;
        };

        vm.getOS = function (archive) {
            if (_.isUndefined(archive['host-os'])) return "any";
            return archive['host-os'][0];
        };

        vm.os = {
            windows: true,
            macosx: true,
            linux: true,
            any: true
        };

        vm.getDownloadLinks = function () {
            var links = '';

            _.each(downloadLinks, function (link) {
                links = links + link + "\r\n";
            });

            return links
        };

        var downloadLinks = [];

        vm.changeDownloadLink = function (item) {
            if (item.download) {
                _.each(item.archives[0].archive, function (d) {
                    if (vm.os[vm.getOS(d)]) {
                        downloadLinks.push(d.url);
                    }
                });
            }
            else {
                _.each(item.archives[0].archive, function (d) {
                    console.log(d.url, downloadLinks);
                    _.remove(downloadLinks, function (n) {
                        return n === d.url;
                    });
                });
            }

            downloadLinks = _.uniq(downloadLinks);
        };

        vm.selectLevel = function (level) {
            _.each(level.items, function (item) {
                item.download = level.download;

                vm.changeDownloadLink(item);
            });
        };

        resource("sdk.json").get(function (sdk) {
            vm.sdk = sdk;
        });
    }])
    .filter('bytes', function () {
        return function (bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
            if (typeof precision === 'undefined') precision = 1;
            var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
        }
    });