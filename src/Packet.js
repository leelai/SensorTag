/**
 * Utility class for packing/unpacking values
 */

/**
 * Prepare enough buffer for packing
 * @param size
 */

const CRC32 = require('crc-32');
const Buffer = require('safe-buffer').Buffer;

class Packet {
  //multiple constructor
  constructor(buf) {
    if (!arguments.length) {
      this.buf = new Uint8Array(128);
    } else {
      this.buf = buf;
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
  }

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

  getInt() {
    let b3 = this.getByte();
    let b2 = this.getByte();
    let b1 = this.getByte();
    let b0 = this.getByte();

    return (b3 << 24) | ((b2 & 0xff) << 16) | ((b1 & 0xff) << 8) | (b0 & 0xff);
  }

  getShort() {
    let b1 = this.getByte();
    let b0 = this.getByte();
    console.log('b0:' + b0);
    console.log('b1:' + b1);
    return (b1 << 8) | (b0 & 0xff);
  }

  /**
   * Unpacking byte array using two bytes to store array length
   * @return
   */
  getMediumByteArray() {
    let len = this.getShort();

    if (len > 0) {
      let data = new Uint8Array(len);
      data.set(this.buf.slice(this.idx, this.idx + len));
      this.idx += len;
      return data;
    } else {
      return [];
    }
  }

  _putIntToBuf(int) {
    for (let index = 0; index < 4; index++) {
      let byte = int & 0xff;
      this.buf[this.idx + 3 - index] = byte;
      int = (int - byte) / 256;
    }
    this.idx += 4;
  }

  _putShortToBuf(short) {
    for (let index = 0; index < 2; index++) {
      let byte = short & 0xff;
      this.buf[this.idx + 1 - index] = byte;
      short = (short - byte) / 256;
    }
    this.idx += 2;
  }

  /**
   * Unpacking string using one byte to present string size
   * @return
   */
  getSmallString() {
    let len = this.getByte();
    if (len > 0) {
      let strBytes = new Uint8Array(len);
      let data = this.buf.slice(this.idx, len + 1);
      if (data == null) {
        return '';
      }
      strBytes.set(data);
      this.idx += len;
      return String.fromCharCode.apply(null, strBytes); //todo: convert to string
    } else {
      return '';
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
      this.buf.set(data, this.idx);
      this.idx += len;
    }
  }

  putInt(/*uint32*/ x) {
    this._ensureSize(this.idx + 4);
    this._putIntToBuf(x);
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
    console.log('Packet putSmallString:' + str);
    if (str == null || str.length == 0) {
      this._ensureSize(this.idx + 1);
      this.putByte(0);
    } else {
      let strBytes = str.split('').map(function (c) {
        return c.charCodeAt(0);
      });
      let len = Math.min(strBytes.length, 255);
      console.log('len =' + len);
      this._ensureSize(this.idx + 1 + len);
      this.putByte(len);
      this.buf.set(strBytes.slice(0, len), this.idx);
      this.idx += len;
    }
  }

  /**
   * Packing byte array using four bytes to store array length
   * @param data
   */
  putLargeByteArray(data) {
    console.log('Packet putLargeByteArray' + data);
    if (data == null || data.length == 0) {
      this._ensureSize(this.idx + 4);
      this.putInt(0);
    } else {
      let len = data.length;
      this._ensureSize(this.idx + 4 + len);
      this.putInt(len);
      this.buf.set(data, this.idx);
      this.idx += len;
    }
  }

  /**
   * Generate checksum for packing
   * @return
   */
  generateChecksum() {
    return CRC32.buf(this.buf.slice(0, this.idx));
  }

  convert(Uint8Arr) {
    var length = Uint8Arr.length;
    let buffer = Buffer.from(Uint8Arr);
    var result = buffer.readInt32BE(0, length);
    return result;
  }

  /**
   * Verify checksum for unpacking
   * @return
   */
  verifyChecksum() {
    if (this.buf == null || this.buf.length <= 6) {
      return false;
    }
    console.log('verifyChecksum:' + JSON.stringify(this.buf));
    let checksum_1 = CRC32.buf(this.buf.slice(0, this.buf.length - 4));
    console.log('checksum_1:' + checksum_1);
    console.log('crc32:' + this.buf.slice(this.buf.length - 4));
    let checksum_2 = this.convert(this.buf.slice(this.buf.length - 4));
    console.log('checksum_2:' + checksum_2);

    return checksum_1 == checksum_2;
  }

  /**
   * Unpacking byte array using four bytes to store array length
   * @return
   */
  getLargeByteArray() {
    let len = this.getInt();
    if (len > 0) {
      let data = new Uint8Array(len);
      data.set(this.buf.slice(this.idx, this.idx + len));
      // System.arraycopy(buf, idx, data, 0, len);
      this.idx += len;
      return data;
    } else {
      return new Uint8Array(0);
    }
  }

  /**
   * Generate packet data
   * @return
   */
  toPacket() {
    let data = new Uint8Array(this.idx);
    data.set(this.buf.slice(0, this.idx));
    // console.log(JSON.stringify(data));
    // console.log('Packet toPacket()=' + data);
    return data;
  }
}

module.exports = Packet;
