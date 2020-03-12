const Command = require('./Command.js');
const Packet = require('./Packet.js');

class WifiScanCommand extends Command {
    /* Bluetooth device name */
    #dummyData = 0

    constructor() {
        super();
    }

    getCmdType() {
        return Command.CMD_Wifi_Scan;
    }

    writeToPacket(p) {
        p.putInt(this.#dummyData);
    }

    initFromPacket(p) {
        this.#dummyData = p.getInt();
    }
}

module.exports = WifiScanCommand;
