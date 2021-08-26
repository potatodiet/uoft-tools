import { browser } from "webextension-polyfill-ts";
import { RateMyProfApi } from "./rate_my_prof_api";

let client = new RateMyProfApi();

browser.runtime.onMessage.addListener((message: any) => {
  return Promise.resolve(client.getProfInfo(
    message.getProfInfo["name"], message.getProfInfo["schoolId"]
  ));
});
