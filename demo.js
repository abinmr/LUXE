import bcrypt from "bcrypt";

const password = "$2b$10$b9aUDD1MQwUP85mpJtAdWeREFPKV4ymD68tSk2GmS5tSyBUPbvjIu";
const p = "ashik@12345";
const result = await bcrypt.compare(p, password);
// const enc = await bcrypt.hash(p, 10);
console.log(result);
