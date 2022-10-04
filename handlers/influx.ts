import { InfluxDB } from "@influxdata/influxdb-client";
import config from "../config";

const influxClient = new InfluxDB({ url: config.influx_db.url, token: config.influx_db.token });

export function getWriteApi(bucket: string) {
    return influxClient.getWriteApi(config.influx_db.org, bucket);
}
