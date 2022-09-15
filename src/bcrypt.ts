const bcrypt = require('bcrypt');
const saltRounds = 8;

const myPlaintextPassword = 'Mystr0ngP@SSW0RD';
var hashAsync;
var hashSync;
console.time('bcrypt_Async Generate Hash');
bcrypt.hash(myPlaintextPassword, saltRounds).then(function (hash:any) {
    hashAsync = hash;

    console.timeEnd('bcrypt_Async Generate Hash');

    console.time('bcrypt_Async Compare Hash');

    bcrypt.compare(myPlaintextPassword, hashAsync).then(function (result:any) {
        console.timeEnd('bcrypt_Async Compare Hash');

    });
});
console.time('bcrypt_Sync Generate Hash');
hashSync = bcrypt.hashSync(myPlaintextPassword, saltRounds);
console.timeEnd('bcrypt_Sync Generate Hash');
console.time('bcrypt_Sync Compare Hash');
bcrypt.compareSync(myPlaintextPassword, hashSync);
console.timeEnd('bcrypt_Sync Compare Hash');

