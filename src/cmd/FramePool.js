const Frame = require('./Frame.js');

class FramePool {
    // private int seq;
    // private int frameCount = 0;
    // private int totalDataSize = 0;
    // private Frame[] frames;

    // private long createTime;

    constructor(seq, count) {
        console.log('FramePool: count=' + count);
        this.seq = seq;
        this.frames = []; //new Frame[count];
        this.framesSize = count;
        this.createTime = Date.now();
        this.frameCount = 0;
        this.totalDataSize = 0;
    }

    /**
     * Add frame into pool
     * @param frame
     * @return
     */
    addFrame(frame) {
        // check seq
        if (frame.seq != this.seq) {
            console.log('addFrame fail: seq mismatch');
            return false;
        }

        // check count
        if (frame.count != this.framesSize) {
            console.log('addFrame fail: count mismatch');
            return false;
        }

        // check idx
        if (frame.idx >= this.framesSize) {
            console.log('addFrame fail: invalid idx');
            return false;
        }

        // check data
        if (frame.data == null) {
            console.log('addFrame fail: invalid data');
        }

        if (this.frames[frame.idx] != null) {
            console.log('addFrame fail: duplicate');
            return false;
        }

        console.log('FramePool: frame.idx=' + frame.idx);
        this.frames[frame.idx] = frame;
        console.log(this.frames);
        this.frameCount += 1;
        console.log('FramePool: frameCount=' + this.frameCount);
        this.totalDataSize += frame.data.length;
        return true;
    }

    /**
     * Determine pool is full or not
     * @return
     */
    isFull() {
        return this.frameCount == this.framesSize;
    }

    /**
     * Extract original data(command or response packet) from all cached frames
     * @return
     */
    merge() {
        if (!this.isFull()) return null;

        let data = new Uint8Array(this.totalDataSize);

        let idx = 0;
        let i = 0;
        for (i = 0; i < this.frames.length; i++) {
            let f = this.frames[i];
            data.set(f.data, idx);
            idx += f.data.length;
        }
        return data;
    }
}

module.exports = FramePool;
