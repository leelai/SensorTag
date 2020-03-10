const Packet = require('./Packet.js');
const Command = require('./Command.js');

class Response {
  static VERSION = 0x1;

  /* Ack Types */
  static NACK = 0x00;
  static ACK = 0x01;

  #RESPONSE_SEQ_OFFSET = 24 * 60 * 60 * 1000;

  static prev_seq = 0;
  #seq;

  ackType = this.ACK;
  errorCode = 0;

  constructor() {
    this.initSeq();
  }

  /**
   * Generate unique sequence number
   */
  initSeq() {
    console.log('prev_seq=' + this.prev_seq);
    this.#seq = Date.now() + this.#RESPONSE_SEQ_OFFSET;
    if (this.#seq <= this.prev_seq) {
      this.#seq = this.prev_seq + 1;
    }
    this.prev_seq = this.#seq;
  }

  getVersion() {
    return VERSION;
  }

  get cmdType() {
    console.log('Response.getCmdType must be override!!!');
  }

  /**
   * Get response data
   * @return
   */
  getResponseData() {
    let p = new Packet();
    p.putByte(this.getAckType());
    p.putByte(this.getErrorCode());
    writeToPacket(p);
    return p.toPacket();
  }

  get seq() {
    return this.#seq;
  }

  setSeq(seq) {
    this.#seq = seq;
  }

  getAckType() {
    return this.ackType;
  }

  getErrorCode() {
    return this.errorCode;
  }

  setAckType(type) {
    this.ackType = type;
  }

  setErrorCode(code) {
    this.errorCode = code;
  }

  /**
   * Write specific response options to Packet
   * @param p
   */
  writeToPacket(p) {
    console.log('Response.writeToPacket must be override!!!');
  }

  /**
   * Init specific response options from Packet
   * @param p
   */
  initFromPacket(p) {
    console.log('Response.initFromPacket must be override!!!');
  }
  /**
   * Parse response data
   * @param cmdType
   * @param responseData
   * @return
   */
  static fromResponseData(cmdType, responseData) {
    console.log('fromResponseData cmdType:' + cmdType);
    let resp = null;
    let p = new Packet(responseData);
    switch (cmdType) {
      case Command.CMD_OOBE_State:
        const OOBEStateResponse = require('./OOBEStateResponse.js');
        resp = new OOBEStateResponse();
        break;
      case Command.CMD_Wifi_Settings:
        resp = new WifiSettingsResponse();
        break;
      case Command.CMD_Wifi_Scan:
        resp = new WifiScanResponse();
        break;
      case Command.CMD_Language_List:
        resp = new LanguageListResponse();
        break;
      case Command.CMD_Language:
        resp = new LanguageResponse();
        break;
      case Command.CMD_TimeZone:
        resp = new TimeZoneResponse();
        break;
      case Command.CMD_AutoTimeZone:
        resp = new AutoTimeZoneResponse();
        break;
      case Command.CMD_File_Transfer:
        resp = new FileTransferResponse();
        break;
      case Command.CMD_Submit_Issue:
        resp = new SubmitIssueResponse();
        break;
      case Command.CMD_App_List:
        resp = new AppListResponse();
        break;
      case Command.CMD_Feedback_Setting:
        resp = new FeedbackSettingResponse();
        break;
      case Command.CMD_Device_Info:
        resp = new DeviceInfoResponse();
        break;
      case Command.CMD_Developer_Options:
        resp = new DeveloperOptionsResponse();
        break;
      default:
        fromResponseData出問題了;
        console.log('fromResponseData fail: unknown cmdType=' + cmdType);
        return null;
    }

    resp.setAckType(p.getByte());
    resp.setErrorCode(p.getByte());
    resp.initFromPacket(p);
    return resp;
  }
}

module.exports = Response;
