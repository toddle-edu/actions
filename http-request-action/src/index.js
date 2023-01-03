const axios = require("axios");
const core = require("@actions/core");

(async () => {
  try {
    // const url =
    //   "https://hooks.slack.com/services/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";
    // const method = "POST";
    // const headers = '{"Content-Type": "application/json"}';
    // const data = `{ "blocks": [ { "type": "section", "text": { "type": "mrkdwn", "text": "Hi, This is Git-hub action.\\n Pipeline for staging has started.\\n Action done by gaurang_toddle." } } ] }`;
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
    // console.log("📢 [index.js:19]", response);
    core.setOutput("request_response", JSON.stringify(response.data));
  } catch (e) {
    // console.log(e);
    core.error(e.message || JSON.stringify(e, null, 2));
  }
})();
