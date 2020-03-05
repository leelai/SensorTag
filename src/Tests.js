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
const OOBEStateCommand = require('./OOBEStateCommand.js');

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
  READ_TEMPERATURE: {
    id: 'READ_TEMPERATURE',
    title: 'Read temperature',
    execute: readTemperature,
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
            yield put(log('Skipping CCC'));
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

        yield put(log('====isWritableWithoutResponse: ' + characteristic.isWritableWithoutResponse));
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


        yield put(log('====isWritableWithResponse: ' + characteristic.isWritableWithResponse));
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

          yield put(log('Successfully written value back'));
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

function* readTemperature(device: Device): Generator<*, boolean, *> {
  yield put(log('Read temperature'));
  return false;
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
  // const notificationChannel = yield eventChannel(emit => {
  //   const subscription = device.monitorCharacteristicForService(
  //     '0000fff0-0000-1000-8000-00805f9b34fb',
  //     '0000fff1-0000-1000-8000-00805f9b34fb',
  //     (error: BleError | null, characteristic: Characteristic | null) => {
  //       //console.log(characteristic)
  //       emit(characteristic.value);
  //     },
  //     null,
  //   );
  //   return () => {
  //     subscription.remove();
  //   };
  // }, buffers.expanding(1));

  // try {
  //   for (;;) {
  //     const value = yield take(notificationChannel);
  //     console.log('eventChannel:' + value);
  //     yield put(log(value));
  //   }
  // } finally {
  //   if (yield cancelled()) {
  //     notificationChannel.close();
  //   }
  // }
  //==========================================

  // device.monitorCharacteristicForService(
  //   '0000fff0-0000-1000-8000-00805f9b34fb',
  //   '0000fff1-0000-1000-8000-00805f9b34fb',
  //   listener,
  //   null
  // )
  return true;
}

const Buffer = require('safe-buffer').Buffer;

function* oobeStatus(device: Device): Generator<*, boolean, *> {
  yield put(log('Get oobe status...'));
  yield put(log('original mtu = ' + device.mtu));

  //Check mtu
  if (device.mtu < 160) {
    device = yield call([device, device.requestMTU], 160);
    yield put(log('new mtu = ' + device.mtu));
  }

  //Find service
  try {
    yield put(log('Find service...'));
    let RECEIVE_SERVICE = 'ACB7D831-73DE-48B1-B1F2-E91E05DDFF95';
    let REC_1 = '908CA7F2-1BD9-45BC-AD01-01F453D405F8';
    let SND_1 = '7A391A16-5358-437A-93A8-A15AD28A59DA';
    let HEART_RATE_CONTROL_POINT_UUID = '00002A39-0000-1000-8000-00805F9B34FB';

    //todo: store it in store
    let wCh = null;
    let nCh = null;

    const services: Array<Service> = yield call([device, device.services]);
    for (const service of services) {
      const characteristics: Array<Characteristic> = yield call([
        service,
        service.characteristics,
      ]);
      for (const characteristic of characteristics) {
        yield put(log('characteristic uuid=' + characteristic.uuid));
        if (
          service.uuid.toUpperCase() === RECEIVE_SERVICE &&
          characteristic.uuid.toUpperCase() === REC_1
        ) {
          wCh = characteristic;
        } else if (characteristic.uuid.toUpperCase() === SND_1) {
          nCh = characteristic;
        }

        //testing
        if (wCh == null && characteristic.uuid.toUpperCase() === HEART_RATE_CONTROL_POINT_UUID) {
          wCh = characteristic;
        }
      }
    }

    if (wCh) {
      yield put(log('wCh=' + wCh.uuid));
    }
    if (nCh) {
      yield put(log('nCh=' + nCh.uuid));
    }

    let cmd = new OOBEStateCommand();
    cmd.setDeviceName('njwgqctfdtviqqgupyczmmpjxrketbmxyihjtnjbkicqjbapajayaaihifewqiigbvveubunrypxxauvdbzbetnqvmquadprmetxxuwgwjhtqeuqnwfnudfudhwepkckbqyqgazbnbbwfzyfktgmfdjvhixtxhfprgzvkbjuvnekeduwutyznwfzmqahhfwqjdrecxmzvpngqwkmbhbegzteyqnwjzymeetdgmypemiudxnwjyckjhzmwz1234567890');
    let len = cmd.getDeviceName().length
    console.log('len=' + len);
    // console.log(cmd.getCmdType());
    // console.log('getCmdData is' + cmd.getCmdData());
    // cmd.setDeviceName('james');
    // console.log(
    //   'OOBEStateCommand getCmdType:' +
    //   cmd.getCmdType() +
    //   ', getCmdData:' +
    //   cmd.getCmdData(),
    // );
    let gattPhoneService = new GattPhoneService(device);
    let cmdSeq = gattPhoneService.prepareCommandPkt(
      cmd.getCmdType(),
      cmd.getCmdData(),
    );
    // console.log('===========');
    console.log('===========');
    // return true;
    // let oobeStatusCommand = gattPhoneService.sendCommand(
    //   cmd.getCmdType,
    //   cmd.getCmdData,
    // );
    while (true) {
      let data = gattPhoneService.getNextFrame();
      if (data == null) {
        console.log('no more data, break');
        break;
      }
      console.log('send data:' + data);
      const dataInBase64 = Buffer.from(data).toString('base64');
      // yield put(log('send data:' + data));
      console.log('send data(Base64):' + dataInBase64);

      const characteristic: Characteristic = yield call([wCh, wCh.writeWithResponse], dataInBase64);

      yield put(log('Successfully written value back' + characteristic.uuid));
    }
  } catch (error) {
    yield put(logError(error));
    return false;
  }

  // let cmd = new OOBEStateCommand();
  // let gattPhoneService = new GattPhoneService(device);
  // let oobeStatusCommand = gattPhoneService.sendCommand(
  //   cmd.getCmdType,
  //   cmd.getCmdData,
  // );

  //==================it is for ble  peripheral tool
  // const notificationChannel = yield eventChannel(emit => {
  // const subscription = device.monitorCharacteristicForService(
  //     '0000fff0-0000-1000-8000-00805f9b34fb',
  //     '0000fff1-0000-1000-8000-00805f9b34fb',
  //     (error: BleError | null, characteristic: Characteristic | null) => {
  //       //console.log(characteristic)
  //       emit(characteristic.value);
  //     },
  //     null,
  //   );
  //   return () => {
  //     subscription.remove();
  //   };
  // }, buffers.expanding(1));

  // try {
  //   for (;;) {
  //     const value = yield take(notificationChannel);
  //     console.log('eventChannel:' + value);
  //     yield put(log(value));
  //   }
  // } finally {
  //   if (yield cancelled()) {
  //     notificationChannel.close();
  //   }
  // }
  //==========================================

  return true;
}
