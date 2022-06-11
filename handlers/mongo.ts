import mongoose from "mongoose";
import config from "../config";

module.exports = async () => {
    await mongoose.connect(config.mongodb_uri, { keepAlive: true });
};
