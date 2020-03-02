/**
 * FrameFactory encapsulate data(command or response packet) in frames for bluetooth gatt transmission
 */

const Frame = require('./Frame.js')

class FrameFactory {

    /**
     * FrameFactory Constructor
     * @param seq unique sequence number
     * @param mtu MTU of bluetooth gatt transmission
     * @param data data(command or response packet)
     */
    constructor(seq, mtu, data) {
        console.log('FrameFactory( seq=' + seq + ', mtu=' + mtu + ', data=[' + data + '])')
        this.seq = seq;
        this.mtu = mtu;
        this.data = data;
        this.frameIdx = 0;
    }

    getFrameCount() {
        const payload = Frame.getPayload(this.mtu);
        console.log('getFrameCount data=' + this.data)
        console.log('getFrameCount data.length=' + this.data.length)
        console.log('getFrameCount payload=' + payload)
        return Math.floor((this.data.length + payload - 1) / payload);
    }

    /**
     * Calculate max data(command or response packet) size
     * @param mtu
     * @return
     */
    static getMaxCmdPacketSize(mtu) {
        const payload = Frame.getPayload(this.mtu);
        const maxPacketCount = 0xFFFF;
        return payload * maxPacketCount;
    }

    /**
     * Get sequence number
     * @return
     */
    getSeq() {
        return seq;
    }

    /**
     * Get data size
     * @return
     */
    getTotalDataSize() {
        return data == null ? 0 : data.length;
    }

    /**
     * Get remaining data size
     * @return
     */
    getRemainingDataSize() {
        const payload = Frame.getPayload(this.mtu);
        const offset = frameIdx * payload;
        const remaining = data.length - offset;
        return remaining < 0 ? 0 : remaining;
    }

    /**
     * Generate next frame for bluetooth gatt transmission
     * @return
     */
    nextFrame() {
        const payload = Frame.getPayload(this.mtu);
        const frameCount = this.getFrameCount();
        console.log('payload:' + payload + ', frameCount:' + frameCount)
        if (this.frameIdx < frameCount) {
            const offset = this.frameIdx * payload;
            console.log('offset:' + offset)
            const leftDataSize = this.data.length - offset;
            console.log('leftDataSize:' + leftDataSize)
            const sendDataSize = leftDataSize < payload ? leftDataSize : payload;
            console.log('sendDataSize:' + sendDataSize)
            let sendData = new Uint8Array(sendDataSize);
            sendData.set(this.data.slice(offset, offset + sendDataSize))
            // System.arraycopy(data,       offset,    sendData, 0, sendDataSize);
            // System.arraycopy(source_arr, sourcePos, dest_arr,destPos, len); 

            let f = new Frame();
            f.seq = this.seq;
            f.count = frameCount;
            f.idx = this.frameIdx;
            f.data = sendData;

            this.frameIdx += 1;

            return f;
        } else {
            return null;
        }
    }

    /**
     * Parse frame packet
     * @param data
     * @return
     */
    static fromPacket(data) {
        return Frame.fromPacket(data);
    }
}

module.exports = FrameFactory