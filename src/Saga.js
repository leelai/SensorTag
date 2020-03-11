// @flow

import { PermissionsAndroid, Platform } from 'react-native';
import { buffers, eventChannel } from 'redux-saga';
import {
  fork,
  cancel,
  take,
  call,
  put,
  race,
  cancelled,
  actionChannel,
} from 'redux-saga/effects';
import {
  log,
  logError,
  updateConnectionState,
  bleStateUpdated,
  testFinished,
  type BleStateUpdatedAction,
  type UpdateConnectionStateAction,
  type ConnectAction,
  type ExecuteTestAction,
  sensorTagFound,
  ConnectionState,
} from './Reducer';
import {
  BleManager,
  BleError,
  Device,
  State,
  LogLevel,
} from 'react-native-ble-plx';
import { SensorTagTests } from './Tests';

const Packet = require('./cmd/Packet.js');
//const gattServiceUUID = "ACB7D831-73DE-48B1-B1F2-E91E05DDFF95"
//const a = "2C3001E9-6833-45B5-BC5E-235DCDFAB2BD"
//const services = ["ACB7D831-73DE-48B1-B1F2-E91E05DDFF95", "2C3001E9-6833-45B5-BC5E-235DCDFAB2BD"]

export function* bleSaga(): Generator<*, *, *> {
  yield put(log('BLE saga started...'));

  // First step is to create BleManager which should be used as an entry point
  // to all BLE related functionalities
  const manager = new BleManager();
  manager.setLogLevel(LogLevel.Verbose);

  // All below generators are described below...
  yield fork(handleScanning, manager);
  yield fork(handleBleState, manager);
  yield fork(handleConnection, manager);

  //todo add notification
}

// This generator tracks our BLE state. Based on that we can enable scanning, get rid of devices etc.
// eventChannel allows us to wrap callback based API which can be then conveniently used in sagas.
function* handleBleState(manager: BleManager): Generator<*, *, *> {
  const stateChannel = yield eventChannel(emit => {
    const subscription = manager.onStateChange(state => {
      emit(state);
    }, true);
    return () => {
      subscription.remove();
    };
  }, buffers.expanding(1));

  try {
    for (; ;) {
      const newState = yield take(stateChannel);
      yield put(bleStateUpdated(newState));
    }
  } finally {
    if (yield cancelled()) {
      stateChannel.close();
    }
  }
}

// This generator decides if we want to start or stop scanning depending on specific
// events:
// * BLE state is in PoweredOn state
// * Android's permissions for scanning are granted
// * We already scanned device which we wanted
function* handleScanning(manager: BleManager): Generator<*, *, *> {
  var scanTask = null;
  var bleState: $Keys<typeof State> = State.Unknown;
  var connectionState: $Keys<typeof ConnectionState> =
    ConnectionState.DISCONNECTED;

  const channel = yield actionChannel([
    'BLE_STATE_UPDATED',
    'UPDATE_CONNECTION_STATE',
  ]);

  for (; ;) {
    const action:
      | BleStateUpdatedAction
      | UpdateConnectionStateAction = yield take(channel);

    switch (action.type) {
      case 'BLE_STATE_UPDATED':
        bleState = action.state;
        break;
      case 'UPDATE_CONNECTION_STATE':
        connectionState = action.state;
        break;
    }

    const enableScanning =
      bleState === State.PoweredOn &&
      (connectionState === ConnectionState.DISCONNECTING ||
        connectionState === ConnectionState.DISCONNECTED);

    if (enableScanning) {
      if (scanTask != null) {
        yield cancel(scanTask);
      }
      scanTask = yield fork(scan, manager);
    } else {
      if (scanTask != null) {
        yield cancel(scanTask);
        scanTask = null;
      }
    }
  }
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

// As long as this generator is working we have enabled scanning functionality.
// When we detect SensorTag device we make it as an active device.
function* scan(manager: BleManager): Generator<*, *, *> {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    yield put(log('Scanning: Checking permissions...'));
    const enabled = yield call(
      PermissionsAndroid.check,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );
    if (!enabled) {
      yield put(log('Scanning: Permissions disabled, showing...'));
      const granted = yield call(
        PermissionsAndroid.request,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        yield put(log('Scanning: Permissions not granted, aborting...'));
        // TODO: Show error message?
        return;
      }
    }
  }

  yield put(log('Scanning started...'));
  const scanningChannel = yield eventChannel(emit => {
    manager.startDeviceScan(
      null,
      { allowDuplicates: true },
      (error, scannedDevice) => {
        if (error) {
          emit([error, scannedDevice]);
          return;
        }
        if (scannedDevice != null && scannedDevice.manufacturerData != null) {
          var manufacturerData = decodeBase64(scannedDevice.manufacturerData);
          //first two byte is company id
          if (manufacturerData.length < 3 || manufacturerData[0] != 237 || manufacturerData[1] != 2) {
            //it is not htc device
            return;
          }

          //這邊用packet有點無聊噎
          var packet = new Packet(manufacturerData.slice(2));
          var serial = packet.getSmallString();
          scannedDevice.serial = serial;
          console.log('serial:' + serial + ', rssi:' + scannedDevice.rssi);
          emit([error, scannedDevice]);
        } else {
          //testing
          if (scannedDevice.localName == 'abc') {
            emit([error, scannedDevice]);
          }
        }
      },
    );
    return () => {
      manager.stopDeviceScan();
    };
  }, buffers.expanding(1));

  try {
    for (; ;) {
      //持續掃瞄
      const [error, scannedDevice]: [?BleError,?Device] = yield take(
        scanningChannel,
      );
      if (error != null) {
      }
      if (scannedDevice != null) {
        yield put(sensorTagFound(scannedDevice));
      }
    }
  } catch (error) {
  } finally {
    yield put(log('Scanning stopped...'));
    if (yield cancelled()) {
      scanningChannel.close();
    }
  }
}

