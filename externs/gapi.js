/*
 * JSON API.
 */

var JSON = {};

/**
 * @param {string} text
 * @param {(function(string, *) : *)=} opt_reviver
 * @return {*}
 * @see http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
 */
JSON.parse = function(text, opt_reviver) {};

/**
 * @param {*} value
 * @param {(Array.<string>|(function(string, *) : *)|null)=} opt_replacer
 * @param {(number|string)=} opt_space
 * @return {string}
 * @see http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
 */
JSON.stringify =
  function(value, opt_replacer, opt_space) {};

var gapi = {};
gapi.auth = {};

/** @constructor */
gapi.auth.Token = function() {
  /** @type {string} TODO ? */
  this.error;
  /** @type {string} */
  this.access_token;
};
/**
 * @param {{client_id: string, scope: string, immediate: boolean}} setting
 * @param {Function} callback
 */
gapi.auth.authorize = function(setting, callback) {};
/** @return {gapi.auth.Token} */
gapi.auth.getToken = function() {};


gapi.client = {};

/**
 * @param {{
 *   path: string,
 *   method: string,
 *   params: {
 *     uploadType: string
 *   },
 *   headers: {
 *     'Content-Type': string
 *   },
 *   body: string
  }} request
 */
gapi.client.request = function(request) {};

gapi.client.drive = {
  files: {
    list: function() {}
  }
};