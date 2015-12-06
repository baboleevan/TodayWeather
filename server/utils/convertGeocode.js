
"use strict";

var events = require('events');
var req = require('request');
var xml2json  = require('xml2js').parseString;
var convert = require('./coordinate2xy');
var keyBox = require('../config/config').keyString;

function convertGeocodeByDaum(first, second, third, callback) {
    var url = 'https://apis.daum.net/local/geo/addr2coord'+
        '?apikey=' + keyBox.daum_key +
        '&q='+ encodeURIComponent(first + second + third) +
        '&output=json';
    var encodedUrl = url;

    var meta = {};
    meta.method = 'convertGeocode';
    meta.first = first;
    meta.second = second;
    meta.third = third;
    meta.url = url;

    log.info(meta.method + ' : ', url);
    req.get(encodedUrl, {json:true}, function(err, response, body) {
        if (err) {
            //log.error(err);
            //log.error('#', meta);

            if (callback) {
                callback(err);
            }
            return;
        }
        var statusCode = response.statusCode;

        if (statusCode === 404 || statusCode === 403 || statusCode === 400) {
            //log.error('ERROR!!! StatusCode : ', statusCode);
            //log.error('#', meta);

            if (callback) {
                callback(err);
            }
            return;
        }

        var geocode = {
            lat: 0,
            lon: 0
        };
        var resultXY = {
            mx: 0,
            my: 0
        };
        try {
            geocode.lat = body.channel.item[0].lat;
            geocode.lon = body.channel.item[0].lng;

            log.info('lat:', geocode.lat, 'lon:', geocode.lon);
            resultXY.lat = geocode.lat;
            resultXY.lon = geocode.lon;

            var conv = new convert(geocode, {}).toLocation();
            resultXY.mx = conv.getLocation().x;
            resultXY.my = conv.getLocation().y;

            log.info('mx:', resultXY.mx, 'my :', resultXY.my);
        }
        catch (e) {
            log.error('## Error!!!', meta);
        }
        finally {
            if (callback) {
                callback(err, resultXY);
            }
        }
    });
}

function convertGeocodeByGoogle(first, second, third, callback) {
    var encodedUrl;

    var meta = {};
    meta.method = 'convertGeocode';
    meta.first = first;
    meta.second = second;
    meta.third = third;

    var url = 'https://maps.googleapis.com/maps/api/geocode/xml';
    url += '?address=' + first + second + third + '&language=ko';
    encodedUrl = encodeURI(url);

    req.get(encodedUrl, null, function(err, response, body){
        if(err) {
            //log.error(err);
            //log.error('#', meta);

            if(callback){
                callback(err);
            }
            return;
        }
        var statusCode = response.statusCode;

        if(statusCode === 404 || statusCode === 403 || statusCode === 400){
            //log.error('ERROR!!! StatusCode : ', statusCode);
            //log.error('#', meta);

            if(callback){
                callback(err);
            }
            return;
        }

        log.silly(body);
        xml2json(body, function(err, result){
            var geocode = {
                lat: 0,
                lon: 0
            };
            var resultXY = {
                mx: 0,
                my: 0
            };
            try {
                //log.info(result);
                //log.info(result.GeocodeResponse.result[0].geometry[0].location[0]);
                //log.info('lat : ' + result.GeocodeResponse.result[0].geometry[0].location[0].lat[0]);
                //log.info('lng : ' + result.GeocodeResponse.result[0].geometry[0].location[0].lng[0]);

                geocode.lat = parseFloat(result.GeocodeResponse.result[0].geometry[0].location[0].lat[0]);
                geocode.lon = parseFloat(result.GeocodeResponse.result[0].geometry[0].location[0].lng[0]);

                log.info('lat:', geocode.lat, 'lon:', geocode.lon);
                resultXY.lat = geocode.lat;
                resultXY.lon = geocode.lon;

                var conv = new convert(geocode, {}).toLocation();
                resultXY.mx = conv.getLocation().x;
                resultXY.my = conv.getLocation().y;

                log.info('mx:', resultXY.mx, 'my :', resultXY.my);
            }
            catch(e){
                log.error('## Error!!!', meta);
            }
            finally{
                if(callback){
                    callback(err, resultXY);
                }
            }
        });
    });
}

function convertGeocode(first, second, third, callback){
    convertGeocodeByGoogle(first, second, third, function(err, resultXY) {
        if (err)  {
            log.warn(err);
            convertGeocodeByGoogle(first, second, third, function(err, resultXY){
                if (err) {
                    log.error(err);
                }
                callback(err, resultXY);
            });
            return;
        }
        return callback(err, resultXY);
    });
}

module.exports = convertGeocode;

