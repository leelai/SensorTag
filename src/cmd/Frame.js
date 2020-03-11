/**
 * The basic data packet for bluetooth gatt transmission
 */
const Packet = require('./Packet.js');

class Frame {
  constructor(seq, count, idx, data) {
    this.seq = seq;
    this.count = count;
    this.idx = idx;
    this.data = data;
  }

  /**
   * Calculate payload of a frame
   * @param mtu
   * @return
   */
  getPayload(mtu) {
    const SEQ_SIZE = 4;
    const PACKET_COUNT_SIZE = 4;
    const PACKET_INDEX_SIZE = 4;
    const PACKET_LENGTH_SIZE = 2;
    const CHECKSUM_SIZE = 4;

    const headerSize =
      SEQ_SIZE + PACKET_COUNT_SIZE + PACKET_INDEX_SIZE + PACKET_LENGTH_SIZE;
    const payload = mtu - 5 - headerSize - CHECKSUM_SIZE;

    return payload;
  }

  /**
   * Calculate payload of a frame
   * @param mtu
   * @return
   */
  static getPayload(mtu) {
    console.log('getPayload mtu=' + mtu);
    const SEQ_SIZE = 4;
    const PACKET_COUNT_SIZE = 4;
    const PACKET_INDEX_SIZE = 4;
    const PACKET_LENGTH_SIZE = 2;
    const CHECKSUM_SIZE = 4;

    const headerSize =
      SEQ_SIZE + PACKET_COUNT_SIZE + PACKET_INDEX_SIZE + PACKET_LENGTH_SIZE;
    const payload = mtu - 5 - headerSize - CHECKSUM_SIZE;
    console.log('getPayload payload size=' + payload);
    return payload;
  }

  /**
   * Generate frame packet
   * @return
   */
  toPacket() {
    let p = new Packet();
    p.putInt(this.seq);
    p.putInt(this.count);
    p.putInt(this.idx);
    p.putMediumByteArray(this.data);
    p.putInt(p.generateChecksum());
    return p.toPacket();
  }

  /**
   * Parse frame packet
   * @param data
   * @return
   */
  static fromPacket(data) {
    let p = new Packet(data);
    if (p.verifyChecksum()) {
      let f = new Frame();
      f.seq = p.getInt();
      f.count = p.getInt();
      f.idx = p.getInt();
      f.data = p.getMediumByteArray();
      return f;
    }
    return null;
  }
}

module.exports = Frame;
