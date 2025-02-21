/*
 * This example is to show the length limit of bcrypt, which is not in argon2.
 * Bcrypt has a limit of 72 characters, which means that if you hash a password with more than 72 characters, it will only hash the first 72 characters.
 */

import argon2 from "argon2";
// import bcrypt from "bcryptjs"; // There are two bcrypt package on npm repository.
// One is bcryptjs and another is bcrypt. Both have same syntax, but bcrypt is faster than bcryptjs.
// That's because bcrypt uses C++ implementation, and bcryptjs is a JavaScript implementation.
// Bcryptjs can work on browsers too because it's a JavaScript implementation.

async function hashPassword(password) {
  return argon2.hash(password);
  //   return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hashedPassword) {
  return argon2.verify(hashedPassword, password);
  //   return bcrypt.compare(password, hashedPassword);
}

// Change the length value to less than 72, and more than 72 to see the difference
// When it's more than 72, bcrypt will say that all passwords match against each other when they don't.
// it's because first 72 characters of both passwords are same.
// if you try same with argon2 it won't happen there.
const password1 = Array.from({ length: 93 }).fill("x").join("");
const password2 = Array.from({ length: 93 }).fill("x").join("") + Math.random();
console.log({ password1, password2 });

const hashedPassword1 = await hashPassword(password1);
const hashedPassword2 = await hashPassword(password2);

console.log("1 - 1", await verifyPassword(password1, hashedPassword1));
console.log("2 - 1", await verifyPassword(password2, hashedPassword1));
console.log("2 - 2", await verifyPassword(password2, hashedPassword2));
console.log("1 - 2", await verifyPassword(password1, hashedPassword2));
