const Command = require('./Command.js')
const Packet = require('./Packet.js')

class OOBEStateCommand extends Command {

    /* Bluetooth device name */
    deviceName;

    getDeviceName() {
        return this.deviceName;
    }

    setDeviceName(deviceName) {
        this.deviceName = deviceName;
    }

    getCmdType() {
        return Command.CommandTypes.CMD_OOBE_State;
    }

    writeToPacket(p) {
        p.putSmallString(this.getDeviceName());
    }

    // initFromPacket(p) {
    //     setDeviceName(p.getSmallString());
    // }
}

module.exports = OOBEStateCommand