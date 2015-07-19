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
            console.log(archive);
            if (_.isUndefined(archive['host-os'])) return "";
            return archive['host-os'][0];
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