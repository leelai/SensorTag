const Command = require('./Command.js');
const Packet = require('./Packet.js');

class OOBEStateCommand extends Command {
  /* Bluetooth device name */

  constructor() {
    super();
  }

  getDeviceName() {
    return this.deviceName;
  }

  setDeviceName(deviceName) {
    this.deviceName = deviceName;
  }

  getCmdType() {
    console.log('OOBEStateCommand getCmdType():' + Command.CMD_OOBE_State);
    return Command.CMD_OOBE_State;
  }

  writeToPacket(p) {
    console.log('OOBEStateCommand writeToPacket:' + this.getDeviceName());
    p.putSmallString(this.getDeviceName());
  }

  // initFromPacket(p) {
  //     setDeviceName(p.getSmallString());
  // }
}

module.exports = OOBEStateCommand;
