// @flow

import { put, call, cancelled, take } from 'redux-saga/effects';
import { buffers, eventChannel } from 'redux-saga';
import {
  Device,
  Service,
  Characteristic,
  Descriptor,
  BleError,
  BleErrorCode,
  Subscription,
} from 'react-native-ble-plx';
import { log, logError } from './Reducer';

const GattPhoneService = require('./GattPhoneService.js');
const OOBEStateCommand = require('./cmd/OOBEStateCommand.js');
const WifiScanCommand = require('./cmd/WifiScanCommand.js');
// const FrameFactory = require('./cmd/FrameFactory.js');

export type SensorTagTestMetadata = {
  id: string,
  title: string,
  execute: (device: Device) => Generator<any, boolean, any>,
};

export const SensorTagTests: { [string]: SensorTagTestMetadata } = {
  READ_ALL_CHARACTERISTICS: {
    id: 'READ_ALL_CHARACTERISTICS',
    title: 'Read all characteristics',
    execute: readAllCharacteristics,
  },
  WRITE_TEST: {
    id: 'WRITE_TEST',
    title: 'Write test',
    execute: writeTest,
  },
  NOTIFY_TEST: {
    id: 'NOTIFY_TEST',
    title: 'Notify test',
    execute: notifyTest,
  },
  OOBE_STATUS: {
    id: 'OOBE_STATUS',
    title: 'OOBE Status',
    execute: oobeStatus,
  },
  SCAN_WIFI: {
    id: 'SCAN_WIFI',
    title: 'Scan wifi',
    execute: scanWifi,
  }
};

function listener(
  error: BleError | null,
  characteristic: Characteristic | null,
) {
  console.log(characteristic);
}

function* readAllCharacteristics(device: Device): Generator<*, boolean, *> {
  try {
    const services: Array<Service> = yield call([device, device.services]);
    for (const service of services) {
      yield put(log('Found service: ' + service.uuid));
      console.log('Found service: ' + service.uuid);
      const characteristics: Array<Characteristic> = yield call([
        service,
        service.characteristics,
      ]);
      for (const characteristic of characteristics) {
        yield put(log('Found characteristic: ' + characteristic.uuid));
        if (characteristic.uuid === '00002a02-0000-1000-8000-00805f9b34fb')
          continue;

        const descriptors: Array<Descriptor> = yield call([
          characteristic,
          characteristic.descriptors,
        ]);

        for (const descriptor of descriptors) {
          yield put(log('* Found descriptor: ' + descriptor.uuid));
          const d: Descriptor = yield call([descriptor, descriptor.read]);
          yield put(log('Descriptor value: ' + (d.value || 'null')));
          if (d.uuid === '00002902-0000-1000-8000-00805f9b34fb') {
            // yield put(log('Skipping CCC'));
            continue;
          }
          try {
            yield call([descriptor, descriptor.write], 'AAA=');
          } catch (error) {
            const bleError: BleError = error;
            if (bleError.errorCode === BleErrorCode.DescriptorWriteFailed) {
              yield put(log('Cannot write to: ' + d.uuid));
            } else {
              throw error;
            }
          }
        }

        yield put(log('====isReadable: ' + characteristic.isReadable));
        //below is working for ble peripheral tool on android
        // if (characteristic.isReadable) {
        //   yield put(log('Reading value...'));
        //   var c = yield call([characteristic, characteristic.read]);
        //   yield put(log('Got base64 value: ' + c.value));
        //   if (characteristic.isWritableWithResponse) {
        //     yield call(
        //       [characteristic, characteristic.writeWithResponse],
        //       c.value,
        //     );
        //     yield put(log('Successfully written value back'));
        //   }
        // }

        yield put(
          log(
            '====isWritableWithoutResponse: ' +
            characteristic.isWritableWithoutResponse,
          ),
        );
        //below is working for ble peripheral tool on android
        if (characteristic.isWritableWithoutResponse) {
          // yield put(log('Write(WithoutResponse) value...'));
          // var data = "MTIzNA==" //1234 base64
          // yield call(
          //   //writeWithoutResponse(valueBase64: Base64, transactionId?: string): Promise<Characteristic>
          //   [characteristic, characteristic.writeWithoutResponse],
          //   data,
          // );
          // yield put(log('Successfully written value back'));
        }

        yield put(
          log(
            '====isWritableWithResponse: ' +
            characteristic.isWritableWithResponse,
          ),
        );
        //below is working for ble peripheral tool on android
        if (characteristic.isWritableWithResponse) {
          // yield put(log('Write(WritableWithResponse) value...'));
          // var data = "MTIzNA==" //1234 base64
          // yield call(
          //   //writeWithoutResponse(valueBase64: Base64, transactionId?: string): Promise<Characteristic>
          //   [characteristic, characteristic.writeWithResponse],
          //   "MTIzNA==",
          // );

          // let cmd = new OOBEStateCommand();
          // cmd.setDeviceName('james');
          // let gattPhoneService = new GattPhoneService(device);
          // let cmdSeq = gattPhoneService.prepareCommandPkt(
          //   cmd.getCmdType(),
          //   cmd.getCmdData(),
          // );

          // while (true) {
          //   let data = gattPhoneService.getNextFrame();
          //   if (data == null) {
          //     yield put(log('no more data, break'));
          //     break;
          //   }
          //   yield put(log('send data:' + data));
          //   const dataInBase64 = Buffer.from(data).toString('base64');
          //   yield put(log('send data(Base64):' + dataInBase64));
          //   yield call([characteristic, characteristic.writeWithResponse], dataInBase64);
          //   yield put(log('Successfully written value back'));
          // }

          // yield put(log('Successfully written value back'));
        }

        yield put(log('====isNotifiable: ' + characteristic.isNotifiable));
        if (characteristic.isNotifiable) {
          // console.log('Notifiable uuid:' + characteristic.uuid)
          //todo:
          // var s: Subscription = yield call(
          //   // monitor(
          //   //   listener: (error: BleError | null, characteristic: Characteristic | null) => void,
          //   //   transactionId?: string
          //   // ): Subscription
          //   [characteristic, characteristic.monitor],
          //   (error: BleError | null, characteristic: Characteristic | null) => {
          //     console.log(characteristic)
          //     //這邊無法把資料丟到store
          //   },
          // );
        }
      }
    }
  } catch (error) {
    console.log(error);
    yield put(logError(error));
    return false;
  }

  return true;
}

