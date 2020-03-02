/**
 * Utility class for packing/unpacking values
 */

/**
 * Prepare enough buffer for packing
 * @param size
 */

const CRC32 = require('crc-32');

class Packet {

    //multiple constructor
    constructor(buf) {
        if (!arguments.length) {
            this.buf = new Uint8Array(128);
        } else {
            this.buf = buf
        }
        this.idx = 0;
    }

    /**
     * Prepare enough buffer for packing
     * @param size
     */
    _ensureSize(size) {
        if (this.buf.length < size) {
            let newBuf = new Uint8Array(Math.max(this.buf.length * 2, size));
            newBuf.set(this.buf);
            this.buf = newBuf;
        }
    };

    putByte(b) {
        this._ensureSize(this.idx + 1);
        this.buf[this.idx] = b;
        this.idx += 1;
    }

    getByte() {
        let b = this.buf[idx];
        this.idx += 1;
        return b;
    }

    _putIntToBuf(int) {
        for (let index = 0; index < 4; index++) {
            let byte = int & 0xff;
            this.buf[this.idx] = byte;
            int = (int - byte) / 256;
            this.idx += 1;
        }
    };

    _putShortToBuf(short) {
        for (let index = 0; index < 2; index++) {
            let byte = short & 0xff;
            this.buf[this.idx] = byte;
            short = (short - byte) / 256;
            this.idx += 1;
        }
    };

    /**
     * Unpacking string using one byte to present string size
     * @return
     */
    getSmallString() {
        let len = this.getByte();
        if (len > 0) {
            let strBytes = new Uint8Array(len);
            let data = this.buf.slice(this.idx, len + 1)
            if (data == null) {
                return "";
            }
            strBytes.set(data)
            this.idx += len;
            return String.fromCharCode.apply(null, strBytes); //todo: convert to string
        } else {
            return "";
        }
    }

    getByte() {
        let b = this.buf[this.idx];
        this.idx += 1;
        return b;
    }


    /**
     * Packing byte array using two bytes to store array length
     * @param data
     */
    putMediumByteArray(data) {
        if (data == null || data.length == 0) {
            this._ensureSize(this.idx + 2);
            this.putShort(0);
        } else {
            let len = Math.min(data.length, 65535);
            this._ensureSize(this.idx + 2 + len);
            this.putShort(len);
            this.buf.set(data, this.idx)
            this.idx += len;
        }
    }

    putInt(/*uint32*/x) {
        this._ensureSize(this.idx + 4);
        this._putIntToBuf(x)
    }

    putShort(/*uint16*/ x) {
        this._ensureSize(this.idx + 2);
        this._putShortToBuf(x);
    }

    /**
     * Packing string using one byte to present string size
     * @param str
     */
    putSmallString(str) {
        if (str == null || str.length == 0) {
            this._ensureSize(this.idx + 1);
            this.putByte(0);
        } else {
            let strBytes = new TextEncoder("ascii").encode(str);
            let len = Math.min(strBytes.length, 255);
            this._ensureSize(this.idx + 1 + len);
            this.putByte(len);
            this.buf.set(strBytes, this.idx)
            this.idx += len;
        }
    }

    /**
     * Packing byte array using four bytes to store array length
     * @param data
     */
    putLargeByteArray(data) {
        if (data == null || data.length == 0) {
            this._ensureSize(idx + 4);
            this.putInt(0);
        } else {
            let len = data.length;
            this._ensureSize(this.idx + 4 + len);
            this.putInt(len);
            this.buf.set(data, this.idx)
            this.idx += len;
        }
    }

    /**
    * Generate checksum for packing
    * @return
    */
    generateChecksum() {
        return CRC32.buf(this.buf.slice(0, this.idx))
    }

    /**
     * Generate packet data
     * @return
     */
    toPacket() {
        let data = new Uint8Array(this.idx);
        data.set(this.buf.slice(0, this.idx))
        return data;
    }
}

module.exports = Packet

// var byteArrayToLong = function (/*byte[]*/byteArray) {
//     var value = 0;
//     for (var i = byteArray.length - 1; i >= 0; i--) {
//         value = (value * 256) + byteArray[i];
//     }

//     return value;
// };

// var longToByteArray = function (/*long*/long) {
//     // we want to represent the input as a 8-bytes array
//     var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];

//     for (var index = 0; index < byteArray.length; index++) {
//         var byte = long & 0xff;
//         byteArray[index] = byte;
//         long = (long - byte) / 256;
//     }

//     return byteArray;
// };

// var UInt32ToByteArray = function (int) {
//     // we want to represent the input as a 8-bytes array
//     var byteArray = new Uint8Array(4);

//     for (var index = 0; index < byteArray.length; index++) {
//         var byte = int & 0xff;
//         byteArray[index] = byte;
//         int = (int - byte) / 256;
//     }

//     return byteArray;
// };