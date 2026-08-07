import axios from "axios";
import * as core from "@actions/core";

(async () => {
  try {
    const url = core.getInput("url");
    const method = core.getInput("method");
    const headers = core.getInput("headers");
    const data = core.getInput("data");

    console.log("=> Sending http request...");
    const response = await axios({
      url,
      method,
      headers: JSON.parse(headers),
      data: JSON.parse(data)
    });
    console.log("=> Http request Successfully sent ✅");
    core.setOutput("request_response", JSON.stringify(response.data));
  } catch (e) {
    core.error(e.message || JSON.stringify(e, null, 2));
  }
})();
