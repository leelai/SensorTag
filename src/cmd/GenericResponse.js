const Response = require('../Response.js');
const Packet = require('./Packet.js');

class GenericResponse extends Response {
  #cmdType;
  #respData;

  get cmdType() {
    return this.#cmdType;
  }

  setCmdType(cmdType) {
    console.log('setCmdType:' + cmdType)
    this.#cmdType = cmdType;
    console.log('this.#cmdType:' + this.#cmdType)
  }

  get respData() {
    return this.#respData;
  }

  setRespData(respData) {
    this.#respData = respData;
  }

  get respData() {
    return this.#respData;
  }

  writeToPacket(p) {
    p.putLargeByteArray(this.getRespData());
  }

  initFromPacket(p) {
    this.setRespData(p.getLargeByteArray());
  }

  /**
   * Parse response packet
   * @param data
   * @return
   */
  static fromPacket(data) {
    let p = new Packet(data);

    if (!p.verifyChecksum()) {
      console.log('fromPacket fail: checksum error');
      return null;
    }

    let version = p.getByte();
    if (version != this.VERSION) {
      console.log('fromPacket fail: version mismatch');
      console.log(
        '  supported version is ' +
        this.VERSION +
        ', packet version is ' +
        version,
      );
      return null;
    }

    let cmdType = p.getShort() & 0xffff;
    console.log('fromPacket cmdType: ' + cmdType);

    let resp = new GenericResponse();
    resp.setCmdType(cmdType);
    console.log('fromPacket resp.cmdType: ' + resp.cmdType);
    resp.setSeq(p.getInt());
    resp.initFromPacket(p);
    return resp;
  }
}

module.exports = GenericResponse;
