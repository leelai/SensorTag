const Frame = require('./Frame.js');
const FrameFactory = require('./FrameFactory.js');
const GenericCommand = require('./GenericCommand.js');
const OOBEStateCommand = require('./OOBEStateCommand');

import {
  Device,
  Service,
  Characteristic,
  Descriptor,
  BleError,
  BleErrorCode,
  Subscription,
} from 'react-native-ble-plx';

class GattPhoneService {
  constructor(device: Device /*, wCh: Characteristic, nCh: Characteristic*/) {
    this.device = device;
    // this.RECEIVE_SERVICE = 'ACB7D831-73DE-48B1-B1F2-E91E05DDFF95';
    // this.REC_1 = '908CA7F2-1BD9-45BC-AD01-01F453D405F8';
    // this.wCh = wCh
    // this.nCh = nCh
  }

  mSendCommandMap = {};

  prepareCommandPkt(cmdType, cmdData) {
    let cmd = new GenericCommand();
    cmd.setCmdType(cmdType);
    cmd.setCmdData(cmdData);
    console.log('cmd:' + JSON.stringify(cmd));
    let cmdPkt = cmd.toPacket();
    console.log(cmdPkt);
    this.frameFactory = new FrameFactory(cmd.seq, this.device.mtu, cmdPkt);

    return cmd.seq;
  }

  getNextFrame() {
    if (this.frameFactory == null) {
      console.log('no frame need to send!');
      return null;
    }
    let frame = this.frameFactory.nextFrame();
    if (frame != null) {
      return frame.toPacket();
    } else {
      return null;
    }
  }

  //public int sendCommand(byte cmdType, SharedMemory cmdDataShared)
  sendCommand(cmdType, cmdData) {
    // IGattPhoneServiceCallback callback = findCallback(cmdType);
    // if (callback == null) {
    //     Log.e(TAG, "IGattPhoneServiceCallback not found for cmdType:" + cmdType);
    //     return 0;
    // }

    console.log(
      'sendCommand cmdType=' + cmdType + ' cmdData.getSize()=' + cmdData.length,
    );

    let cmd = new GenericCommand();
    cmd.setCmdType(cmdType);
    cmd.setCmdData(cmdData);
    let cmdPacket = cmd.toPacket();

    //todo: callback
    // this.mSendCommandMap[cmd.getSeq()] = callback
    this._sendCommand(cmd.getSeq(), cmdPacket);

    return cmd.getSeq();
  }

  //public synchronized void sendCommand(int seq, byte cmdType, byte[] cmdPacket)
  _sendCommand(seq, cmdPacket) {
    console.log('sendCommand seq:' + seq + ', cmdPacket=' + cmdPacket);

    // if (frameFactory != null) {
    //     broadcastSendCommandStatusUpdate(seq, GattSendState.SEND_ERROR, SendError.SYSTEM_BUSY);
    //     return;
    // }

    // if (mGattConnection == null) {
    //     broadcastSendCommandStatusUpdate(seq, GattSendState.SEND_ERROR, SendError.HMD_NOT_CONNECTED);
    //     return;
    // }

    // int state = mBluetoothManager.getConnectionState(mGattConnection.getGatt().getDevice(), BluetoothProfile.GATT);
    // if (state != BluetoothProfile.STATE_CONNECTED) {
    //     broadcastSendCommandStatusUpdate(seq, GattSendState.SEND_ERROR, SendError.HMD_NOT_CONNECTED);
    //     return;
    // }

    // if (cmdPacket.length > FrameFactory.getMaxCmdPacketSize(mGattConnection.getMtu())) {
    //     broadcastSendCommandStatusUpdate(seq, GattSendState.SEND_ERROR, SendError.CMD_PACKET_TOO_LARGE);
    //     return;
    // }

    // frameFactory = new FrameFactory(seq, mGattConnection.getMtu(), cmdPacket);
    this.frameFactory = new FrameFactory(seq, this.device.mtu, cmdPacket);
    this.sendNextFrame();
    // this.sendNextFrame();
    // this.sendNextFrame();
    // this.sendNextFrame();
    // this.sendNextFrame();
  }

  sendNextFrame() {
    if (this.frameFactory == null) {
      console.log('no frame need to send!');
      return;
    }

    let frame = this.frameFactory.nextFrame();
    if (frame != null) {
      let error = this.sendFrame(frame);
      // if (error != SendError.NONE) {
      //     console.log("sendFrame seq:" + frame.seq + ", " + (frame.idx + 1) + "/" + frame.count + " error:" + SendError.strings[error]);
      //     broadcastSendCommandStatusUpdate(frameFactory.getSeq(), GattSendState.SEND_ERROR, error);
      //     frameFactory = null;
      // } else {
      //     console.log("sendFrame seq:" + frame.seq + ", " + (frame.idx + 1) + "/" + frame.count + " ok");
      //     broadcastSendCommandStatusUpdate(frameFactory.getSeq(), GattSendState.SENDING, 0);
      // }
    } else {
      //broadcastSendCommandStatusUpdate(frameFactory.getSeq(), GattSendState.SEND_SUCCESS, 0);
      this.frameFactory = null;
    }
  }

  sendFrame(frame) {
    // if (mGattConnection == null) {
    //     return SendError.HMD_NOT_CONNECTED;
    // }

    // BluetoothGatt mBluetoothGatt = mGattConnection.getGatt();
    // BluetoothGattService recService = mBluetoothGatt.getService(UUID_REC_SERVICE);
    // if (recService == null) {
    //     return SendError.GATT_SERVICE_NOT_FOUND;
    // }

    // BluetoothGattCharacteristic recCharacteristic = recService.getCharacteristic(UUID_REC_1);
    // if (recCharacteristic == null) {
    //     return SendError.GATT_CHARACTERISTIC_NOT_FOUND;
    // }

    let framePacket = frame.toPacket();
    console.log('sendFrame=' + framePacket);
    // this.device.writeCharacteristicWithoutResponseForService(
    //   this.RECEIVE_SERVICE,
    //   this.REC_1,
    //   framePacket,
    //   null,
    // );
    // recCharacteristic.setValue(framePacket);
    // recCharacteristic.setWriteType(BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE);
    // boolean res = mBluetoothGatt.writeCharacteristic(recCharacteristic);
    // if (res) {
    //     return SendError.NONE;
    // } else {
    //     return SendError.GATT_WRITE_CHARACTERISTIC_FAIL;
    // }
  }
}

module.exports = GattPhoneService;

//========my test code===============
// var gattPhoneService = new GattPhoneService()
// var x = new Uint8Array([21, 31, 21, 31, 21, 0]);

//queryOOBEState
// var cmd = new OOBEStateCommand();
// cmd.setDeviceName('11111')
// gattPhoneService.sendCommand(cmd.getCmdType(), cmd.getCmdData())

//var x = new Uint8Array([1, 2, 3, 4]);
//gattPhoneService.sendCommand(1, x)
