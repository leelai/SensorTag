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
};

function listener(error: BleError | null, characteristic: Characteristic | null) {
  console.log(characteristic)
}

function* readAllCharacteristics(device: Device): Generator<*, boolean, *> {
  try {
    const services: Array<Service> = yield call([device, device.services]);
    for (const service of services) {
      yield put(log('Found service: ' + service.uuid));
      console.log('Found service: ' + service.uuid)
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
        // if (characteristic.isWritableWithoutResponse) {
        //   yield put(log('Write(WithoutResponse) value...'));
        //   var data = "MTIzNA==" //1234 base64
        //   yield call(
        //     //writeWithoutResponse(valueBase64: Base64, transactionId?: string): Promise<Characteristic>
        //     [characteristic, characteristic.writeWithoutResponse],
        //     data,
        //   );
        //   yield put(log('Successfully written value back'));
        // }

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
    console.log(error)
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
  const notificationChannel = yield eventChannel(emit => {
    const subscription = device.monitorCharacteristicForService(
      '0000fff0-0000-1000-8000-00805f9b34fb',
      '0000fff1-0000-1000-8000-00805f9b34fb',
      (error: BleError | null, characteristic: Characteristic | null) => {
        //console.log(characteristic)
        emit(characteristic.value)
      },
      null);
    return () => {
      subscription.remove();
    };
  }, buffers.expanding(1));

  try {
    for (; ;) {
      const value = yield take(notificationChannel);
      console.log('eventChannel:' + value)
      yield put(log(value));
    }
  } finally {
    if (yield cancelled()) {
      notificationChannel.close();
    }
  }

  // device.monitorCharacteristicForService(
  //   '0000fff0-0000-1000-8000-00805f9b34fb',
  //   '0000fff1-0000-1000-8000-00805f9b34fb',
  //   listener,
  //   null
  // )
  return true;
}
