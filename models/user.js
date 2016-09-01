var bcrypt = require('bcryptjs');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function (sequelize, Datatypes) {

	var user = sequelize.define('user', {
		email: {
			type: Datatypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		password_hash: {
			type: Datatypes.STRING
		},
		password: {
			type: Datatypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},
			set: function (value) {
				var salt = bcrypt.genSaltSync(10);
				var hashPassword = bcrypt.hashSync(value, salt);
				this.setDataValue('password', value);
				this.setDataValue('password_hash', hashPassword);
			}
		}
	}, {
			hooks: {
				beforeValidate: function (user, options) {
					if (typeof user.email === "string") {
						user.email = user.email.toLowerCase();
					}
				}
			},
			classMethods: {
				authenticate: function (body) {
					return new Promise(function (resolve, reject) {
						if (typeof body.email !== 'string' || typeof body.password !== 'string') {
							return reject();
						}
						user.findOne(
							{
								where:
								{
									email: body.email
								}
							}).then(function (user) {
								if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
									return reject();
								}
								resolve(user);
							}, function (e) {
								reject();
							});
					});
				}
			},
			instanceMethods: {
				toPublicJSON: function () {
					var json = this.toJSON();
					return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
				}, 
				generateToken: function (type) {
					if(!_.isString(type)) {
						return undefined;
					} 
					try {
						var stringData = JSON.stringify({id: this.get('id'), type: type});
						var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!"£').toString();
						var token = jwt.sign({
							token: encryptedData
						}, 'poiuy0987');

						return encryptedData;
					} catch (e) {
						return undefined;
					}
				}
			}
		});

	return user;
};