var bcryptjs = require('bcryptjs');
const saltRounds = 8;
const myPlaintextPassword = 'Mystr0ngP@SSW0RD';
var hashAsync;
var hashSync;
console.time('bcryptjs_Async Generate Hash');
bcryptjs.hash(myPlaintextPassword, saltRounds).then(function (hash:any) {hashAsync = hash;
    console.timeEnd('bcryptjs_Async Generate Hash');
    console.time('bcryptjs_Async Compare Hash');
bcryptjs.compare(myPlaintextPassword, hashAsync).then(function (result:any) {console.timeEnd('bcryptjs_Async Compare Hash');
});
});
console.time('bcryptjs_Sync Generate Hash');
hashSync = bcryptjs.hashSync(myPlaintextPassword, saltRounds);
console.timeEnd('bcryptjs_Sync Generate Hash')
console.time('bcryptjs_Sync Compare Hash');
bcryptjs.compareSync(myPlaintextPassword, hashSync);
console.timeEnd('bcryptjs_Sync Compare Hash');
