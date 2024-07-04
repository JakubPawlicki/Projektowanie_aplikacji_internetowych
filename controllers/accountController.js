const connection = require("../database");
const bcrypt = require('bcrypt');
const { response } = require("express");

exports.getUserData = (req, res) => {
    connection.query("SELECT * FROM user WHERE user_id=?", [req.user.authenticated_user.id], async (error, result) => {
        if (error)
            console.log(error);
        else {
            res.render('../views/userManagement/userSettings', {
                user_name: result.at(0).user_name,
                user_surname: result.at(0).user_surname,
                result,
                username: req.user.authenticated_user.name,
                id: req.user.authenticated_user.id
            });
        }
    });
};

exports.changeUserData = async (req, res) => {
    const { old_pass, new_pass, new_pass_rep } = req.body;

    var rows;

    await connection.promise().query("SELECT user_name, user_surname FROM user WHERE user_id=?", req.user.authenticated_user.id)
        .then(([rows_r, fields]) => {
            rows = rows_r;
            return;
        })
        .catch(console.log);

    if (new_pass === old_pass) {
        return res.render('../views/userManagement/userSettings', {
            error: "Twoje nowe hasło jest takie samo jak poprzednie",
            user_name: rows[0].user_name,
            user_surname: rows[0].user_surname,
            username: req.user.authenticated_user.name,
            id: req.user.authenticated_user.id
        });
    }

    if (new_pass !== new_pass_rep) {
        return res.render('../views/userManagement/userSettings', {
            user_name: rows[0].user_name,
            user_surname: rows[0].user_surname,
            error: "Nowe hasła różnią się",
            username: req.user.authenticated_user.name,
            id: req.user.authenticated_user.id
        });
    }

    connection.query("SELECT user_password FROM user WHERE user_id=?", [req.user.authenticated_user.id], async (error, result) => {
        if (error)
            console.log(error);
        else {
            let pass = result.at(0).user_password;
            const match = await bcrypt.compare(old_pass, pass);
            if (!match) {
                return res.render('../views/userManagement/userSettings', {
                    error: "Niepoprawne obecne hasło",
                    user_name: rows[0].user_name,
                    user_surname: rows[0].user_surname,
                    username: req.user.authenticated_user.name,
                    id: req.user.authenticated_user.id
                });
            } else {
                const hashedNewPassword = await bcrypt.hash(new_pass, 10);
                connection.query("UPDATE user SET user_password=? WHERE user_id=?", [hashedNewPassword, req.user.authenticated_user.id], async (error, result) => {
                    if (error)
                        console.log(error);
                    else {
                        return res.render('../views/userManagement/userSettings', {
                            message: "Poprawnie zmieniono hasło",
                            user_name: rows[0].user_name,
                            user_surname: rows[0].user_surname,
                            username: req.user.authenticated_user.name,
                            id: req.user.authenticated_user.id
                        });
                    }
                });
            }
        }
    });
};

exports.deleteAccountForm = (req, res) => {
    res.render('../views/userManagement/deleteAccount', {
        username: req.user.authenticated_user.name,
        id: req.user.authenticated_user.id
    });
};

exports.deleteAccount = (req, res) => {
    const { pass, pass_confirm } = req.body;

    if (pass !== pass_confirm) {
        return res.render('../views/userManagement/deleteAccount', {
            error: "Wprowadzone hasła różnią się",
            username: req.user.authenticated_user.name,
            id: req.user.authenticated_user.id
        });
    }

    connection.query("SELECT user_password FROM user WHERE user_id=?", [req.user.authenticated_user.id], async (error, result) => {
        if (error)
            console.log(error);
        else {
            let pass_db = result.at(0).user_password;
            const match = await bcrypt.compare(pass, pass_db);
            if (!match) {
                return res.render('../views/userManagement/deleteAccount', {
                    error: "Wprowadzone hasło jest niepoprawne",
                    username: req.user.authenticated_user.name,
                    id: req.user.authenticated_user.id
                });
            } else {
                connection.query("DELETE FROM user WHERE user_id=?", [req.user.authenticated_user.id], async (error, result) => {
                    if (error)
                        console.log(error);
                    else {
                        req.session.destroy(err => {
                            if (err) {
                                res.status(400).send('Wylogowanie nie powiodło się');
                            } else {
                                res.redirect('/');
                            }
                        });
                    }
                });
            }
        }
    });
};

exports.createAccount = async (req, res) => {
    const { first_name, last_name, email, password, password_conf } = req.body;

    if (first_name.length < 3) {
        return res.render('../views/userAuthorization/registerPage', {
            message: "Imię jest za krótkie", layout: false
        });
    }

    if (last_name.length < 3) {
        return res.render('../views/userAuthorization/registerPage', {
            message: "Nazwisko jest za krótkie", layout: false
        });
    }

    if (password.length < 6) {
        return res.render('../views/userAuthorization/registerPage', {
            message: "Hasło jest za krótkie", layout: false
        });
    }

    if (password !== password_conf) {
        return res.render('../views/userAuthorization/registerPage', {
            message: "Wprowadzone hasła różnią się", layout: false
        });
    }

    const re = new RegExp("^[A-Za-z0-9._%+-]+@firma\\.pl$");

    if (!re.test(email)) {
        return res.render('../views/userAuthorization/registerPage', {
            message: "Email musi być w domenie firma.pl", layout: false
        });
    }

    connection.query("SELECT user_id FROM user WHERE user_email=?", [email], async (error, result) => {
        if (error)
            console.log(error);
        else if (result.length === 0) {
            const hashedPassword = await bcrypt.hash(password, 10);
            connection.query("INSERT INTO user (user_name, user_surname, user_email, user_password) values (?,?,?,?)", [first_name, last_name, email, hashedPassword], async (error, result) => {
                if (error)
                    console.log(error);
                else {
                    return res.redirect('/');
                }
            });
        } else {
            res.render('../views/userAuthorization/registerPage', {
                layout: false,
                message: "Użytkownik o podanym adresie email już istnieje"
            });
        }
    });
};