function* scanWifi(device: Device): Generator<*, boolean, *> {
  yield put(log('Scan Wifi'));

  let cmd = new WifiScanCommand();
  let gattPhoneService = new GattPhoneService(device.mtu);
  gattPhoneService.prepareFrame(cmd.getCmdType(), cmd.getCmdData());
  while (true) {
    let data = gattPhoneService.getNextFrame();
    if (data == null) {
      console.log('no more data, break');
      break;
    }
    //console.log('send data:' + data);
    const dataInBase64 = Buffer.from(data).toString('base64');
    // yield put(log('send data:' + data));
    console.log('send data(Base64):' + dataInBase64);

    const characteristic: Characteristic = yield call(
      [device.wCh, device.wCh.writeWithResponse],
      dataInBase64,
    );

    yield put(log('Successfully written value back' + characteristic.uuid));
  }

  return true;
}

function* writeTest(device: Device): Generator<*, boolean, *> {
  yield put(log('Write test'));
  return true;
}

function* notifyTest(device: Device): Generator<*, boolean, *> {
  yield put(log('Notify test'));
  // device.monitorCharacteristicForService(
  //   serviceUUID: UUID,
  //   characteristicUUID: UUID,
  //   listener: (error: ?Error, characteristic: ?Characteristic) => void,
  //   transactionId: ?TransactionId
  // ): Subscription

  //==================it is for ble  peripheral tool
  const notificationChannel = yield eventChannel(emit => {
    const subscription = device.monitorCharacteristicForService(
      // peripheral test tool
      // '0000fff0-0000-1000-8000-00805f9b34fb',
      // '0000fff1-0000-1000-8000-00805f9b34fb',
      '2C3001E9-6833-45B5-BC5E-235DCDFAB2BD',
      '7A391A16-5358-437A-93A8-A15AD28A59DA',
      //heart rate
      // '0000180D-0000-1000-8000-00805f9b34fb',
      // '00002A37-0000-1000-8000-00805f9b34fb',
      (error: BleError | null, characteristic: Characteristic | null) => {
        if (error) {
          console.log(error);
          emit('quit:' + error);
        }
        if (characteristic) {
          console.log(characteristic.value);
          // let data = decodeBase64(characteristic.value)
          // let data = 'c3RhY2thYnVzZS5jb20=';
          let buff = new Buffer(characteristic.value, 'base64');
          let text = buff.toString('ascii');

          console.log(text);
          emit(text);
        }
      },
      null,
    );
    return () => {
      subscription.remove();
    };
  }, buffers.expanding(1));

  try {
    for (; ;) {
      const value = yield take(notificationChannel);
      console.log('eventChannel:' + value);
      if (value.startsWith('quit')) {
        yield put(log(value));
        break;
      }
      yield put(log(value));
    }
  } finally {
    if (yield cancelled()) {
      notificationChannel.close();
    }
  }
  //==========================================

  // device.monitorCharacteristicForService(
  //   '0000fff0-0000-1000-8000-00805f9b34fb',
  //   '0000fff1-0000-1000-8000-00805f9b34fb',
  //   listener,
  //   null
  // )
  return true;
}

