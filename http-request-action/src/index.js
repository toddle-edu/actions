const axios = require("axios");
const core = require("@actions/core");

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
    console.log("📢 [index.js:19]", JSON.parse(headers), JSON.parse(data));
    core.setOutput("request_response", JSON.stringify(response.data));
  } catch (e) {
    core.error(e.message || JSON.stringify(e, null, 2));
  }
})();
