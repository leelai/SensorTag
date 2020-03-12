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
  CMD_Device_Info = 0x0e,
  CMD_Developer_Options = 0x0f;

class Command {
  VERSION = 1;

  static get CMD_OOBE_State() {
    return CMD_OOBE_State;
  }

  static get CMD_Wifi_Settings() {
    return CMD_Wifi_Settings;
  }

  static get CMD_Wifi_Scan() {
    return CMD_Wifi_Scan;
  }

  static get CMD_TimeZone() {
    return CMD_TimeZone;
  }

  static get CMD_Language_List() {
    return CMD_Language_List;
  }

  static get CMD_Language() {
    return CMD_Language;
  }

  static get CMD_OOBE_Done() {
    return CMD_OOBE_Done;
  }

  static get CMD_AutoTimeZone() {
    return CMD_AutoTimeZone;
  }

  static get CMD_NonType() {
    return CMD_NonType;
  }

  static get CMD_File_Transfer() {
    return CMD_File_Transfer;
  }

  static get CMD_Submit_Issue() {
    return CMD_Submit_Issue;
  }

  static get CMD_App_List() {
    return CMD_App_List;
  }

  static get CMD_Feedback_Setting() {
    return CMD_Feedback_Setting;
  }

  static get CMD_File_Transfer() {
    return CMD_File_Transfer;
  }

  static get CMD_Device_Info() {
    return CMD_Device_Info;
  }

  static get CMD_Developer_Options() {
    return CMD_Developer_Options;
  }

  prev_seq = 0;
  seq = 0;

  constructor() {
    this.initSeq();
  }

  initSeq() {
    //todo:
    // synchronized(prev_seq) {
    this.seq = Date.now();
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
    let p = new Packet();
    this.writeToPacket(p);
    console.log(p);
    return p.toPacket();
  }
}

module.exports = Command;
