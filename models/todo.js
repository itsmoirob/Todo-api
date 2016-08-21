module.exports = function (sequelize, Datatypes) {
	return sequelize.define('todo', {
		description: {
			type: Datatypes.STRING,
			allowNull: false,
			validate: {
				len: [1, 250]
			}
		},
		completed: {
			type: Datatypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}, {
			validate: {
				descriptionIsString: function () {
					if (!_.isString(this.description)) {
						throw new Error('Description must be a string');
					}
				}
			}
		});
};