let REC_1 = '908CA7F2-1BD9-45BC-AD01-01F453D405F8';
let SND_1 = '7A391A16-5358-437A-93A8-A15AD28A59DA';

//流程控制
function* handleConnection(manager: BleManager): Generator<*, *, *> {
  var testTask = null;

  for (; ;) {
    // Take action
    //回傳ConnectAction的type 只存device
    //收到使用者按下connect action
    const { device }: ConnectAction = yield take('CONNECT');

    //建立disconnectedChannel的eventChannel
    //收到device的disconnect event之後 在eventChannel產生 DISCONNECTED action
    const disconnectedChannel = yield eventChannel(emit => {
      const subscription = device.onDisconnected(error => {
        emit({ type: 'DISCONNECTED', error: error });
      });
      return () => {
        subscription.remove();
      };
    }, buffers.expanding(1));

    const deviceActionChannel = yield actionChannel([
      'DISCONNECT',
      'EXECUTE_TEST',
    ]);

    try {
      //顯示connecting
      yield put(updateConnectionState(ConnectionState.CONNECTING));
      //調用connect
      let connectedDevice = yield call([manager, manager.connectToDevice], device.id, { requestMTU: 160 });//160 not work
      // yield call([device, device.connect], { requestMTU: 160 });

      yield put(log('connectedDevice.mtu=' + connectedDevice.mtu));
      //顯示discovering
      yield put(updateConnectionState(ConnectionState.DISCOVERING));
      //一定要先調用discoverAllServicesAndCharacteristics
      yield call([device, device.discoverAllServicesAndCharacteristics]);

      //test
      const services: Array<Service> = yield call([device, device.services]);
      for (const service of services) {
        const characteristics: Array<Characteristic> = yield call([
          service,
          service.characteristics,
        ]);
        for (const characteristic of characteristics) {
          //yield put(log('characteristic uuid=' + characteristic.uuid));
          if (
            characteristic.uuid.toUpperCase() === REC_1 &&
            characteristic.isWritableWithResponse
          ) {
            device.wCh = characteristic;
          } else if (
            characteristic.uuid.toUpperCase() === SND_1 &&
            characteristic.isNotifiable
          ) {
            device.nCh = characteristic;
          }

          if (device.wCh && device.nCh) {
            //console.log(device)
            yield put(log('wCh=' + device.wCh.uuid));
            yield put(log('nCh=' + device.nCh.uuid));
            break
          }
        }
      }

      //條件是要找到wch or nch才算連上
      if (!device.wCh || !device.nCh) {
        yield put(updateConnectionState(ConnectionState.DISCONNECTING));
        yield call([device, device.cancelConnection]);
      } else {
        yield put(updateConnectionState(ConnectionState.CONNECTED));
      }

      for (; ;) {
        const { deviceAction, disconnected } = yield race({
          deviceAction: take(deviceActionChannel),
          disconnected: take(disconnectedChannel),
        });

        if (deviceAction) {
          if (deviceAction.type === 'DISCONNECT') {
            yield put(log('Disconnected by user...'));
            yield put(updateConnectionState(ConnectionState.DISCONNECTING));
            yield call([device, device.cancelConnection]);
            break;
          }
          if (deviceAction.type === 'EXECUTE_TEST') {
            if (testTask != null) {
              yield cancel(testTask);
            }
            //test
            yield put(log('wCh=' + device.wCh.uuid));
            yield put(log('nCh=' + device.nCh.uuid));
            testTask = yield fork(executeTest, device, deviceAction);
          }
        } else if (disconnected) {
          yield put(log('Disconnected by device...'));
          if (disconnected.error != null) {
            yield put(logError(disconnected.error));
          }
          break;
        }
      }
    } catch (error) {
      yield put(logError(error));
    } finally {
      disconnectedChannel.close();
      yield put(testFinished());
      yield put(updateConnectionState(ConnectionState.DISCONNECTED));
    }
  }
}

function* executeTest(
  device: Device,
  test: ExecuteTestAction,
): Generator<*, *, *> {
  yield put(log('Executing test: ' + test.id));
  const start = Date.now();
  // console.log(SensorTagTests)
  // console.log(SensorTagTests[test.id])
  const result = yield call(SensorTagTests[test.id].execute, device);
  if (result) {
    yield put(
      log('Test finished successfully! (' + (Date.now() - start) + ' ms)'),
    );
  } else {
    yield put(log('Test failed! (' + (Date.now() - start) + ' ms)'));
  }
  yield put(testFinished());
}
