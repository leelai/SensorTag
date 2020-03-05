const Command = require('./Command.js');
const Packet = require('./Packet.js');

class GenericCommand extends Command {
  cmdType;
  cmdData;

  constructor() {
    super();
  }

  getCmdType() {
    return this.cmdType;
  }

  setCmdType(cmdType) {
    this.cmdType = cmdType;
  }

  getCmdData() {
    return this.cmdData;
  }

  setCmdData(cmdData) {
    this.cmdData = cmdData;
  }

  writeToPacket(p) {
    console.log('GenericCommand writeToPacket');
    // let cmdData = this.getCmdData();
    // console.log(JSON.stringify(cmdData));
    p.putLargeByteArray(this.getCmdData());
  }

  initFromPacket(p) {
    setCmdData(p.getLargeByteArray());
  }

  /**
   * Generate command packet
   * @return
   */
  toPacket() {
    let p = new Packet();
    p.putByte(this.getVersion());
    p.putShort(this.getCmdType());
    p.putInt(this.getSeq());
    this.writeToPacket(p);
    p.putInt(p.generateChecksum());
    return p.toPacket();
  }
}

module.exports = GenericCommand;
