'use strict';

const MongoDb = require('mongodb').Db;
const MongoServer = require('mongodb').Server;
const util = require('util');
const _ = require('underscore');

const Database = require('lib/entities/database');
const errors = require('lib/errors');

/**
 * @class Connection
 */
class Connection {
  /**
   * @constructor Connection
   *
   * @param {Object} options
   * @param {String} options.name
   * @param {String} options.host
   * @param {String} options.port
   */
  constructor(options) {
    options = options || {};

    var _this = this;
    _this.id = options.id;
    _this.name = options.name || 'local';
    _this.host = options.host || 'localhost';
    _this.port = options.port || 27017;
    _this.databases = [];
  }

  /**
   * @method connect
   * @param {Function} next - callback function
   */
  connect(next) {
    var _this = this;

    if (_this.host === 'localhost') getDbsForLocalhostConnection(_this, next);
    else return next(null);
  }

  /**
   * @method addDatabase
   * @param {Object} options
   * @param {String} config.name
   */
  addDatabase(options) {
    options = options || {};

    var _this = this;

    var existingDatabase = _.findWhere(_this.databases, {
      name: options.name
    });

    if (existingDatabase) return;

    var database = new Database({
      id: options.id,
      name: options.name,
      host: options.host,
      port: options.port,
      auth: options.auth,
      connection: _this
    });

    _this.databases.push(database);

    return database;
  }
}

/**
 * @function getDbsForLocalhostConnection
 * @param {Function} next - callback function
 */
function getDbsForLocalhostConnection(connection, next) {
  if (!connection) return next(new Error('connection is required'));
  if (!next) return next(new Error('next is required'));
  if (connection.host !== 'localhost') return next(new Error('cannot get local dbs for non localhost connection'));

  var localDb = new MongoDb('local', new MongoServer(connection.host, connection.port));

  localDb.open(function(err, db) {
    if (err) return next(new errors.ConnectionError(util.format('An error occured when trying to connect to %s', connection.host)));

    // Use the admin database for the operation
    var adminDb = db.admin();

    // List all the available databases
    adminDb.listDatabases((err, result) => {
      if (err) return next(new errors.DatabaseError(err));

      db.close();

      _.each(result.databases, (db) => {
        connection.addDatabase({
          name: db.name,
          host: connection.host,
          port: connection.port
        });
      });

      return next(null);
    });
  });
}

/**
 * @exports
 */
module.exports = Connection;
