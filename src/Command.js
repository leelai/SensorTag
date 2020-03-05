const Packet = require('./Packet.js');

/**
 * Base class for all Commands
 */

const CMD_OOBE_State = 0x01,
  CMD_Wifi_Settings = 0x02,
  CMD_Wifi_Scan = 0x03,
  CMD_TimeZone = 0x04,
  CMD_Language_List = 0x05,
  CMD_Language = 0x06,
  CMD_OOBE_Done = 0x07,
  CMD_AutoTimeZone = 0x08,
  CMD_NonType = 0x09,
  CMD_File_Transfer = 0x0a,
  CMD_Submit_Issue = 0x0b,
  CMD_App_List = 0x0c,
  CMD_Feedback_Setting = 0x0d,
  CMD_Device_Info = 0x0e;

class Command {
  VERSION = 1;

  static get CMD_OOBE_State() {
    return CMD_OOBE_State;
  }

  prev_seq = 0;
  seq = 0;

  constructor() {
    this.initSeq();
  }

  currentTimeMillis() {
    return Date.now(); // Unix timestamp in milliseconds
  }

  initSeq() {
    //todo:
    // synchronized(prev_seq) {
    this.seq = this.currentTimeMillis();
    console.log('Command initSeq seq=' + this.seq);
    if (this.seq <= this.prev_seq) {
      this.seq = this.prev_seq + 1;
    }
    this.prev_seq = this.seq;
    console.log('Command initSeq prev_seq=' + this.prev_seq);
    // }
  }

  getSeq() {
    return this.seq;
  }

  setSeq(seq) {
    this.seq = seq;
  }

  getVersion() {
    return this.VERSION;
  }

  /**
   * Get command type
   * @return
   */
  //public abstract byte getCmdType();

  /**
   * Write specific command options into Packet
   * @param p
   */
  writeToPacket(p) {
    console.log('Command.writeToPacket must be override!!!');
    //todo throw exception
  }

  /**
   * Get command data
   * @return
   */
  getCmdData() {
    console.log('Command.getCmdData()');
    let p = new Packet();
    this.writeToPacket(p);
    console.log(p);
    return p.toPacket();
  }

  //todo:
  /**
   * Parse command data
   * @param cmdType
   * @param cmdData
   * @return
   */
  // public static Command fromCmdData(byte cmdType, byte[] cmdData) {
  //     Command cmd = null;
  //     Log.d(TAG, "fromCmdData cmdType=" + cmdType);

  //     switch (cmdType) {
  //         case CommandTypes.CMD_OOBE_State:
  //             cmd = new OOBEStateCommand();
  //             break;
  //         case CommandTypes.CMD_Wifi_Settings:
  //             cmd = new WifiSettingsCommand();
  //             break;
  //         case CommandTypes.CMD_Wifi_Scan:
  //             cmd = new WifiScanCommand();
  //             break;
  //         case CommandTypes.CMD_Language_List:
  //             cmd = new LanguageListCommand();
  //             break;
  //         case CommandTypes.CMD_Language:
  //             cmd = new LanguageCommand();
  //             break;
  //         case CommandTypes.CMD_TimeZone:
  //             cmd = new TimeZoneCommand();
  //             break;
  //         case CommandTypes.CMD_AutoTimeZone:
  //             cmd = new AutoTimeZoneCommand();
  //             break;
  //         case CommandTypes.CMD_File_Transfer:
  //             cmd = new FileTransferCommand();
  //             break;
  //         case CommandTypes.CMD_Submit_Issue:
  //             cmd = new SubmitIssueCommand();
  //             break;
  //         case CommandTypes.CMD_App_List:
  //             cmd = new AppListCommand();
  //             break;
  //         case CommandTypes.CMD_Feedback_Setting:
  //             cmd = new FeedbackSettingCommand();
  //             break;
  //         case CommandTypes.CMD_Device_Info:
  //             cmd = new DeviceInfoCommand();
  //             break;

  //         default:
  //             Log.e(TAG, "fromCmdData fail: unknown cmdType=" + cmdType);
  //             return null;
  //     }

  //     try {
  //         Packet p = new Packet(cmdData);
  //         cmd.initFromPacket(p);
  //         return cmd;
  //     } catch (Exception e) {
  //         Log.e(TAG, "initFromPacket fail:" + e.toString());
  //         return null;
  //     }
  // }
}

module.exports = Command;
