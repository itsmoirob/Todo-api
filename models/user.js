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
				},
				findByToken: function (token) {
					return new Promise(function (resolve, reject) {
						console.log('pretry');
						try {
							console.log('try1');
							var decodedJWT = jwt.verify(token, 'poiuy0987');
							console.log('try2');
							console.log('decodedJWT: ', decodedJWT);
							var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!"£');
							console.log('bytes: ', bytes);
							var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
							console.log('tokenData: ', tokenData);

							user.findById(tokenData.id).then(function (user) {
								if (user) {
									resolve(user);
								} else {
									reject();
								}
							}, function (e) {
								console.log(e);
								reject;
							})
						} catch (e) {
							console.log(e);
							reject();
						}
					})
				}
			},
			instanceMethods: {
				toPublicJSON: function () {
					var json = this.toJSON();
					return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
				},
				generateToken: function (type) {
					if (!_.isString(type)) {
						return undefined;
					}
					try {
						var stringData = JSON.stringify({
							id: this.get('id'),
							type: type
						});
						var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!"£').toString();
						var token = jwt.sign({
							token: encryptedData
						}, 'poiuy0987');

						return token;
					} catch (e) {
						return undefined;
					}
				}
			}
		});

	return user;
};