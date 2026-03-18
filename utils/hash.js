// const hash = bcrypt.hashSync("admin123", 10);
// console.log(hash);

const bcrypt = require("bcryptjs");

const comparePassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

module.exports = { comparePassword };