decodeBase64 = function (s) {
  var e = {},
    i,
    b = 0,
    c,
    x,
    l = 0,
    a,
    r = '',
    buf = [],
    w = String.fromCharCode,
    L = s.length;
  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (i = 0; i < 64; i++) {
    e[A.charAt(i)] = i;
  }
  for (x = 0; x < L; x++) {
    c = e[s.charAt(x)];
    b = (b << 6) + c;
    l += 6;
    while (l >= 8) {
      ((a = (b >>> (l -= 8)) & 0xff) || x < L - 2) && (r += w(a));
      buf.push(a);
    }
  }
  return buf;
};

const Buffer = require('safe-buffer').Buffer;
// const FramePool = require('./cmd/FramePool.js');
// const GenericResponse = require('./cmd/GenericResponse.js');
// const Response = require('./Response.js');

// let mResponseFramePoolMap = {};

// function processResponseFrame(responseFrame) {
//   console.log('processResponseFrame:' + JSON.stringify(responseFrame));
//   let framePool = null;

//   let seq = responseFrame.seq;
//   if (mResponseFramePoolMap[seq] != null) {
//     framePool = mResponseFramePoolMap[seq];
//   } else {
//     console.log('create ResponseFramePool seq:' + seq);
//     framePool = new FramePool(seq, responseFrame.count);
//     mResponseFramePoolMap[seq] = framePool;
//   }

//   if (framePool != null) {
//     framePool.addFrame(responseFrame);
//     if (framePool.isFull()) {
//       let respPacket = framePool.merge();
//       console.log('respPacket seq:' + seq + ' len:' + respPacket.length);
//       console.log(respPacket)
//       let genericResponse = GenericResponse.fromPacket(respPacket);
//       console.log(
//         'receive genericResponse cmdType=' +
//         genericResponse.cmdType +
//         ' seq=' +
//         genericResponse.seq,
//       );

//       let cmdType = genericResponse.cmdType;
//       let respData = genericResponse.respData;
//       console.log('genericResponse:' + genericResponse);
//       //let mCallback = findCallback(cmdType);

//       // if (mCallback != null) {
//       //   mCallback.onReceiveResponse(cmdType, toSharedMemory(respData));
//       // }
//       let response = Response.fromResponseData(cmdType, respData);
//       //console.log('response:' + JSON.stringify(response));
//       //console.log('response str:' + response.toString());
//       // remove framePool
//       //console.log('remove ResponseFramePool seq:' + seq);
//       //yield put(log(response.toString()));
//       delete mResponseFramePoolMap[seq];
//       return response
//     } else {
//       console.log('not full!');
//     }
//   }
// }

function* oobeStatus(device: Device): Generator<*, boolean, *> {
  yield put(log('Get oobe status...'));
  try {
    // const notificationChannel = yield eventChannel(emit => {
    //   const subscription = device.nCh.monitor(
    //     (error: BleError | null, characteristic: Characteristic | null) => {
    //       if (error) {
    //         console.log(error);
    //       }
    //       if (characteristic) {
    //         //console.log(characteristic);
    //         emit(characteristic.value);
    //       }
    //     },
    //   );
    //   return () => {
    //     subscription.remove();
    //   };
    // }, buffers.expanding(1));

    //send oobe command
    let cmd = new OOBEStateCommand();
    cmd.setDeviceName('James');
    let gattPhoneService = new GattPhoneService(device.mtu);
    gattPhoneService.prepareFrame(cmd.getCmdType(), cmd.getCmdData());
    while (true) {
      let data = gattPhoneService.getNextFrame();
      if (data == null) {
        console.log('no more data, break');
        break;
      }
      //console.log('send data:' + data);
      const dataInBase64 = Buffer.from(data).toString('base64');
      // yield put(log('send data:' + data));
      console.log('send data(Base64):' + dataInBase64);

      const characteristic: Characteristic = yield call(
        [device.wCh, device.wCh.writeWithResponse],
        dataInBase64,
      );

      yield put(log('Successfully written value back' + characteristic.uuid));
    }

    // //wait for response
    // try {
    //   for (; ;) {
    //     const value = yield take(notificationChannel);
    //     //console.log('eventChannel:' + value);
    //     var decodeFromValue = decodeBase64(value);
    //     // console.log(decodeFromValue);
    //     yield put(log(decodeFromValue));
    //     let responseFrame = FrameFactory.fromPacket(decodeFromValue);
    //     let rsp = processResponseFrame(responseFrame);
    //     if (rsp) {
    //       yield put(log(rsp.toString()));
    //       return true;
    //     }
    //   }
    // } finally {
    //   if (yield cancelled()) {
    //     notificationChannel.close();
    //   }
    // }
  } catch (error) {
    yield put(logError(error));
    return false;
  }
  return true;
}
