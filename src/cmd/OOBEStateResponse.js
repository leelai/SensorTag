const Command = require('./Command.js');
const Packet = require('./Packet.js');
const Response = require('../Response.js');

const WIFI_STATE_DISABLING = 0x0,
    WIFI_STATE_DISABLED = 0x01,
    WIFI_STATE_ENABLING = 0x02,
    WIFI_STATE_ENABLED = 0x03,
    WIFI_STATE_UNKNOWN = 0x04;

const WIFI_STATE = ["WIFI_STATE_DISABLING",
    "WIFI_STATE_DISABLED",
    "WIFI_STATE_ENABLING",
    "WIFI_STATE_ENABLED",
    "WIFI_STATE_UNKNOWN"]

const WIFI_CON_STATE_CONNECTED = 0x0,
    WIFI_CON_STATE_CONNECTING = 0x01,
    WIFI_CON_STATE_DISCONNECTED = 0x02,
    WIFI_CON_STATE_DISCONNECTING = 0x03,
    WIFI_CON_STATE_SUSPENDED = 0x04,
    WIFI_CON_STATE_UNKNOWN = 0x05;

const WIFI_CON_STATE = ["CONNECTED",
    "CONNECTING",
    "DISCONNECTED",
    "DISCONNECTING",
    "SUSPENDED",
    "UNKNOWN"];

class OOBEStateResponse extends Response {

    static get WIFI_STATE_DISABLING() {
        return WIFI_STATE_DISABLING;
    }

    static get WIFI_STATE_DISABLED() {
        return WIFI_STATE_DISABLED;
    }

    static get WIFI_STATE_ENABLED() {
        return WIFI_STATE_ENABLED;
    }

    static get WIFI_STATE_UNKNOWN() {
        return WIFI_STATE_UNKNOWN;
    }

    static WIFI_STATE_STR(index) {
        return WIFI_STATE[index];
    }

    static get WIFI_CON_STATE_CONNECTED() {
        return WIFI_STATE_CONNECTED;
    }

    static get WIFI_CON_STATE_CONNECTING() {
        return WIFI_STATE_CONNECTING;
    }

    static get WIFI_CON_STATE_DISCONNECTED() {
        return WIFI_STATE_DISCONNECTED;
    }

    static get WIFI_CON_STATE_DISCONNECTING() {
        return WIFI_STATE_DISCONNECTING;
    }

    static get WIFI_CON_STATE_SUSPENDED() {
        return WIFI_STATE_SUSPENDED;
    }

    static get WIFI_CON_STATE_UNKNOWN() {
        return WIFI_STATE_UNKNOWN;
    }

    static WIFI_CON_STATE_STR(index) {
        return WIFI_CON_STATE[index];
    }

    get wifiSate() {
        return OOBEStateResponse.WIFI_STATE_STR(this.#wifiState)
    }

    get wifiConnectionSate() {
        return OOBEStateResponse.WIFI_CON_STATE_STR(this.#wifiConnectionState)
    }

    /* Wifi State */
    #wifiState = WIFI_STATE_UNKNOWN;
    /* Wifi Connection State */
    #wifiConnectionState = WIFI_CON_STATE_UNKNOWN;
    /* Wifi SSID */
    #SSID;
    /* Language and Country */
    #language;
    #country;
    /* TimeZone ID */
    #timeZone;

    constructor(resp) {
        super();
        if (arguments.length) {
            this.setWifiState(resp.getWifiState());
            this.setWifiConnectionState(resp.getWifiConnectionState());
            this.setSSID(resp.getSSID());
            this.setLanguage(resp.getLanguage());
            this.setCountry(resp.getCountry());
            this.setTimeZone(resp.getTimeZone());
        }
    }

    get wifiState() {
        return this.#wifiState;
    }

    setWifiState(wifiState) {
        this.#wifiState = wifiState;
    }

    get wifiConnectionState() {
        return this.#wifiConnectionState;
    }

    setWifiConnectionState(wifiConnectionState) {
        this.#wifiConnectionState = wifiConnectionState;
    }

    get SSID() {
        return this.#SSID;
    }

    setSSID(SSID) {
        this.#SSID = SSID;
    }

    get language() {
        return this.#language;
    }

    setLanguage(language) {
        this.#language = language;
    }

    get country() {
        return this.#country;
    }

    setCountry(country) {
        this.#country = country;
    }

    get timeZone() {
        return this.#timeZone;
    }

    setTimeZone(timeZone) {
        this.#timeZone = timeZone;
    }

    get cmdType() {
        return Command.CMD_OOBE_State;
    }

    writeToPacket(p) {
        p.putByte(this.wifiState);
        p.putByte(this.wifiConnectionState);
        p.putSmallString(this.SSID);
        p.putSmallString(this.language);
        p.putSmallString(this.country);
        p.putSmallString(this.timeZone);
    }

    initFromPacket(p) {
        this.setWifiState(p.getByte());
        this.setWifiConnectionState(p.getByte());
        this.setSSID(p.getSmallString());
        this.setLanguage(p.getSmallString());
        this.setCountry(p.getSmallString());
        this.setTimeZone(p.getSmallString());
    }

    toString() {
        return 'WifiState:' + this.wifiSate +
            ', WifiConnectionState:' + this.wifiConnectionSate +
            ', SSID:' + this.SSID + ', language:' + this.language +
            ', country:' + this.country + ', timeZone:' + this.timeZone;
    }
}
module.exports = OOBEStateResponse;