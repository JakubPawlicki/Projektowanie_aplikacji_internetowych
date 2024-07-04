const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config()

var connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

connection.connect(async function (err) {
    if (err) throw err;

    connection.query("CREATE TABLE IF NOT EXISTS `user` (`user_id` INT NOT NULL AUTO_INCREMENT, `user_name` VARCHAR(45) NOT NULL, `user_surname` VARCHAR(45) NOT NULL, `user_email` VARCHAR(50) NOT NULL, `user_password` VARCHAR(60) NOT NULL, PRIMARY KEY (`user_id`))", function (err, result) {
        if (err) throw err;
    });

    connection.query("CREATE TABLE IF NOT EXISTS `car` (`registration_number` VARCHAR(45) NOT NULL, `name` VARCHAR(45) NOT NULL, `category` VARCHAR(45) NOT NULL, `number_of_passengers` TINYINT(2) NOT NULL, `price` TINYINT(2) NOT NULL, `description` INT NULL, `status` VARCHAR(45) NOT NULL DEFAULT 'available', PRIMARY KEY (`registration_number`))", function (err, result) {
        if (err) throw err;
    });

    connection.query("CREATE TABLE IF NOT EXISTS `rents` (`id` INT NOT NULL AUTO_INCREMENT, `start_date` DATE NOT NULL, `end_date` DATE NOT NULL, `first_name` VARCHAR(45) NOT NULL, `last_name` VARCHAR(45) NOT NULL, `document_number` VARCHAR(45) NOT NULL, `registration_number` VARCHAR(45) NOT NULL, `active` TINYINT NOT NULL DEFAULT 1, PRIMARY KEY (`id`))", function (err, result) {
        if (err) throw err;
    });

    // Check if the default admin user exists
    connection.query("SELECT * FROM user WHERE user_email = 'admin@firma.pl'", async function (err, result) {
        if (err) throw err;

        if (result.length === 0) {
            // Hash the default password
            const hashedPassword = await bcrypt.hash('admin', 10);

            // Insert the default admin user
            connection.query("INSERT INTO user (user_name, user_surname, user_email, user_password) VALUES (?, ?, ?, ?)", ['admin', 'admin', 'admin@firma.pl', hashedPassword], function (err, result) {
                if (err) throw err;
                console.log('Default admin user added successfully.');
            });
        } else {
            console.log('Default admin user already exists.');
        }
    });
});

module.exports = connection;
